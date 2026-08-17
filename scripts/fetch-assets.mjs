/**
 * Builds the background video the site is designed around.
 *
 *   node scripts/fetch-assets.mjs          # build anything missing
 *   node scripts/fetch-assets.mjs --force  # rebuild everything
 *
 * The source is an 18.2MB 1928x1072 clip on CloudFront — a humanoid robot
 * standing in a field of light. It is
 * downloaded once into a gitignored scratch directory; only the processed
 * output lives in the repo.
 *
 * THREE RENDITIONS, ONE PER VIEWPORT CLASS. The previous version shipped the
 * desktop file as a lossless remux (`-c:v copy`), which meant every visitor
 * downloaded the raw source: 18.2MB at 12,066 kb/s, roughly six times a normal
 * web hero. Playback outran the download and the film stalled mid-loop. The
 * quality was real and nobody could see it, because the clip sits behind a
 * scrim, a vignette and a dimmer.
 *
 * FILENAMES ARE A CACHE CONTRACT. next.config.ts serves /video/* as
 * `public, max-age=31536000, immutable`, and these names carry no content
 * hash. A browser that has fetched `hero-1920.mp4` will not ask again for a
 * year. So: re-encoding in place ships nothing to anyone who has already
 * visited. Any future change to the encode MUST also change the filename —
 * bump to `hero-1920.v2.mp4` or similar and update <VideoField>.
 *
 * Two encoder flags are doing real work and should not be dropped:
 *
 * - `-movflags +faststart` relocates the moov atom to the front of the file.
 *   Without it the browser has to buffer the entire clip before it can show a
 *   single frame, which defeats the whole point of compressing it.
 * - `-an` strips audio. The clip has none worth keeping, and a silent track
 *   still costs bytes and can trip autoplay heuristics.
 *
 * ffmpeg comes from `ffmpeg-static` (a devDependency). It is GPL-3.0: we only
 * invoke the stock binary as a build tool, and the encoded videos are data
 * rather than derivative works, so nothing propagates into the shipped site.
 */

import { execFile } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, stat, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public/video");
const SCRATCH = join(ROOT, ".cache/video");

const SOURCE_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260411_104032_69319010-2458-492b-b04d-b40a5dfa4482.mp4";
const SOURCE = join(SCRATCH, "hero-source.mp4");
const SOURCE_BYTES = 18_163_484;

const force = process.argv.includes("--force");

async function sizeOf(path) {
  try {
    return (await stat(path)).size;
  } catch {
    return null;
  }
}

async function download() {
  const existing = await sizeOf(SOURCE);
  // The source is immutable at its URL, so a file of the right size is the
  // right file. A partial download from an aborted run would otherwise be
  // kept forever and every encode would silently work from a truncated clip.
  if (!force && existing !== null && Math.abs(existing - SOURCE_BYTES) / SOURCE_BYTES < 0.02) {
    console.log(`  skip  hero-source.mp4 (${(existing / 1048576).toFixed(2)}MB)`);
    return;
  }

  await mkdir(SCRATCH, { recursive: true });
  console.log("  get   hero-source.mp4 (18.2MB, one time)...");

  const response = await fetch(SOURCE_URL);
  if (!response.ok || !response.body) {
    throw new Error(`${response.status} ${response.statusText} for the source video`);
  }

  try {
    await pipeline(Readable.fromWeb(response.body), createWriteStream(SOURCE));
  } catch (error) {
    await unlink(SOURCE).catch(() => {});
    throw error;
  }
}

/**
 * Shared encoder settings. Notes on the non-obvious ones:
 *
 * - `-profile:v high` rather than the source's Main. The source encoder
 *   (h264_slapi) chose Main@L5.0, which gives up CABAC and the 8x8 transform —
 *   precisely the tools that pay for themselves on fine foliage and haze.
 * - `-preset slow` buys roughly 10% bitrate over `medium` for build time we
 *   spend once and visitors never do.
 * - `-g 48` is a keyframe every 2s at 24fps, so the loop seam is clean and the
 *   browser can start decoding quickly from a fresh range request.
 * - `-maxrate`/`-bufsize` cap the peak. CRF alone is unbounded on a hard
 *   scene, and an unbounded peak is what stalls playback on a slow link.
 */
const BASE = (crf, maxrate) => [
  "-c:v", "libx264",
  "-profile:v", "high",
  "-pix_fmt", "yuv420p",
  "-preset", "slow",
  "-crf", String(crf),
  "-maxrate", maxrate,
  "-bufsize", `${parseInt(maxrate, 10) * 2}M`,
  "-g", "48",
];

