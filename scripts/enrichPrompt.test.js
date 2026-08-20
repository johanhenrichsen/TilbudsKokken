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
