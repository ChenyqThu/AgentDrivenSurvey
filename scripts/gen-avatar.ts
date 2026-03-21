/**
 * AI Avatar Asset Generator
 * Uses Gemini 3.1 Flash Image (Nano Banana 2) to generate avatar assets.
 *
 * Usage:
 *   GEMINI_API_KEY=xxx npx tsx scripts/gen-avatar.ts --preset avatar-light
 *   GEMINI_API_KEY=xxx npx tsx scripts/gen-avatar.ts --preset all
 *   GEMINI_API_KEY=xxx npx tsx scripts/gen-avatar.ts --prompt "a glowing orb" --output public/images/test.png
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ── Config ──
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3.1-flash-image-preview";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

// ── Preset Prompts ──
const PRESETS: Record<string, { prompt: string; output: string }> = {
  "avatar-light": {
    prompt:
      "Generate an image: A minimal abstract glowing orb icon on a pure white background. The orb is a soft sphere with an inner gradient transitioning from deep sapphire blue (#3B5BDB) on the left to warm amber (#F59F00) on the right. The surface has a subtle glass-like refraction effect with a gentle specular highlight at the top-left. Surrounded by a soft diffused glow halo in warm amber tones, giving a feeling of warmth and intelligence. The overall style is clean, modern, tech-forward yet approachable. No face, no features, just pure luminous energy. Flat design with subtle depth, suitable for a professional AI research assistant avatar. High resolution, crisp edges, centered composition. Square 1:1 aspect ratio. No text. No background elements.",
    output: "public/images/agent-avatar.png",
  },
  "avatar-dark": {
    prompt:
      "Generate an image: A minimal abstract glowing orb icon on a pure black background (#0F1117), designed for dark interfaces. The orb is a luminous sphere with an inner gradient from electric blue (#6C8AFF) on the left to golden amber (#FFB84D) on the right. Brighter and more emissive than a typical icon, with a prominent outer glow. The glow extends outward in concentric soft rings of warm amber light against darkness. Glass-like surface with a bright specular highlight. Clean, modern, ethereal. Conveys advanced technology with human warmth. Suitable as an AI assistant avatar on dark backgrounds. High resolution, centered. Square 1:1 aspect ratio. No text.",
    output: "public/images/agent-avatar-dark.png",
  },
  "bg-grid-light": {
    prompt:
      "Generate an image: A seamless tileable subtle dot grid pattern on a very light gray background (#FAFBFD). Tiny dots (1-2px) arranged in a regular grid with 20px spacing. Dot color is very light gray (#E5E7EB). Some dots are slightly larger and have a faint blue tint, scattered randomly. Clean, minimal, tech-inspired. Suitable as a repeating background texture. Square 1:1. No text, no icons.",
    output: "public/images/bg-grid-light.png",
  },
  "completion-burst": {
    prompt:
      "Generate an image: An abstract celebration burst of soft light particles dispersing outward from a central point on a white background. Particles are small circles in warm amber (#F59F00, #FFB84D) and cool blue (#6C8AFF, #3B5BDB) tones, varying in size from tiny to small. The burst pattern is organic and gentle, not explosive — more like a dandelion releasing seeds. Particles have subtle motion blur trails. The overall composition is centered, symmetrical but organic. Professional, elegant, suitable for a task completed celebration moment. Landscape 16:9 ratio. No confetti, no text, no icons, no faces.",
    output: "public/images/completion-burst.png",
  },
};

// ── CLI Parsing ──
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--") && i + 1 < args.length) {
      parsed[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }
  return parsed;
}

// ── Gemini generateContent with image output ──
async function generateImage(prompt: string): Promise<Buffer> {
  const url = `${API_BASE}/models/${MODEL}:generateContent?key=${API_KEY}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
      temperature: 1.0,
    },
  };

  console.log(`\n🎨 Generating with model: ${MODEL}`);
  console.log(`📝 Prompt: ${prompt.slice(0, 120)}...`);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API error ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = await res.json();

  // Extract image from response parts
  const candidates = data.candidates ?? [];
  for (const candidate of candidates) {
    const parts = candidate.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        return Buffer.from(part.inlineData.data, "base64");
      }
    }
  }

  // Debug: show what we got
  const preview = JSON.stringify(data).slice(0, 800);
  throw new Error(`No image in response. Got: ${preview}`);
}

// ── Resize using sips (macOS built-in) ──
function resizeImage(inputPath: string, outputPath: string, width: number, height: number) {
  const { execSync } = require("child_process");
  execSync(`cp "${inputPath}" "${outputPath}"`);
  execSync(`sips -z ${height} ${width} "${outputPath}" --out "${outputPath}"`, { stdio: "pipe" });
  console.log(`  📐 Resized to ${width}x${height} → ${path.basename(outputPath)}`);
}

// ── Main ──
async function main() {
  if (!API_KEY) {
    console.error("❌ Set GEMINI_API_KEY environment variable");
    process.exit(1);
  }

  const args = parseArgs();
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(__dirname, "..");

  // Ensure output directory exists
  const imgDir = path.join(projectRoot, "public/images");
  if (!existsSync(imgDir)) mkdirSync(imgDir, { recursive: true });

  if (args.preset) {
    const presetNames = args.preset === "all" ? Object.keys(PRESETS) : [args.preset];

    for (const name of presetNames) {
      const preset = PRESETS[name];
      if (!preset) {
        console.error(`❌ Unknown preset: ${name}. Available: ${Object.keys(PRESETS).join(", ")}`);
        continue;
      }

      console.log(`\n━━━ Preset: ${name} ━━━`);
      try {
        const imageBuffer = await generateImage(preset.prompt);
        const outputPath = path.join(projectRoot, preset.output);
        writeFileSync(outputPath, imageBuffer);
        console.log(`✅ Saved: ${preset.output} (${(imageBuffer.length / 1024).toFixed(1)}KB)`);

        // Auto-generate small version for avatar presets
        if (name === "avatar-light") {
          resizeImage(outputPath, path.join(projectRoot, "public/images/agent-avatar-sm.png"), 32, 32);
        } else if (name === "avatar-dark") {
          resizeImage(outputPath, path.join(projectRoot, "public/images/agent-avatar-sm-dark.png"), 32, 32);
        }
      } catch (err) {
        console.error(`❌ Failed [${name}]:`, err instanceof Error ? err.message : err);
      }
    }
  } else {
    // Custom prompt mode
    const prompt = args.prompt ?? "Generate an image of a glowing blue-to-amber gradient orb on white background, minimal, clean, centered";
    const output = args.output ?? "public/images/generated.png";

    try {
      const imageBuffer = await generateImage(prompt);
      const outputPath = path.join(projectRoot, output);
      writeFileSync(outputPath, imageBuffer);
      console.log(`\n✅ Saved: ${output} (${(imageBuffer.length / 1024).toFixed(1)}KB)`);
    } catch (err) {
      console.error("❌ Generation failed:", err instanceof Error ? err.message : err);
    }
  }

  console.log("\n🎉 Done!");
}

main().catch(console.error);