/**
 * CRF 24 was chosen by measurement, not taste. Sweep against the source at
 * 1920, scored with SSIM (`ffmpeg ... ssim`):
 *
 *   crf 20 .......... 6.99MB   (over budget)
 *   crf 22 .......... 5.30MB   ssim 0.9933   (over budget)
 *   crf 24 .......... 3.96MB   ssim 0.9918   <-- chosen
 *   crf 26 .......... 2.99MB   ssim 0.9900
 *   crf 24 + aq3 .... 4.04MB   ssim 0.9919   (+2% size, +0.0001 ssim: not worth it)
 *
 * Anything at 0.99+ is indistinguishable from the source in motion. CRF 24 is
 * the point where the file fits its budget with quality still well clear of
 * where artefacts become findable on a paused frame — and it is a 4.6x
 * reduction on the 18.16MB the site used to ship.
 *
 * If you re-tune these, re-run the sweep rather than nudging the number.
 */
const RENDITIONS = [
  {
    // Desktop, 1440px viewports and up.
    name: "hero-1920.mp4",
    args: ["-vf", "scale=1920:-2", ...BASE(24, "5M")],
    maxBytes: 4_500_000,
  },
  {
    // Laptops and tablets. 1280-1439 is a very common viewport band and was
    // previously served the full 18MB file.
    name: "hero-1280.mp4",
    args: ["-vf", "scale=1280:-2", ...BASE(24, "3M")],
    maxBytes: 2_500_000,
  },
  {
    // Phones. A 390px-wide screen cannot resolve 1080p detail. This tier used
    // to be CRF 26 and came in at 21% of its budget, so it can afford to look
    // better while everything else gets smaller.
    name: "hero-960.mp4",
    args: ["-vf", "scale=960:-2", ...BASE(25, "2M")],
    maxBytes: 1_500_000,
  },
];

/** Set by `encode` when any rendition exceeds its budget; fails the run. */
let overBudget = false;

async function encode({ name, args, maxBytes }) {
  const dest = join(OUT, name);
  if (!force && (await sizeOf(dest)) !== null) {
    console.log(`  skip  ${name} (${((await sizeOf(dest)) / 1048576).toFixed(2)}MB)`);
    return;
  }

  await run(ffmpegPath, [
    "-y",
    "-i", SOURCE,
    ...args,
    "-movflags", "+faststart",
    "-an",
    dest,
  ], { maxBuffer: 1 << 26 });

  const bytes = await sizeOf(dest);
  // A warning is not enough. The 18MB desktop file shipped for weeks under a
  // printed `<-- OVER BUDGET` nobody was reading, so this now fails the build.
  const flag = bytes > maxBytes
    ? `  <-- OVER BUDGET (max ${(maxBytes / 1048576).toFixed(2)}MB)`
    : "";
  if (flag) overBudget = true;
  console.log(`  make  ${name} (${(bytes / 1048576).toFixed(2)}MB)${flag}`);
}

async function poster() {
  const dest = join(OUT, "hero-poster.jpg");
  if (!force && (await sizeOf(dest)) !== null) {
    console.log(`  skip  hero-poster.jpg`);
    return;
  }
  // Sampled a little into the clip rather than at 0s: the very first frame
  // fades up from black and would give the page a blank first paint.
  await run(ffmpegPath, [
    "-y",
    "-ss", "1.5",
    "-i", SOURCE,
    "-frames:v", "1",
    "-vf", "scale=1920:-2",
    "-q:v", "4",
    dest,
  ], { maxBuffer: 1 << 26 });
  console.log(`  make  hero-poster.jpg (${((await sizeOf(dest)) / 1024).toFixed(0)}KB)`);
}

console.log("Building background video\n");

await mkdir(OUT, { recursive: true });
await download();
for (const rendition of RENDITIONS) await encode(rendition);
await poster();

const SHIPPED = [...RENDITIONS.map((r) => r.name), "hero-poster.jpg"];
const shipped = await Promise.all(SHIPPED.map((f) => sizeOf(join(OUT, f))));
const total = shipped.reduce((a, b) => a + (b ?? 0), 0);
console.log(`\nDone — ${(total / 1048576).toFixed(2)}MB shipped in public/video.`);

if (overBudget) {
  console.error("\nFAIL: a rendition exceeded its budget. Raise the CRF or lower the resolution.");
  process.exit(1);
}
