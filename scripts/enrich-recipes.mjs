// One-time backfill: tags weeklyRecipes.json with mealType/cookingMethod/allergens/
// dietTags and normalizes difficulty/cuisine. Idempotent — skips already-enriched
// recipes. Usage: node --env-file=.env scripts/enrich-recipes.mjs [--dry] [--limit N]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { needsEnrichment, buildPrompt, mergeEnrichment } from "./enrichPrompt.mjs";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dir, "../src/data/weeklyRecipes.json");
const dry = process.argv.includes("--dry");
const limArg = process.argv.indexOf("--limit");
const limit = limArg > -1 ? parseInt(process.argv[limArg + 1], 10) : Infinity;

const apiKey = process.env.VITE_CLAUDE_KEY || process.env.ANTHROPIC_API_KEY;
if (!apiKey) { console.error("No API key (VITE_CLAUDE_KEY / ANTHROPIC_API_KEY)"); process.exit(1); }
const client = new Anthropic({ apiKey });
const MODEL = "claude-haiku-4-5-20251001"; // classification task — cheap model is enough

async function classify(recipe) {
  const msg = await client.messages.create({
    model: MODEL, max_tokens: 400,
    messages: [{ role: "user", content: buildPrompt(recipe) }],
  });
  const text = msg.content.map(b => b.text || "").join("");
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(json);
}

const recipes = JSON.parse(fs.readFileSync(DATA, "utf8"));
let done = 0, changed = 0;
for (const r of recipes) {
  if (done >= limit) break;
  if (!needsEnrichment(r)) continue;
  done++;
  try {
    const ai = await classify(r);
    const merged = mergeEnrichment(r, ai);
    Object.assign(r, merged);
    changed++;
    console.log(`✓ [${changed}] ${r.id} ${r.title.slice(0, 40)} — ${r.mealType}/${r.cookingMethod}/${(r.allergens||[]).join(",")}`);
  } catch (e) {
    console.error(`✗ ${r.id} ${r.title.slice(0, 40)}: ${e.message}`);
  }
}
if (!dry) fs.writeFileSync(DATA, JSON.stringify(recipes, null, 2) + "\n");
console.log(`\nProcessed ${done}, changed ${changed}${dry ? " (dry run, not written)" : ""}.`);
