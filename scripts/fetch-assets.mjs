/** Build versioned, higher-quality hero assets from the original source.
 * Run node scripts/fetch-assets.mjs. Use --force only to redownload/rebuild.
 * Changed encodes require new filenames because /video has immutable caching.
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

/** H.264 High / yuv420p, slow encoding, bounded peaks, 2-second keyframes. */
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

const RENDITIONS = [
  {
    // Full-resolution rendition for large, tall, or high-DPR surfaces.
    name: "hero-1920.v2.mp4",
    args: ["-vf", "scale=1920:-2", ...BASE(20, "8M")],
    maxBytes: 8_000_000,
  },
  {
    // Intermediate object-cover surfaces.
    name: "hero-1280.v2.mp4",
    args: ["-vf", "scale=1280:-2", ...BASE(20, "5M")],
    maxBytes: 5_000_000,
  },
  {
    // Small surfaces only; portrait phones often need the full-resolution tier.
    name: "hero-960.v2.mp4",
    args: ["-vf", "scale=960:-2", ...BASE(20, "3M")],
    maxBytes: 3_000_000,
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
  const dest = join(OUT, "hero-poster.v2.jpg");
  if (!force && (await sizeOf(dest)) !== null) {
    console.log(`  skip  hero-poster.v2.jpg`);
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
    "-q:v", "2",
    dest,
  ], { maxBuffer: 1 << 26 });
  console.log(`  make  hero-poster.v2.jpg (${((await sizeOf(dest)) / 1024).toFixed(0)}KB)`);
}

console.log("Building background video\n");

await mkdir(OUT, { recursive: true });
await download();
for (const rendition of RENDITIONS) await encode(rendition);
await poster();

const SHIPPED = [...RENDITIONS.map((r) => r.name), "hero-poster.v2.jpg"];
const shipped = await Promise.all(SHIPPED.map((f) => sizeOf(join(OUT, f))));
const total = shipped.reduce((a, b) => a + (b ?? 0), 0);
console.log(`\nDone — ${(total / 1048576).toFixed(2)}MB shipped in public/video.`);

if (overBudget) {
  console.error("\nFAIL: a rendition exceeded its budget. Raise the CRF or lower the resolution.");
  process.exit(1);
}
