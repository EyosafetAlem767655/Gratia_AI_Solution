/**
 * Builds the background video the site is designed around.
 *
 *   node scripts/fetch-assets.mjs          # build anything missing
 *   node scripts/fetch-assets.mjs --force  # rebuild everything
 *
 * The source is a 14.7MB 1920x1080 redwood-forest clip on CloudFront. It is
 * downloaded once into a gitignored scratch directory; only the processed
 * output lives in the repo.
 *
 * The desktop rendition is a *lossless remux*, not a re-encode — quality is
 * preserved exactly, as requested. A smaller rendition is generated for
 * phones, which cannot display the full resolution anyway.
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
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260803_192301_9231ed6b-c55c-4a48-909c-4ebe11cf2e11.mp4";
const SOURCE = join(SCRATCH, "forest-source.mp4");
const SOURCE_BYTES = 14_669_473;

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
    console.log(`  skip  source.mp4 (${(existing / 1048576).toFixed(2)}MB)`);
    return;
  }

  await mkdir(SCRATCH, { recursive: true });
  console.log("  get   forest-source.mp4 (14.7MB, one time)...");

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

const RENDITIONS = [
  {
    name: "forest.mp4",
    // `-c:v copy` — the video stream is passed through untouched, so this is
    // the *same pixels* as the source at the same bitrate. The only change is
    // the container: +faststart and no audio track. Quality as-is, by
    // construction rather than by choosing a gentle CRF.
    args: ["-c:v", "copy"],
    maxBytes: 16_000_000,
  },
  {
    name: "forest-sm.mp4",
    // The one place a re-encode is justified. A 390px-wide phone cannot
    // resolve 1080p detail, so dropping to 960 wide costs nothing visible on
    // the devices that receive it, and saves those devices ~12MB of mobile
    // data. CRF 26 is high quality — this footage is fine foliage and haze,
    // which punishes aggressive compression.
    args: ["-vf", "scale=960:-2", "-c:v", "libx264", "-profile:v", "high",
           "-pix_fmt", "yuv420p", "-preset", "slow", "-crf", "26"],
    maxBytes: 4_500_000,
  },
];

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
  const flag = bytes > maxBytes ? "  <-- OVER BUDGET" : "";
  console.log(`  make  ${name} (${(bytes / 1048576).toFixed(2)}MB)${flag}`);
}

async function poster() {
  const dest = join(OUT, "forest-poster.jpg");
  if (!force && (await sizeOf(dest)) !== null) {
    console.log(`  skip  forest-poster.jpg`);
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
  console.log(`  make  forest-poster.jpg (${((await sizeOf(dest)) / 1024).toFixed(0)}KB)`);
}

console.log("Building background video\n");

await mkdir(OUT, { recursive: true });
await download();
for (const rendition of RENDITIONS) await encode(rendition);
await poster();

const shipped = await Promise.all(
  ["forest.mp4", "forest-sm.mp4", "forest-poster.jpg"].map((f) => sizeOf(join(OUT, f))),
);
console.log(`\nDone — ${(shipped.reduce((a, b) => a + b, 0) / 1048576).toFixed(2)}MB shipped in public/video.`);
