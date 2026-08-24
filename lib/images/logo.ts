/**
 * sharp is loaded on demand, never at module scope.
 *
 * It is a native module. When its platform binary is missing — which is exactly
 * what happened on Vercel, where `@img/sharp-libvips-linux-x64` was left out of
 * the traced bundle and `libvips-cpp.so` could not be dlopen'd — a top-level
 * import throws while the module is being evaluated. That took down the whole
 * Telegram webhook with a 500 on every update, because the route imports this
 * file transitively. A logo-tidying nicety must never be able to do that, so
 * the import happens inside the function and callers are expected to catch.
 */
async function loadSharp() {
  return (await import("sharp")).default;
}


/**
 * Lifts a client logo off whatever background it arrived on, so it can sit
 * directly on the site's near-black canvas.
 *
 * People send logos as JPEGs exported from a deck or a website: opaque, on
 * white or near-white, often with a faint gradient and JPEG ringing around the
 * letterforms. Dropped onto a dark page as-is, that reads as a bright rectangle
 * with a logo trapped inside it. The fix is to key out the background and hand
 * back a PNG with a real alpha channel.
 *
 * The approach is a tolerant chroma key rather than anything clever:
 *
 *   1. Estimate the background from the border pixels, using a median so a mark
 *      that touches an edge cannot drag the estimate toward itself.
 *   2. Bail out if the border is not reasonably uniform. A photographic or
 *      busy-edged image has no background to remove, and guessing would eat
 *      part of the artwork.
 *   3. Key with two thresholds, not one. Inside the inner radius a pixel is
 *      fully transparent; between inner and outer its alpha ramps. That band is
 *      what keeps anti-aliased and JPEG-fringed edges from turning into a hard,
 *      speckled cutout.
 *   4. Trim the transparent margin so every logo is cropped to its own ink and
 *      they line up at a consistent visual size.
 *
 * Colour is left alone unless the result would be invisible: a logo that is
 * almost entirely dark ink gets lightened, because black-on-black is not a
 * design choice. Anything with its own colour — the common case — is untouched.
 */

/**
 * Every prepared logo is emitted on this exact canvas, transparent, centred.
 *
 * A fixed canvas is what lets the card render `h-20 w-auto` and have every mark
 * come out the same size. The dimensions are derived, not guessed: at
 * TARGET_INK the widest real logo (aspect 5.28) needs 345px and the tallest
 * (aspect 0.63) needs 189px, so 360x200 is the smallest canvas that holds both
 * extremes. Any wider and every logo renders smaller for no reason, because the
 * card scales the whole canvas, padding included.
 */
const CANVAS_W = 360;
const CANVAS_H = 200;

/**
 * Target optical area for the ink, as sqrt(width x height).
 *
 * THIS IS THE FIX FOR "some logos are small and unreadable". Constraining a
 * logo by height alone assumes every mark has a similar aspect ratio. The four
 * real logos in the database span 0.63 to 5.28 — a portrait estate agent's mark
 * and a long thin wordmark — so a shared 48px height rendered one at 30x48 and
 * the other at 253x48. Same height, wildly different presence.
 *
 * Normalising sqrt(area) instead means a tall mark gets to be tall and a wide
 * one wide, while both cover roughly the same number of pixels, which is what
 * the eye actually reads as "the same size".
 */
const TARGET_INK = 150;

/**
 * How far a small logo may be enlarged to reach TARGET_INK.
 *
 * Upscaling is a trade: at 1.6x a 227px wordmark is a little soft but legible,
 * and legible-and-soft beats crisp-and-30px-wide. Past that it turns to mush,
 * so the logo is simply allowed to be smaller than target.
 */
const MAX_UPSCALE = 1.6;

/** Squared RGB distance under which a pixel is definitely background. */
const INNER = 26 * 26 * 3;
/** ...and over which it is definitely not. Between the two, alpha ramps. */
const OUTER = 64 * 64 * 3;

/** Border must be at least this uniform for a background to be presumed. */
const MAX_BORDER_SPREAD = 46;

/** Mean luminance (0-255) below which the mark would vanish on the ink canvas. */
const TOO_DARK = 90;

export type PreparedLogo = {
  buffer: Buffer;
  contentType: string;
  /** What we did, for logging and for the bot's reply. */
  note: string;
};

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

/**
 * Estimate the background colour from the image border, and report how much
 * that border varies. High variance means "there is no flat background here".
 */
