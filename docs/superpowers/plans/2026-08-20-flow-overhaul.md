# Spotkokken Flow Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure Spotkokken's flow to match the deal-to-recipe guide — enrich recipe data with meal type / cooking method / allergens, split results filters into primary + secondary tiers, redesign recipe cards, and move diet/allergies into optional Profile settings — all without changing the existing visual style.

**Architecture:** Data-first. A one-time Node script backfills new fields onto the 149 recipes in `weeklyRecipes.json`; the generation API prompts are updated to emit them for new recipes. New pure logic lives in two small modules (`src/data/labels.js`, `src/recipeMeta.js`) so it's unit-testable with the existing `node --test` runner. The single-file React app (`src/App.jsx`) consumes those modules; UI changes reuse existing CSS classes and dark-mode tokens.

**Tech Stack:** React 19 (single-file `App.jsx`), Vite 8, `@anthropic-ai/sdk`, Supabase (cloud sync), `node --test` (built-in test runner), ESM everywhere.

**Spec:** `docs/superpowers/specs/2026-08-20-flow-overhaul-design.md`

---

## File Structure

- **Create** `src/data/labels.js` — canonical Danish/English label sets (allergens, diets, cuisines) + helpers. One responsibility: labelling vocabulary.
- **Create** `src/data/labels.test.js` — tests for the label helpers.
- **Create** `src/recipeMeta.js` — pure recipe-derived logic: prep-time bucketing, price/meal + price/person, allergen match, diet match, cuisine/difficulty normalization, meal-type/method display. One responsibility: deriving display/filter metadata from a recipe object.
- **Create** `src/recipeMeta.test.js` — tests for the above.
- **Create** `scripts/enrich-recipes.mjs` — one-time AI backfill for `weeklyRecipes.json`.
- **Create** `scripts/enrichPrompt.mjs` — pure prompt-building + merge logic (testable, no network).
- **Create** `scripts/enrichPrompt.test.js` — tests for prompt/merge logic.
- **Modify** `src/data/weeklyRecipes.json` — enriched in place by the script.
- **Modify** `api/match-recipes.js`, `api/generate-madspild-recipes.js` — generation prompt + schema updates.
- **Modify** `src/App.jsx` — settings state/UI, filter tiers, card redesign, onboarding cleanup.
- **Modify** `src/App.css` — only additive classes needed for new card rows / settings, reusing existing tokens.

---

## Task 1: Reference label constants (`src/data/labels.js`)

**Files:**
- Create: `src/data/labels.js`
- Test: `src/data/labels.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/data/labels.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { ALLERGENS, LIFESTYLE_DIETS, CUISINES, cuisineLabel, allergenLabel } from "./labels.js";

test("allergen list is the EU-14", () => {
  assert.equal(ALLERGENS.length, 14);
  assert.ok(ALLERGENS.find(a => a.da === "Sesamfrø" && a.en === "Sesame"));
  assert.ok(ALLERGENS.find(a => a.da === "Mælk / laktose"));
});

test("lifestyle diets are the six agreed", () => {
  assert.deepEqual(LIFESTYLE_DIETS.map(d => d.da),
    ["Vegetar", "Vegansk", "Pescetar", "Fleksitar", "Halal", "Kosher"]);
});

test("cuisines are the eight canonical badges", () => {
  assert.equal(CUISINES.length, 8);
  assert.equal(cuisineLabel("asiatisk", "da"), "Asiatisk");
});

test("label helpers fall back to the raw value", () => {
  assert.equal(allergenLabel("Ukendt", "da"), "Ukendt");
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm test`
Expected: FAIL — cannot find module `./labels.js`.

- [ ] **Step 3: Implement `src/data/labels.js`**

