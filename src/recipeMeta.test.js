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
