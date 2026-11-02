// kokoro-tts.mjs
// Generate a WAV file from text with kokoro-js, running locally in Node.
//
// Setup:
//   npm init -y
//   npm i kokoro-js
//
// Usage:
//   node kokoro-tts.mjs
//   node kokoro-tts.mjs "Hello from Node!" output.wav bf_emma
//   node kokoro-tts.mjs --list-voices

import { KokoroTTS } from "kokoro-js";

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

const args = process.argv.slice(2);

// The model is downloaded from Hugging Face on first run and cached afterwards.
console.log("Loading model (first run downloads it)...");
const tts = await KokoroTTS.from_pretrained(MODEL_ID, {
  dtype: "q8",   // "fp32" | "fp16" | "q8" | "q4" | "q4f16" (q8 = small and fast on CPU)
  device: "cpu", // use "cpu" in Node.js
});

if (args[0] === "--list-voices") {
  console.log(tts.list_voices());
  process.exit(0);
}

const text =
  args[0] ?? "Life is like a box of chocolates. You never know what you're gonna get.";
const outFile = args[1] ?? "audio.wav";
const voice = args[2] ?? "af_heart"; // af_ = American female, bm_ = British male, etc.

console.log(`Generating speech with voice "${voice}"...`);
const audio = await tts.generate(text, { voice });

await audio.save(outFile);
console.log(`Saved ${outFile}`);