```js
// Canonical labelling vocabulary, imported everywhere labels appear (cards,
// filters, settings, enrichment) so the wording stays identical across the app.
// Each entry carries Danish (da, the primary market) + English (en).

export const ALLERGENS = [
  { key: "gluten",    da: "Gluten",                    en: "Gluten" },
  { key: "skaldyr",   da: "Skaldyr",                   en: "Crustaceans" },
  { key: "aeg",       da: "Æg",                        en: "Eggs" },
  { key: "fisk",      da: "Fisk",                      en: "Fish" },
  { key: "jordnodder",da: "Jordnødder",                en: "Peanuts" },
  { key: "soja",      da: "Soja",                      en: "Soybeans" },
  { key: "maelk",     da: "Mælk / laktose",            en: "Milk / lactose" },
  { key: "nodder",    da: "Nødder",                    en: "Tree nuts" },
  { key: "selleri",   da: "Selleri",                   en: "Celery" },
  { key: "sennep",    da: "Sennep",                    en: "Mustard" },
  { key: "sesam",     da: "Sesamfrø",                  en: "Sesame" },
  { key: "sulfitter", da: "Svovldioxid og sulfitter",  en: "Sulphur dioxide / sulphites" },
  { key: "lupin",     da: "Lupin",                     en: "Lupin" },
  { key: "bloddyr",   da: "Bløddyr",                   en: "Molluscs" },
];

export const LIFESTYLE_DIETS = [
  { key: "vegetar",  da: "Vegetar",   en: "Vegetarian" },
  { key: "vegansk",  da: "Vegansk",   en: "Vegan" },
  { key: "pescetar", da: "Pescetar",  en: "Pescetarian" },
  { key: "fleksitar",da: "Fleksitar", en: "Flexitarian" },
  { key: "halal",    da: "Halal",     en: "Halal" },
  { key: "kosher",   da: "Kosher",    en: "Kosher" },
];

export const CUISINES = [
  { key: "nordisk",     da: "Dansk / nordisk",  en: "Danish / Nordic", emoji: "🇩🇰" },
  { key: "italiensk",   da: "Italiensk",        en: "Italian",         emoji: "🇮🇹" },
  { key: "asiatisk",    da: "Asiatisk",         en: "Asian",           emoji: "🥢" },
  { key: "mellemostlig",da: "Mellemøstlig",     en: "Middle Eastern",  emoji: "🧆" },
  { key: "mexicansk",   da: "Mexicansk",        en: "Mexican",         emoji: "🌮" },
  { key: "indisk",      da: "Indisk",           en: "Indian",          emoji: "🍛" },
  { key: "amerikansk",  da: "Amerikansk",       en: "American",        emoji: "🇺🇸" },
  { key: "europaeisk",  da: "Fransk / europæisk",en: "French / European",emoji: "🇫🇷" },
];

function lookup(list, value, lang) {
  if (!value) return "";
  const v = String(value).toLowerCase();
  const hit = list.find(x => x.key === v || x.da.toLowerCase() === v || x.en.toLowerCase() === v);
  return hit ? (lang === "en" ? hit.en : hit.da) : value;
}

export const allergenLabel = (v, lang = "da") => lookup(ALLERGENS, v, lang);
export const dietLabelFull  = (v, lang = "da") => lookup(LIFESTYLE_DIETS, v, lang);
export const cuisineLabel   = (v, lang = "da") => lookup(CUISINES, v, lang);
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm test`
Expected: PASS (all label tests).

- [ ] **Step 5: Commit**

```bash
git add src/data/labels.js src/data/labels.test.js
git commit -m "feat: canonical allergen/diet/cuisine label constants"
```

---

## Task 2: Recipe metadata helpers (`src/recipeMeta.js`)

**Files:**
- Create: `src/recipeMeta.js`
- Test: `src/recipeMeta.test.js`

Note: `calcPricePerPerson` already exists in `App.jsx:344`. This module adds the
sibling helpers and a shared `pricePerMeal`. App.jsx will import from here (Task 8) so
the logic isn't duplicated.

- [ ] **Step 1: Write the failing test**

```js
// src/recipeMeta.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseMinutes, prepBucket, pricePerMeal, pricePerPerson,
  normalizeDifficulty, normalizeCuisineKey, recipeAllergens, matchesLifestyleDiet,
} from "./recipeMeta.js";

const recipe = {
  time: "25 minutter", servings_count: 4,
  difficulty: "Let", cuisine: "🇯🇵 Asiatisk",
  allergens: ["Soja", "Sesamfrø"],
  ingredients: [
    { text: "Kylling 560 g", price: "35 kr.", isPantry: false },
    { text: "Nudler 300 g",  price: "10 kr.", isPantry: false },
    { text: "Salt", price: null, isPantry: true },
  ],
};

test("parseMinutes reads leading minutes and hour forms", () => {
  assert.equal(parseMinutes("25 minutter"), 25);
  assert.equal(parseMinutes("1 time 15 minutter"), 75);
  assert.equal(parseMinutes("2 timer"), 120);
});

test("prepBucket maps minutes to the guide's ranges", () => {
  assert.equal(prepBucket("10 minutter"), "under15");
  assert.equal(prepBucket("25 minutter"), "15-30");
  assert.equal(prepBucket("45 minutter"), "30-60");
  assert.equal(prepBucket("90 minutter"), "60plus");
});

test("pricePerMeal sums non-pantry prices; perPerson divides by servings", () => {
  assert.equal(pricePerMeal(recipe), 45);
  assert.equal(pricePerPerson(recipe), 11); // round(45/4)
});

test("normalizeDifficulty collapses the messy values to three levels", () => {
  assert.equal(normalizeDifficulty("Let"), "Nem");
  assert.equal(normalizeDifficulty("nem"), "Nem");
  assert.equal(normalizeDifficulty("Meget nem"), "Nem");
  assert.equal(normalizeDifficulty("Mellem"), "Middel");
  assert.equal(normalizeDifficulty("Middel"), "Middel");
  assert.equal(normalizeDifficulty(undefined), null);
});

test("normalizeCuisineKey strips flag emoji to a canonical key", () => {
  assert.equal(normalizeCuisineKey("🇯🇵 Asiatisk"), "asiatisk");
  assert.equal(normalizeCuisineKey("Nordisk"), "nordisk");
});

test("recipeAllergens returns the stored array, else []", () => {
  assert.deepEqual(recipeAllergens(recipe), ["Soja", "Sesamfrø"]);
  assert.deepEqual(recipeAllergens({}), []);
});

test("matchesLifestyleDiet uses stored dietaryFilters/keywords", () => {
  assert.equal(matchesLifestyleDiet({ dietaryFilters: ["Vegetar"] }, "vegetar"), true);
  assert.equal(matchesLifestyleDiet(recipe, "vegetar"), false); // has chicken
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm test`
Expected: FAIL — cannot find module `./recipeMeta.js`.

