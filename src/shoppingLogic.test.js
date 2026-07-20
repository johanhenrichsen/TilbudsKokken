// Regression tests for the QA-reported bugs whose logic is pure/unit-testable.
// Run with: npm test   (uses Node's built-in test runner — no extra deps)
//
// The DOM/layout-only bugs are not covered here and are noted at the bottom:
//   #1 reveal-on-back-nav, #2 FAB badge overlap, #5 body-scroll-lock,
//   #7 modal-stacking guard — verified via build + manual QA.
// #8 (filters resetting each visit) is the intended default — nothing persists,
// so there is no logic to test.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  recipeShoppables,
  allShoppablesInList,
  removeCheckedItems,
  savedServingsFor,
} from "./shoppingLogic.js";

const recipe = {
  id: "r1",
  servings_count: 4,
  ingredients: [
    { text: "500 g hakket oksekød", store: "Netto" },
    { text: "1 dåse tomater", store: "Rema 1000" },
    { text: "Salt", isPantry: true },        // pantry — not shoppable
    { text: "Peber" },                        // no store — not shoppable
  ],
};

// ── QA #3: "Til indkøb" state reflects real list membership ───────────────
test("#3 recipeShoppables returns only deal ingredients", () => {
  assert.deepEqual(recipeShoppables(recipe), ["500 g hakket oksekød", "1 dåse tomater"]);
});

test("#3 allShoppablesInList is false until every shoppable is present", () => {
  assert.equal(allShoppablesInList(recipe, []), false);
  assert.equal(allShoppablesInList(recipe, ["500 g hakket oksekød"]), false);
  assert.equal(
    allShoppablesInList(recipe, ["500 g hakket oksekød", "1 dåse tomater"]),
    true,
  );
});

test("#3 removing an item flips the state back to not-in-list", () => {
  const full = ["500 g hakket oksekød", "1 dåse tomater"];
  assert.equal(allShoppablesInList(recipe, full), true);
  const afterRemoval = full.filter(t => t !== "1 dåse tomater");
  assert.equal(allShoppablesInList(recipe, afterRemoval), false);
});

test("#3 a recipe with no shoppable ingredients is never 'in list'", () => {
  const pantryOnly = { ingredients: [{ text: "Salt", isPantry: true }] };
  assert.equal(allShoppablesInList(pantryOnly, ["Salt"]), false);
});

// ── QA #6: "Ryd afkrydsede" actually removes checked items ────────────────
test("#6 removeCheckedItems drops exactly the checked entries", () => {
  const list = ["Mælk", "Æg", "Smør"];
  const checked = new Set(["Æg"]);
  assert.deepEqual(removeCheckedItems(list, checked), ["Mælk", "Smør"]);
});

test("#6 removeCheckedItems with nothing checked leaves the list intact", () => {
  const list = ["Mælk", "Æg"];
  assert.deepEqual(removeCheckedItems(list, new Set()), ["Mælk", "Æg"]);
});

test("#6 removeCheckedItems can clear the whole list", () => {
  const list = ["Mælk", "Æg"];
  assert.deepEqual(removeCheckedItems(list, new Set(list)), []);
});

// ── QA #4: saved recipe stores the selected serving size ──────────────────
test("#4 savedServingsFor uses the selected serving over the recipe default", () => {
  assert.equal(savedServingsFor(recipe, 6), 6);
  assert.equal(savedServingsFor(recipe, 2), 2);
});

test("#4 savedServingsFor falls back to the recipe default, then 4", () => {
  assert.equal(savedServingsFor(recipe, undefined), 4);      // recipe.servings_count
  assert.equal(savedServingsFor({}, undefined), 4);          // hard default
});
