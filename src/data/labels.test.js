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