- [ ] **Step 3: Implement `src/recipeMeta.js`**

```js
// Pure, testable metadata derived from a recipe object. No React, no DOM.
import { CUISINES } from "./data/labels.js";

// "25 minutter" | "1 time 15 minutter" | "2 timer 30 minutter" -> total minutes.
export function parseMinutes(timeStr) {
  const s = String(timeStr || "").toLowerCase();
  let mins = 0;
  const h = s.match(/(\d+)\s*time/);            // "time" / "timer"
  if (h) mins += parseInt(h[1], 10) * 60;
  const m = s.match(/(\d+)\s*min/);             // "minut" / "minutter"
  if (m) mins += parseInt(m[1], 10);
  if (!h && !m) { const n = s.match(/(\d+)/); if (n) mins = parseInt(n[1], 10); }
  return mins;
}

// Guide buckets: Under 15 / 15–30 / 30–60 / 60+.
export function prepBucket(timeStr) {
  const m = parseMinutes(timeStr);
  if (m < 15) return "under15";
  if (m <= 30) return "15-30";
  if (m <= 60) return "30-60";
  return "60plus";
}

export const PREP_BUCKETS = [
  { key: "under15", da: "Under 15 min", en: "Under 15 min" },
  { key: "15-30",   da: "15–30 min",    en: "15–30 min" },
  { key: "30-60",   da: "30–60 min",    en: "30–60 min" },
  { key: "60plus",  da: "60+ min",      en: "60+ min" },
];

// Sum every ingredient you actually buy (deal items + non-deal basics); pantry excluded.
export function pricePerMeal(recipe) {
  let total = 0, has = false;
  for (const ing of (recipe.ingredients || [])) {
    if (ing.isPantry) continue;
    const m = String(ing.price || "").match(/(\d+(?:[.,]\d+)?)/);
    if (m) { const v = parseFloat(m[1].replace(",", ".")); if (v > 0) { total += v; has = true; } }
  }
  return has ? Math.round(total) : null;
}

export function pricePerPerson(recipe) {
  const total = pricePerMeal(recipe);
  const servings = recipe.servings_count || 4;
  if (total == null || servings <= 0) return null;
  const pp = Math.round(total / servings);
  return (pp < 1 || pp > 500 || !isFinite(pp)) ? null : pp;
}

export function normalizeDifficulty(d) {
  if (!d) return null;
  const s = String(d).toLowerCase();
  if (/svær|svaer|hard|advanced/.test(s)) return "Svær";
  if (/mellem|middel|medium/.test(s)) return "Middel";
  if (/nem|let|easy/.test(s)) return "Nem";
  return null;
}

export function normalizeCuisineKey(cuisine) {
  const raw = String(cuisine || "").replace(/[^\p{L}\s/]/gu, "").trim().toLowerCase();
  const hit = CUISINES.find(c => raw.includes(c.key) || c.da.toLowerCase().includes(raw) || raw.includes(c.da.toLowerCase().split(" ")[0]));
  if (hit) return hit.key;
  if (/nordisk|dansk/.test(raw)) return "nordisk";
  if (/middelhav|græsk|graesk/.test(raw)) return "europaeisk";
  return raw || null;
}

export function recipeAllergens(recipe) {
  return Array.isArray(recipe.allergens) ? recipe.allergens : [];
}

// Diet match against the recipe's tags. The enrichment step populates `dietTags`
// (which of the 6 lifestyle diets a recipe satisfies); older recipes may only have
// `dietaryFilters`. Combine both. Returns true when the recipe satisfies the diet key.
export function matchesLifestyleDiet(recipe, dietKey) {
  if (!dietKey || dietKey === "alle") return true;
  const tags = [...(recipe.dietTags || []), ...(recipe.dietaryFilters || [])]
    .map(x => String(x).toLowerCase());
  return tags.some(t => t.includes(dietKey));
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/recipeMeta.js src/recipeMeta.test.js
git commit -m "feat: pure recipe metadata helpers (prep bucket, price, normalizers)"
```

---

## Task 3: Enrichment prompt + merge logic (`scripts/enrichPrompt.mjs`)

Split the testable core (prompt text, response merging, "already enriched?" check) from
the network call so it can be unit-tested.

**Files:**
- Create: `scripts/enrichPrompt.mjs`
- Test: `scripts/enrichPrompt.test.js`

- [ ] **Step 1: Write the failing test**

```js
// scripts/enrichPrompt.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { needsEnrichment, buildPrompt, mergeEnrichment } from "./enrichPrompt.mjs";

const bare = { id: 1, title: "Kyllingewok", ingredients: [{ text: "Kylling" }] };
const full = { id: 1, title: "X", mealType: "aftensmad", cookingMethod: "Wok",
               allergens: ["Soja"], dietTags: [], difficulty: "Nem", cuisine: "asiatisk" };

test("needsEnrichment is true when any target field is missing", () => {
  assert.equal(needsEnrichment(bare), true);
  assert.equal(needsEnrichment(full), false);
});

test("buildPrompt names the recipe and constrains the enums", () => {
  const p = buildPrompt(bare);
  assert.match(p, /Kyllingewok/);
  assert.match(p, /aftensmad/);
  assert.match(p, /Ingen tilberedning/);
  assert.match(p, /Sesamfrø/);
});

test("mergeEnrichment only fills target fields, never overwrites core data", () => {
  const out = mergeEnrichment(bare, {
    mealType: "aftensmad", cookingMethod: "Wok", allergens: ["Soja"],
    difficulty: "Nem", cuisine: "asiatisk", title: "HACKED",
  });
  assert.equal(out.title, "Kyllingewok");     // core field preserved
  assert.equal(out.mealType, "aftensmad");
  assert.deepEqual(out.allergens, ["Soja"]);
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm test`
Expected: FAIL — cannot find `./enrichPrompt.mjs`.

