// Generates the two gamification concept images via Gemini (Nano Banana)
// and saves them to src/assets/gamification/.
//
// Usage (PowerShell):
//   $env:GEMINI_API_KEY = "AIza..."   # e.g. the key from Projects\Bingo\boardgame-assistant\.env
//   node ops/generate-gamification-images.mjs
//
// Requires Node 18+ (global fetch). No npm dependencies.

import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("Set GEMINI_API_KEY first.");
  process.exit(1);
}

// Preferred image models, newest first; the script falls back automatically.
const MODELS = [
  "gemini-3.1-flash-image", // Nano Banana 2
  "gemini-3-pro-image-preview", // Nano Banana Pro
  "gemini-2.5-flash-image", // Nano Banana 1
];

const OUT_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "assets",
  "gamification"
);

const IMAGES = [
  {
    file: "cellino-mascot.png",
    prompt:
      "Cute children's app mascot: a small anthropomorphic cello character named Cellino, " +
      "fuzzy warm wooden body, big friendly eyes, tiny arms holding a bow, wearing a short " +
      "pearl necklace, joyful expression, jumping with excitement. Flat vector sticker style, " +
      "soft rounded shapes, warm palette (honey wood, burgundy #722F37, gold #C6A15B, cream " +
      "background #FAF7F2), for a music practice app for children aged 6-9. No text.",
  },
  {
    file: "sticker-album-animals.png",
    prompt:
      "Sticker sheet for a children's music app: six collectible animal orchestra stickers " +
      "arranged in a grid — a mouse playing violin, a bear playing double bass, a fox playing " +
      "cello, an owl conducting, a rabbit playing flute, a hedgehog playing drums. Flat vector " +
      "sticker style with white sticker borders, soft rounded shapes, warm palette (burgundy, " +
      "gold, cream), cheerful, for children aged 6-9. No text.",
  },
];

async function generate(model, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    }
  );
  if (!res.ok) throw new Error(`${model}: HTTP ${res.status} ${await res.text()}`);
  const data = await res.json();
  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part) throw new Error(`${model}: no image in response`);
  return Buffer.from(part.inlineData.data, "base64");
}

await mkdir(OUT_DIR, { recursive: true });

for (const image of IMAGES) {
  let saved = false;
  for (const model of MODELS) {
    try {
      const buffer = await generate(model, image.prompt);
      const target = path.join(OUT_DIR, image.file);
      await writeFile(target, buffer);
      console.log(`OK  ${image.file}  (${model}, ${(buffer.length / 1024).toFixed(0)} kB)`);
      saved = true;
      break;
    } catch (error) {
      console.warn(`--  ${image.file}: ${error.message}`);
    }
  }
  if (!saved) {
    console.error(`FAILED: ${image.file} — no model produced an image.`);
    process.exitCode = 1;
  }
}
