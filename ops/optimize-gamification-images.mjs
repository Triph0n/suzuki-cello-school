// Converts the Gemini-generated gamification PNGs to display-sized WebP and
// renders the PWA icons from public/favicon.svg. Re-run after regenerating
// any source art: node ops/optimize-gamification-images.mjs
import sharp from "sharp";
import { readdir, access, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gamiDir = path.join(root, "src", "assets", "gamification");

// Target widths = 2x the largest rendered size (w-28/w-44/w-12 etc.).
const TARGETS = [
  { file: "cellino-mascot.png", width: 224 },
  { file: "cellino-sleeping.png", width: 224 },
  { file: "cellino-cheering.png", width: 224 },
  { file: "chest-closed.png", width: 352 },
  { file: "chest-open.png", width: 352 },
  { file: "metronome-gold.png", width: 128 },
];

async function convert(src, dest, width) {
  await sharp(src)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(dest);
  console.log(`${path.basename(dest)} written`);
}

for (const { file, width } of TARGETS) {
  const src = path.join(gamiDir, file);
  try {
    await access(src);
  } catch {
    console.warn(`skip ${file} (missing)`);
    continue;
  }
  await convert(src, src.replace(/\.png$/, ".webp"), width);
  await unlink(src);
}

const stickerDir = path.join(gamiDir, "stickers");
for (const file of await readdir(stickerDir)) {
  if (!file.endsWith(".png")) continue;
  const src = path.join(stickerDir, file);
  await convert(src, src.replace(/\.png$/, ".webp"), 224);
  await unlink(src);
}

// PWA icons from the favicon.
const favicon = path.join(root, "public", "favicon.svg");
for (const size of [192, 512]) {
  await sharp(favicon, { density: 300 })
    .resize(size, size, { fit: "contain", background: "#faf6ef" })
    .png()
    .toFile(path.join(root, "public", `pwa-${size}x${size}.png`));
  console.log(`pwa-${size}x${size}.png written`);
}