- [ ] **Step 3: Implement `scripts/enrichPrompt.mjs`**

```js
import { ALLERGENS } from "../src/data/labels.js";

export const MEAL_TYPES = ["aftensmad", "frokost", "morgenmad", "snack"];
export const COOKING_METHODS = ["Én pande", "Ovn", "Gryde", "Wok", "Grill", "Bagning", "Ingen tilberedning"];
export const DIET_KEYS = ["vegetar", "vegansk", "pescetar", "fleksitar", "halal", "kosher"];
export const TARGET_FIELDS = ["mealType", "cookingMethod", "allergens", "difficulty", "cuisine", "dietTags"];

export function needsEnrichment(r) {
  return TARGET_FIELDS.some(f =>
    r[f] == null || ((f === "allergens" || f === "dietTags") && !Array.isArray(r[f])));
}

export function buildPrompt(r) {
  const ingredients = (r.ingredients || []).map(i => i.text).filter(Boolean).join(", ");
  const allergenList = ALLERGENS.map(a => a.da).join(", ");
  return `Du klassificerer en dansk madopskrift. Svar KUN med JSON.

Opskrift: "${r.title}"
Ingredienser: ${ingredients}
Beskrivelse: ${r.description || ""}

Returnér et JSON-objekt med præcis disse felter:
- "mealType": én af [${MEAL_TYPES.join(", ")}]
- "cookingMethod": én af [${COOKING_METHODS.join(", ")}]
- "allergens": array (kan være tomt) med kun værdier fra denne liste: [${allergenList}]
- "dietTags": array (kan være tomt) med de livsstilskostformer retten OPFYLDER, kun værdier fra: [${DIET_KEYS.join(", ")}]
- "difficulty": én af ["Nem", "Middel", "Svær"]
- "cuisine": én af ["nordisk","italiensk","asiatisk","mellemostlig","mexicansk","indisk","amerikansk","europaeisk"]

Kun JSON, ingen forklaring.`;
}

// Fill only target fields, and only with allowed values; never touch core recipe data.
export function mergeEnrichment(recipe, ai) {
  const out = { ...recipe };
  if (MEAL_TYPES.includes(ai.mealType)) out.mealType = ai.mealType;
  if (COOKING_METHODS.includes(ai.cookingMethod)) out.cookingMethod = ai.cookingMethod;
  if (Array.isArray(ai.allergens)) {
    const allowed = new Set(ALLERGENS.map(a => a.da));
    out.allergens = ai.allergens.filter(a => allowed.has(a));
  }
  if (Array.isArray(ai.dietTags)) {
    out.dietTags = ai.dietTags.filter(d => DIET_KEYS.includes(d));
  }
  if (["Nem", "Middel", "Svær"].includes(ai.difficulty)) out.difficulty = ai.difficulty;
  if (typeof ai.cuisine === "string" && ai.cuisine) out.cuisine = ai.cuisine;
  return out;
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/enrichPrompt.mjs scripts/enrichPrompt.test.js
git commit -m "feat: testable enrichment prompt + merge logic"
```

---

## Task 4: Enrichment runner + run it (`scripts/enrich-recipes.mjs`)

**Files:**
- Create: `scripts/enrich-recipes.mjs`
- Modify: `src/data/weeklyRecipes.json` (output of the run)

- [ ] **Step 1: Implement the runner**

```js
// One-time backfill: tags weeklyRecipes.json with mealType/cookingMethod/allergens
// and normalizes difficulty/cuisine. Idempotent — skips already-enriched recipes.
// Usage: ANTHROPIC_API_KEY=... node scripts/enrich-recipes.mjs [--dry] [--limit N]
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

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
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
```

- [ ] **Step 2: Smoke-test on two recipes (dry, then real)**

Run: `node scripts/enrich-recipes.mjs --dry --limit 2`
Expected: two `✓` lines printed, JSON not written. Requires `ANTHROPIC_API_KEY` in env
(the user has it configured for the app's `/api` functions; export it in the shell:
PowerShell `$env:ANTHROPIC_API_KEY = "<key>"`).

Then a real limited run: `node scripts/enrich-recipes.mjs --limit 2`
Verify with git diff that exactly two recipes gained the fields:
Run: `git diff --stat src/data/weeklyRecipes.json`
Expected: file modified.

- [ ] **Step 3: Full run**

Run: `node scripts/enrich-recipes.mjs`
Expected: ~149 `✓` lines, final "Processed N, changed N." Re-running should print
"Processed 0" (idempotent).

