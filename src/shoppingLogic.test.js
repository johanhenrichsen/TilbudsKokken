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
  removeCheckedEntries,
  savedServingsFor,
} from "./shoppingLogic.js";

const recipe = {
  id: "r1",
  servings_count: 4,
  ingredients: [
    { text: "500 g hakket oksekød", store: "Netto" },
    { text: "1 dåse tomater", store: "Rema 1000" },
    { text: "Salt", isPantry: true },        // pantry staple — not shoppable
    { text: "Peber" },                        // non-deal basic (no store) — still shoppable
  ],
};

// Everything you actually buy: all non-pantry ingredients, whether or not they
// carry a store tag. Store-tagged items are weekly deals; the rest are basics.
const ALL_SHOPPABLE = ["500 g hakket oksekød", "1 dåse tomater", "Peber"];

// ── QA #3: "Til indkøb" state reflects real list membership ───────────────
test("#3 recipeShoppables returns every non-pantry ingredient", () => {
  assert.deepEqual(recipeShoppables(recipe), ALL_SHOPPABLE);
});

test("#3 allShoppablesInList is false until every shoppable is present", () => {
  assert.equal(allShoppablesInList(recipe, []), false);
  assert.equal(allShoppablesInList(recipe, ["500 g hakket oksekød"]), false);
  assert.equal(allShoppablesInList(recipe, ["500 g hakket oksekød", "1 dåse tomater"]), false);
  assert.equal(allShoppablesInList(recipe, ALL_SHOPPABLE), true);
});

test("#3 removing an item flips the state back to not-in-list", () => {
  assert.equal(allShoppablesInList(recipe, ALL_SHOPPABLE), true);
  const afterRemoval = ALL_SHOPPABLE.filter(t => t !== "1 dåse tomater");
  assert.equal(allShoppablesInList(recipe, afterRemoval), false);
});

test("#3 a recipe with no shoppable ingredients is never 'in list'", () => {
  const pantryOnly = { ingredients: [{ text: "Salt", isPantry: true }] };
  assert.equal(allShoppablesInList(pantryOnly, ["Salt"]), false);
});

// The cart moved from string[] to {id,text,store,checked}[]. allShoppablesInList
// must read the .text of each object entry, while still accepting legacy strings.
test("#3 allShoppablesInList reads .text from object cart entries", () => {
  const cart = [
    { id: "a", text: "500 g hakket oksekød", store: "Netto", checked: false },
    { id: "b", text: "1 dåse tomater", store: "Rema 1000", checked: true },
    { id: "c", text: "Peber", store: null, checked: false },
  ];
  assert.equal(allShoppablesInList(recipe, cart), true);
  assert.equal(allShoppablesInList(recipe, cart.slice(0, 2)), false);
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

// Object cart: "Ryd afkrydsede" drops entries whose .checked is true, keeping
// identity stable via id (no reliance on text equality).
test("#6 removeCheckedEntries drops exactly the checked object entries", () => {
  const cart = [
    { id: "a", text: "Mælk", checked: false },
    { id: "b", text: "Æg", checked: true },
    { id: "c", text: "Smør", checked: false },
  ];
  assert.deepEqual(
    removeCheckedEntries(cart).map(i => i.id),
    ["a", "c"],
  );
});

test("#6 removeCheckedEntries with two identical texts only drops the checked one", () => {
  const cart = [
    { id: "a", text: "Tomat", checked: true },
    { id: "b", text: "Tomat", checked: false },
  ];
  assert.deepEqual(removeCheckedEntries(cart).map(i => i.id), ["b"]);
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
