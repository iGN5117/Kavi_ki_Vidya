#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const OpenAI = require("openai");
require("dotenv").config();

const outputDir = process.argv[2] || "/private/tmp/kavi-voice-samples";
const model = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const text =
  "Namaste, I am Kavi. We will practice English slowly and confidently. First, say: I am learning English every day.";

const instructions =
  "Speak as a warm Indian English woman coach for adult learners. Use a calm, clear, natural Indian English accent, medium-slow pace, and gentle encouragement. Do not exaggerate the accent.";

const samples = [
  { voice: "nova", label: "warm-clear" },
  { voice: "shimmer", label: "soft-supportive" },
  { voice: "coral", label: "bright-friendly" },
];

async function createSample(sample) {
  const fileName = `kavi-${sample.label}-${sample.voice}.mp3`;
  const outputPath = path.join(outputDir, fileName);

  const speech = await openai.audio.speech.create({
    model,
    voice: sample.voice,
    input: text,
    instructions,
    response_format: "mp3",
  });

  fs.writeFileSync(outputPath, Buffer.from(await speech.arrayBuffer()));
  return outputPath;
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const outputs = [];
  for (const sample of samples) {
    try {
      const outputPath = await createSample(sample);
      outputs.push({ ...sample, outputPath });
      console.log(`${sample.label}: ${outputPath}`);
    } catch (error) {
      console.error(`${sample.label} (${sample.voice}) failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (outputs.length === 0) {
    throw new Error("No voice samples were generated.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