- [ ] **Step 4: Validate the data**

Run:
```bash
node -e "const d=require('./src/data/weeklyRecipes.json'); const bad=d.filter(r=>!r.mealType||!r.cookingMethod||!Array.isArray(r.allergens)); console.log('missing:',bad.length); const mt={}; d.forEach(r=>mt[r.mealType]=(mt[r.mealType]||0)+1); console.log(mt);"
```
Expected: `missing: 0` and a meal-type distribution (dinner-dominated as predicted).

- [ ] **Step 5: Commit**

```bash
git add scripts/enrich-recipes.mjs src/data/weeklyRecipes.json
git commit -m "feat: AI-enrich recipes with mealType/method/allergens; normalize difficulty+cuisine"
```

---

## Task 5: Update generation prompts for new fields

**Files:**
- Modify: `api/match-recipes.js`
- Modify: `api/generate-madspild-recipes.js`

- [ ] **Step 1: Locate the recipe JSON schema/instructions in each API file**

Run: `grep -n "mealType\|difficulty\|cuisine\|dietaryFilters\|JSON\|felter\|fields" api/match-recipes.js api/generate-madspild-recipes.js`
Read the prompt block that tells the model what recipe fields to output.

- [ ] **Step 2: Add the new fields to each prompt's field list**

In each file's prompt, append these field instructions to the recipe-object spec
(match the file's existing Danish wording/format):

```
- "mealType": én af ["aftensmad","frokost","morgenmad","snack"]
- "cookingMethod": én af ["Én pande","Ovn","Gryde","Wok","Grill","Bagning","Ingen tilberedning"]
- "allergens": array med værdier fra EU's 14 allergener på dansk (Gluten, Skaldyr, Æg, Fisk, Jordnødder, Soja, Mælk / laktose, Nødder, Selleri, Sennep, Sesamfrø, Svovldioxid og sulfitter, Lupin, Bløddyr)
- "dietTags": array med de livsstilskostformer retten opfylder, kun fra ["vegetar","vegansk","pescetar","fleksitar","halal","kosher"]
- "difficulty": én af ["Nem","Middel","Svær"]
- "cuisine": én af ["nordisk","italiensk","asiatisk","mellemostlig","mexicansk","indisk","amerikansk","europaeisk"]
```

- [ ] **Step 3: Verify no syntax breakage**

Run: `node --check api/match-recipes.js && node --check api/generate-madspild-recipes.js`
Expected: no output (valid).

- [ ] **Step 4: Commit**

```bash
git add api/match-recipes.js api/generate-madspild-recipes.js
git commit -m "feat: generation prompts emit mealType/method/allergens/difficulty/cuisine"
```

---

## Task 6: Profile settings — state, persistence, sync, UI

Adds three optional settings: default supermarket, allergies, lifestyle diet. Extends the
existing profile/settings surface and the Supabase sync blob.

**Files:**
- Modify: `src/App.jsx` (state near line 1096–1160; `currentSyncBlob`/`mergeSyncBlob`/`applySyncBlob` at 1680–1723; the profile/settings panel render)
- Modify: `src/App.css` (additive settings rows)

- [ ] **Step 1: Add settings state + localStorage load**

After the existing `diet` state (App.jsx ~1096) add:

```jsx
const [allergies, setAllergies] = useState(() => {
  try { return JSON.parse(localStorage.getItem("allergies") || "[]"); } catch { return []; }
});
const [lifestyleDiet, setLifestyleDiet] = useState(() => localStorage.getItem("lifestyleDiet") || "");
const [defaultSupermarket, setDefaultSupermarket] = useState(() => localStorage.getItem("defaultSupermarket") || "");
```

- [ ] **Step 2: Persist each on change**

Add near other persistence effects:

```jsx
useEffect(() => { try { localStorage.setItem("allergies", JSON.stringify(allergies)); } catch {} }, [allergies]);
useEffect(() => { try { localStorage.setItem("lifestyleDiet", lifestyleDiet); } catch {} }, [lifestyleDiet]);
useEffect(() => { try { localStorage.setItem("defaultSupermarket", defaultSupermarket); } catch {} }, [defaultSupermarket]);
```

- [ ] **Step 3: Include in cloud sync blob**

In `currentSyncBlob` (App.jsx:1680) add the fields to the returned object:

```jsx
return { savedRecipes, mealPlan, stores: localStores, diet, servings,
         allergies, lifestyleDiet, defaultSupermarket, v: 1 };
```

In `mergeSyncBlob` return object add:
```jsx
allergies: (cloud.allergies && cloud.allergies.length) ? cloud.allergies : local.allergies,
lifestyleDiet: cloud.lifestyleDiet || local.lifestyleDiet,
defaultSupermarket: cloud.defaultSupermarket || local.defaultSupermarket,
```

In `applySyncBlob` add:
```jsx
if (Array.isArray(p.allergies)) { setAllergies(p.allergies); try { localStorage.setItem("allergies", JSON.stringify(p.allergies)); } catch {} }
if (p.lifestyleDiet) { setLifestyleDiet(p.lifestyleDiet); try { localStorage.setItem("lifestyleDiet", p.lifestyleDiet); } catch {} }
if (p.defaultSupermarket) { setDefaultSupermarket(p.defaultSupermarket); try { localStorage.setItem("defaultSupermarket", p.defaultSupermarket); } catch {} }
```

- [ ] **Step 4: Add the imports**

At the top import block of App.jsx add:
```jsx
import { ALLERGENS, LIFESTYLE_DIETS } from "./data/labels.js";
```

- [ ] **Step 5: Add the settings UI**

Locate the profile panel render (search `showProfile`). Inside it, below the account
section, add an "Indstillinger" block (reuse existing modal row classes; example markup):

```jsx
<div className="profile-settings">
  <h3 className="profile-section-title">{t("Indstillinger")}</h3>

  <label className="ps-field">
    <span className="ps-label">{t("Standardbutik")}</span>
    <select className="ps-select" value={defaultSupermarket} onChange={e => setDefaultSupermarket(e.target.value)}>
      <option value="">{t("Ingen")}</option>
      {CHAIN_ORDER.map(c => <option key={c} value={c}>{c}</option>)}
    </select>
  </label>

  <div className="ps-field">
    <span className="ps-label">{t("Livsstilskost")}</span>
    <div className="ps-chip-row">
      {LIFESTYLE_DIETS.map(d => (
        <button key={d.key}
          className={`ps-chip${lifestyleDiet === d.key ? " selected" : ""}`}
          onClick={() => setLifestyleDiet(lifestyleDiet === d.key ? "" : d.key)}>
          {en ? d.en : d.da}
        </button>
      ))}
    </div>
  </div>

  <div className="ps-field">
    <span className="ps-label">{t("Allergier / intolerancer")}</span>
    <div className="ps-chip-row">
      {ALLERGENS.map(a => (
        <button key={a.key}
          className={`ps-chip${allergies.includes(a.da) ? " selected" : ""}`}
          onClick={() => setAllergies(allergies.includes(a.da) ? allergies.filter(x => x !== a.da) : [...allergies, a.da])}>
          {en ? a.en : a.da}
        </button>
      ))}
    </div>
  </div>
</div>
```

- [ ] **Step 6: Add additive CSS**

In `App.css` add (reuse existing color tokens; find one used by other chips for the
`--accent`/border values already in the file):

```css
.profile-settings { margin-top: 20px; }
.profile-section-title { font-size: 14px; text-transform: uppercase; letter-spacing: .04em; opacity: .7; margin: 0 0 10px; }
.ps-field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.ps-label { font-weight: 600; font-size: 14px; }
.ps-chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
.ps-chip { border: 1.5px solid var(--line, #ddd); background: transparent; color: inherit; padding: 7px 13px; border-radius: 999px; font-size: 13px; cursor: pointer; }
.ps-chip.selected { border-color: var(--accent, #2f6f5e); background: var(--accent, #2f6f5e); color: #fff; }
.ps-select { padding: 9px 12px; border-radius: 8px; border: 1.5px solid var(--line, #ddd); background: transparent; color: inherit; font-size: 14px; }
```

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 8: Manual check**

Run: `npx vite dev`, open the profile panel, set a default supermarket, toggle a diet
and two allergens, reload — verify they persist. Confirm dark mode still looks right.

- [ ] **Step 9: Commit**

```bash
git add src/App.jsx src/App.css
git commit -m "feat: Profile settings for default store, allergies, lifestyle diet (+cloud sync)"
```

---

## Task 7: Results filter tiers (primary + secondary) + allergy/diet dimming

**Files:**
- Modify: `src/App.jsx` (filter state ~1121–1181; `parseMinutes`/filter block 1360–1406; quick-strip render ~2810–2850; filtered lists)
- Modify: `src/App.css` (additive)

- [ ] **Step 1: Import helpers and replace time buckets**

Add to imports:
```jsx
import { PREP_BUCKETS, prepBucket, normalizeDifficulty, recipeAllergens, matchesLifestyleDiet } from "./recipeMeta.js";
import { COOKING_METHODS } from "../scripts/enrichPrompt.mjs";
```
(If importing from `scripts/` is awkward for the bundler, inline the 7-value
`COOKING_METHODS` array as a const near the other filter arrays instead.)

- [ ] **Step 2: Add primary/secondary filter state**

Near existing filter state (App.jsx ~1121):
```jsx
const [prepFilter, setPrepFilter] = useState("alle");     // primary quick-pick
const [mealTypeFilter, setMealTypeFilter] = useState("alle"); // primary quick-pick
const [methodFilter, setMethodFilter] = useState("alle");  // secondary
const [difficultyFilter, setDifficultyFilter] = useState("alle"); // secondary
```

- [ ] **Step 3: Replace the old `timeFilter` matching with `prepFilter`**

In the recipe filter predicate (App.jsx ~1384) replace the three `timeFilter` lines with:
```jsx
if (prepFilter !== "alle" && prepBucket(r.time) !== prepFilter) return false;
if (mealTypeFilter !== "alle" && r.mealType !== mealTypeFilter) return false;
if (methodFilter !== "alle" && r.cookingMethod !== methodFilter) return false;
if (difficultyFilter !== "alle" && normalizeDifficulty(r.difficulty) !== difficultyFilter) return false;
```
Remove the now-dead `timeFilters` array (line 1247) and `timeFilter` state (1121) and any
`timeText`/`timeFilter` filter references in `noResults`/`activeFilterCount` (1345, 1441)
— swap them to `prepFilter !== "alle"`.

- [ ] **Step 4: Render the primary quick-picks**

In the quick-strip area (~2841 where `timeFilters.map` was), render prep-time pills from
`PREP_BUCKETS` plus an "Alle" pill, driving `prepFilter`. Add a second pill row for meal
type built from `["aftensmad","frokost","morgenmad","snack"]` with Danish labels
(Aftensmad/Frokost/Morgenmad/Snack), driving `mealTypeFilter`. Reuse the existing
`qs-pill` / `qs-pill active` classes so styling matches.

```jsx
{[{key:"alle",da:"Alle tider"}, ...PREP_BUCKETS].map(b => (
  <button key={b.key} className={`qs-pill${prepFilter === b.key ? " active" : ""}`}
    onClick={() => setPrepFilter(b.key)}>{en ? (b.en || b.da) : b.da}</button>
))}
```

- [ ] **Step 5: Add secondary filters (method + difficulty)**

In the secondary/expandable filter area (the same block that already hosts price + persons
— search `priceMin`/`priceMax` render and the mobile "Filtre" section), add two pill rows
for `methodFilter` (from `COOKING_METHODS` + "Alle") and `difficultyFilter`
(`["Nem","Middel","Svær"]` + "Alle"), using the existing filter-row classes.

- [ ] **Step 6: Apply allergy/diet dimming (not removal)**

Compute a per-card flag and pass to the card. In the list render, mark recipes that clash
with the user's allergies or fail their lifestyle diet:
```jsx
const clashesAllergy = allergies.length > 0 && recipeAllergens(r).some(a => allergies.includes(a));
const failsDiet = lifestyleDiet && !matchesLifestyleDiet(r, lifestyleDiet);
```
Pass `dimmed={clashesAllergy || failsDiet}` (and a reason for a small badge) to the card;
in the card root add `className={... + (dimmed ? " recipe-card-dimmed" : "")}`. Dimming =
reduced opacity + a small "Indeholder <allergen>" / "Ikke <diet>" tag. Do NOT filter these
out of the list.

- [ ] **Step 7: Additive CSS**

```css
.recipe-card-dimmed { opacity: .55; }
.recipe-card-dimmed .recipe-card-warn { display: inline-flex; }
.recipe-card-warn { display: none; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: var(--accent-allergy, #b3542f); background: var(--accent-allergy-soft, #fbe9e1); padding: 2px 8px; border-radius: 999px; margin-top: 6px; }
```

- [ ] **Step 8: Verify build + manual filtering**

Run: `npm run build` → succeeds.
Run: `npx vite dev`, exercise each primary + secondary filter; set an allergy in settings
and confirm matching cards dim rather than disappear.

- [ ] **Step 9: Commit**

```bash
git add src/App.jsx src/App.css
git commit -m "feat: primary/secondary results filters + allergy/diet dimming"
```

---

## Task 8: Recipe card redesign (same style, new content)

**Files:**
- Modify: `src/App.jsx` (the `RecipeCard` render, ~640–720)
- Modify: `src/App.css` (additive badge/stat rows)

- [ ] **Step 1: Import helpers into the card**

Ensure the card has access to (top-level imports): `pricePerMeal`, `pricePerPerson`,
`normalizeDifficulty`, `recipeAllergens` from `./recipeMeta.js`, and `cuisineLabel`,
`allergenLabel` from `./data/labels.js`.

- [ ] **Step 2: Compute the card fields**

In the card component body (replace/extend the existing `basePp`/`totalPrice` block at
~647):
```jsx
const perMeal = pricePerMeal(r);
const perPerson = pricePerPerson(r);
const diff = normalizeDifficulty(r.difficulty);
const cuisineKey = r.cuisine; // already normalized key after enrichment
const cardAllergens = recipeAllergens(r);
```

- [ ] **Step 3: Render the badge row + stat grid**

Below the title, add a badge row (cuisine + allergens) and a stat grid, reusing existing
class names where present. Keep the existing photo/thumb and title untouched:
```jsx
<div className="rc-badge-row">
  {cuisineKey && <span className="rc-badge rc-badge-cuisine">{cuisineLabel(cuisineKey, en ? "en" : "da")}</span>}
  {cardAllergens.map(a => (
    <span key={a} className="rc-badge rc-badge-allergen">{allergenLabel(a, en ? "en" : "da")}</span>
  ))}
</div>
<div className="rc-stats">
  {perMeal != null && <><span className="rc-k">{t("Pris / ret")}</span><span className="rc-v">{perMeal} kr</span></>}
  {perPerson != null && <><span className="rc-k">{t("Pris / person")}</span><span className="rc-v">{perPerson} kr</span></>}
  {diff && <><span className="rc-k">{t("Sværhedsgrad")}</span><span className="rc-v">{diff}</span></>}
  <span className="rc-k">{t("Tilberedningstid")}</span><span className="rc-v">{timeText(r.time)}</span>
  {r.cookingMethod && <><span className="rc-k">{t("Metode")}</span><span className="rc-v">{r.cookingMethod}</span></>}
</div>
```
Keep the existing "ca. X kr til Y pers." line only if it isn't now redundant with
`Pris / ret`; prefer removing the old line to avoid duplication.

- [ ] **Step 4: Additive CSS matching existing card tokens**

```css
.rc-badge-row { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 10px; }
.rc-badge { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 999px; }
.rc-badge-cuisine { background: var(--accent-cuisine-soft, #e8eef8); color: var(--accent-cuisine, #3a5a8c); }
.rc-badge-allergen { background: var(--accent-allergy-soft, #fbe9e1); color: var(--accent-allergy, #b3542f); }
.rc-stats { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; font-size: 12.5px; }
.rc-stats .rc-k { opacity: .6; }
.rc-stats .rc-v { font-weight: 600; text-align: right; }
```
Add matching `html.dark` overrides next to the app's other dark-mode badge rules if the
soft background tokens aren't already dark-aware.

- [ ] **Step 5: Verify build + visual check**

Run: `npm run build` → succeeds.
Run: `npx vite dev` — confirm cards show cuisine + allergen badges and the stat grid, in
both light and dark mode, matching the surrounding style.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx src/App.css
git commit -m "feat: recipe card shows cuisine + allergen badges, price/meal, method"
```

---

## Task 9: Onboarding cleanup (remove diet step, migrate value)

**Files:**
- Modify: `src/App.jsx` (onboarding render 2276–2378; step count; `handleOnboardingContinue`)

- [ ] **Step 1: Remove the diet step (step 2) from onboarding**

Delete the `onboardingStep === 2` diet block (2326–2352). Renumber: the servings step
becomes step 2. Update the progress dots (`[1, 2, 3]` → `[1, 2]`), the `{onboardingStep}/3`
counter to `/2`, and the continue-button label condition (`onboardingStep === 3` →
`onboardingStep === 2`).

- [ ] **Step 2: Update `handleOnboardingContinue` step ceiling**

Find `handleOnboardingContinue` (search it) and change the max step from 3 to 2 so the
final step finishes onboarding. Ensure `pendingDiet` is no longer required to complete.

- [ ] **Step 3: One-time migration of existing diet value into settings**

Add a run-once effect (guarded by a localStorage flag) that seeds `lifestyleDiet` from the
old `diet`/`defaultDiet` value if the user had one and hasn't set a lifestyle diet yet:
```jsx
useEffect(() => {
  if (localStorage.getItem("dietMigrated")) return;
  const old = localStorage.getItem("defaultDiet");
  const map = { Vegetar: "vegetar", Veganer: "vegansk" };
  if (old && map[old] && !localStorage.getItem("lifestyleDiet")) {
    setLifestyleDiet(map[old]);
  }
  localStorage.setItem("dietMigrated", "1");
}, []);
```
(Glutenfri/Mælkefri were allergen-style, not lifestyle diets — leave those; the user can
re-add them as allergies. Note this in the commit message.)

- [ ] **Step 4: Default-supermarket pre-fill in onboarding**

When onboarding opens store step 1 with no prior selection, if `defaultSupermarket` is set,
seed `pendingChains` with it. Add to the store-step init:
```jsx
useEffect(() => {
  if (onboardingStep === 1 && pendingChains.size === 0 && defaultSupermarket) {
    setPendingChains(new Set([defaultSupermarket]));
  }
}, [onboardingStep]); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 5: Verify build + fresh-onboarding manual run**

Run: `npm run build` → succeeds.
Clear localStorage in a dev browser, reload: onboarding shows Welcome → Stores → Household
(2 steps), no diet step. Complete it, confirm results load.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "feat: simplify onboarding to stores+household; migrate diet into settings"
```

---

## Task 10: Full verification + push

- [ ] **Step 1: Run the whole test suite**

Run: `npm test`
Expected: all label / recipeMeta / enrichPrompt / existing shoppingLogic tests PASS.

- [ ] **Step 2: Lint + build**

Run: `npm run lint && npm run build`
Expected: lint clean (or only pre-existing warnings), build succeeds.

- [ ] **Step 3: Manual end-to-end QA (dev server)**

Run: `npx vite dev` and walk the full flow:
- Fresh user: Welcome → Stores → Household → results.
- Results: prep-time + meal-type primary pills filter; method + difficulty secondary
  filters; price + persons still work.
- Cards show cuisine badge, allergen tags, pris/ret, pris/person, sværhedsgrad,
  tilberedningstid, metode — light AND dark mode.
- Profile settings: default store, allergies, lifestyle diet persist + sync (if signed in).
- Set an allergy → matching cards dim with a warning tag, not removed.

- [ ] **Step 4: Push**

```bash
git push
```
(Direct-to-main per project convention.)

---

## Notes for the implementer

- The app is one giant `App.jsx` (3746 lines) + one `App.css` (6711 lines). Follow the
  existing single-file pattern; do NOT restructure into components beyond the two new pure
  modules. Match existing class-naming and dark-mode token usage.
- Tests run with Node's built-in runner (`npm test` = `node --test src/**/*.test.js`). Only
  pure modules are unit-tested; UI is verified by build + manual QA, consistent with the
  existing `shoppingLogic.test.js` approach.
- Enrichment needs `ANTHROPIC_API_KEY` in the shell env for Task 4. It's idempotent and safe
  to re-run.
- Commit after every task; push at the end (project ships direct-to-main).
