/**
 * One-off asset step: trim the transparent margin from the source logo and
 * re-tint its silver chrome to the brand's lilac-chrome so it harmonises with
 * the Violet Nebula background. Keeps a backup of the untouched original.
 *
 * Usage: node scripts/process-logo.mjs
 */
import { copyFileSync, existsSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const SRC = "public/logo.png";
const BACKUP = "public/logo-original.png";

// Preserve the original once.
if (!existsSync(BACKUP)) {
  copyFileSync(SRC, BACKUP);
  console.log("backed up original ->", BACKUP);
}

const source = existsSync(BACKUP) ? BACKUP : SRC;

const meta = await sharp(source).metadata();
const W = meta.width ?? 768;
const H = meta.height ?? 1376;

// Crop to the emblem + wordmark block (proportional), dropping the empty top/
// bottom margins and the stray corner sparkle that defeats an alpha-trim.
const region = {
  left: Math.round(W * 0.015),
  top: Math.round(H * 0.235),
  width: Math.round(W * 0.97),
  height: Math.round(H * 0.55),
};

const { data, info } = await sharp(source)
  .extract(region)
  .trim({ threshold: 20 }) // tighten any remaining transparent edge
  .tint({ r: 211, g: 193, b: 239 }) // lilac-chrome (#D3C1EF)
  .modulate({ brightness: 1.06, saturation: 1.1 })
  .png()
  .toBuffer({ resolveWithObject: true });

writeFileSync(SRC, data);

const aspect = (info.height / info.width).toFixed(4);
console.log(
  JSON.stringify(
    { trimmedWidth: info.width, trimmedHeight: info.height, heightOverWidth: aspect },
    null,
    2,
  ),
);
