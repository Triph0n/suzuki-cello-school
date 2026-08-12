// Generates placeholder ensemble stems as mono WAV files until real cello
// recordings replace them. Karplus-Strong plucked strings in cello register,
// both parts rendered to exactly the same length so they stay in sync.
//
// Usage: node ops/generate-stems.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 16000; // placeholder quality; real stems will be opus
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "stems");

const midiToFreq = (midi) => 440 * 2 ** ((midi - 69) / 12);

// Twinkle, Twinkle (A B A), notes as [midi, beats]. Cello register: C3 = 48.
const PHRASE_A = [
  [48, 1], [48, 1], [55, 1], [55, 1], [57, 1], [57, 1], [55, 2],
  [53, 1], [53, 1], [52, 1], [52, 1], [50, 1], [50, 1], [48, 2]
];
const PHRASE_B = [
  [55, 1], [55, 1], [53, 1], [53, 1], [52, 1], [52, 1], [50, 2],
  [55, 1], [55, 1], [53, 1], [53, 1], [52, 1], [52, 1], [50, 2]
];
const MELODY = [...PHRASE_A, ...PHRASE_B, ...PHRASE_A];

// Second cello: harmony roots in half notes (I I IV I | IV I V I pattern).
const ACC_A = [
  [36, 2], [36, 2], [41, 2], [36, 2],
  [41, 2], [36, 2], [43, 2], [36, 2]
];
const ACC_B = [
  [43, 2], [41, 2], [40, 2], [43, 2],
  [43, 2], [41, 2], [40, 2], [43, 2]
];
const ACCOMP = [...ACC_A, ...ACC_B, ...ACC_A];

const TOTAL_BEATS = MELODY.reduce((sum, [, beats]) => sum + beats, 0);
const TAIL_SECONDS = 2;

function pluck(out, startSample, freq, seconds, gain) {
  const period = Math.max(2, Math.round(SAMPLE_RATE / freq));
  const buf = new Float64Array(period);
  for (let i = 0; i < period; i++) buf[i] = Math.random() * 2 - 1;
  // soften the attack: one smoothing pass over the initial noise burst
  for (let i = 1; i < period; i++) buf[i] = (buf[i] + buf[i - 1]) / 2;

  const samples = Math.min(
    Math.floor(seconds * SAMPLE_RATE),
    out.length - startSample
  );
  const decay = 0.997;
  for (let i = 0; i < samples; i++) {
    const value = buf[i % period];
    const next = buf[(i + 1) % period];
    buf[i % period] = decay * 0.5 * (value + next);
    // short linear fade-out at the very end keeps note tails click-free
    const fade = Math.min(1, (samples - i) / (SAMPLE_RATE * 0.05));
    out[startSample + i] += value * gain * fade;
  }
}

function renderPart(notes, bpm, gain) {
  const spb = 60 / bpm;
  const length = Math.floor((TOTAL_BEATS * spb + TAIL_SECONDS) * SAMPLE_RATE);
  const out = new Float64Array(length);
  let beat = 0;
  for (const [midi, beats] of notes) {
    const start = Math.floor(beat * spb * SAMPLE_RATE);
    // let each pluck ring a little past its slot for a legato feel
    pluck(out, start, midiToFreq(midi), beats * spb * 1.35, gain);
    beat += beats;
  }
  // normalize to a safe peak
  let peak = 0;
  for (const v of out) peak = Math.max(peak, Math.abs(v));
  const scale = peak > 0 ? 0.85 / peak : 1;
  const pcm = new Int16Array(length);
  for (let i = 0; i < length; i++) {
    pcm[i] = Math.max(-32768, Math.min(32767, Math.round(out[i] * scale * 32767)));
  }
  return pcm;
}

function writeWav(path, pcm) {
  const dataSize = pcm.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // PCM chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  Buffer.from(pcm.buffer, pcm.byteOffset, dataSize).copy(buffer, 44);
  writeFileSync(path, buffer);
  console.log(`${path} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
}

const TEMPOS = { concert: 100, practice: 72 };
const dir = join(OUT_DIR, "twinkle-duo");
mkdirSync(dir, { recursive: true });
for (const [tempo, bpm] of Object.entries(TEMPOS)) {
  writeWav(join(dir, `cello1.${tempo}.wav`), renderPart(MELODY, bpm, 1));
  writeWav(join(dir, `cello2.${tempo}.wav`), renderPart(ACCOMP, bpm, 0.8));
}