function sampleBorder(data: Buffer, width: number, height: number, channels: number) {
  const reds: number[] = [];
  const greens: number[] = [];
  const blues: number[] = [];

  const push = (x: number, y: number) => {
    const i = (y * width + x) * channels;
    // Ignore already-transparent border pixels: a PNG with a cut-out logo has
    // nothing to key, and its border alpha is the giveaway.
    if (channels === 4 && data[i + 3] < 8) return;
    reds.push(data[i]);
    greens.push(data[i + 1]);
    blues.push(data[i + 2]);
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  if (reds.length === 0) return null;

  const bg = [median(reds), median(greens), median(blues)] as const;
  // Mean absolute deviation from the median, averaged over channels. Robust
  // enough for a gradient backdrop, intolerant of a photograph.
  const spread =
    [reds, greens, blues].reduce((sum, channel, c) => {
      const m = bg[c];
      return sum + channel.reduce((s, v) => s + Math.abs(v - m), 0) / channel.length;
    }, 0) / 3;

  return { bg, spread };
}

export async function prepareLogo(input: Buffer): Promise<PreparedLogo> {
  const sharp = await loadSharp();
  const base = sharp(input, { failOn: "none" }).rotate();
  const meta = await base.metadata();

  const { data, info } = await base
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const sample = sampleBorder(data, width, height, channels);

  let note = "background removed";

  if (!sample) {
    note = "already transparent";
  } else if (sample.spread > MAX_BORDER_SPREAD) {
    // Busy edges: leave every pixel alone rather than punch holes in artwork.
    note = "no flat background detected, left as-is";
  } else {
    const [br, bg, bb] = sample.bg;
    for (let i = 0; i < data.length; i += channels) {
      if (data[i + 3] === 0) continue;
      const dr = data[i] - br;
      const dg = data[i + 1] - bg;
      const db = data[i + 2] - bb;
      const dist = dr * dr + dg * dg + db * db;

      if (dist <= INNER) {
        data[i + 3] = 0;
      } else if (dist < OUTER) {
        // Linear ramp across the feather band, scaled by any existing alpha.
        const t = (dist - INNER) / (OUTER - INNER);
        data[i + 3] = Math.round(data[i + 3] * t);
      }
    }
  }

  // Mean luminance of what survived, to decide whether it can be seen at all.
  let lumSum = 0;
  let opaque = 0;
  let transparent = 0;
  for (let i = 0; i < data.length; i += channels) {
    if (data[i + 3] < 128) {
      transparent++;
      continue;
    }
    lumSum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    opaque++;
  }
  const meanLum = opaque ? lumSum / opaque : 255;

  let pipeline = sharp(data, { raw: { width, height, channels } });

  if (opaque > 0 && meanLum < TOO_DARK) {
    // Dark ink on a light background: keying it out would leave near-black
    // artwork on a near-black page. Lift it instead of inverting, which would
    // wreck any colour the mark does have.
    pipeline = pipeline.modulate({ lightness: 100 }).linear(1.0, 90);
    note += ", lightened for the dark canvas";
  }

  let out = await pipeline.png({ compressionLevel: 9 }).toBuffer();

  // Crop away the transparent margin so logos with different amounts of
  // built-in padding all render at a comparable size.
  //
  // The condition is "has transparency", not "we keyed it". A logo that
  // arrived as a PNG with its background already cut out still carries whatever
  // padding the designer left around it, and skipping the trim there is what
  // made one test logo render at half the size of its neighbours. Images with
  // no transparency at all are left alone: trim would key off the top-left
  // pixel and could eat real artwork.
  if (transparent > 0) {
    out = await sharp(out)
      .trim({ threshold: 1 })
      .png({ compressionLevel: 9 })
      .toBuffer();
  }

  // Normalise to a constant optical area, then centre on the shared canvas.
  const trimmed = await sharp(out).metadata();
  const tw = trimmed.width ?? CANVAS_W;
  const th = trimmed.height ?? CANVAS_H;

  // Scale that would put the ink at the target area, capped for upscaling and
  // clamped so it can never overflow the canvas on either axis.
  const areaScale = TARGET_INK / Math.sqrt(tw * th);
  const scale = Math.min(
    Math.min(areaScale, MAX_UPSCALE),
    CANVAS_W / tw,
    CANVAS_H / th,
  );

  const inkW = Math.max(1, Math.round(tw * scale));
  const inkH = Math.max(1, Math.round(th * scale));

  out = await sharp(out)
    .resize(inkW, inkH, { fit: "fill" })
    .extend({
      // Centre it. Odd remainders go to the right/bottom, which is invisible at
      // this size and avoids an off-by-one that would fail the extend.
      top: Math.floor((CANVAS_H - inkH) / 2),
      bottom: Math.ceil((CANVAS_H - inkH) / 2),
      left: Math.floor((CANVAS_W - inkW) / 2),
      right: Math.ceil((CANVAS_W - inkW) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toBuffer();

  return {
    buffer: out,
    contentType: "image/png",
    note:
      `${meta.format ?? "image"} ${meta.width}x${meta.height} -> png ${CANVAS_W}x${CANVAS_H}, ` +
      `${note}, ink ${tw}x${th} -> ${inkW}x${inkH} (${scale.toFixed(2)}x)`,
  };
}
