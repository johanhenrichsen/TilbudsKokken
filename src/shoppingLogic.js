// Pure helpers extracted from App.jsx so the QA-regression logic has a single
// source of truth and can be unit-tested without rendering React.
// See shoppingLogic.test.js for the regression checks tied to each QA bug.

// The shoppable ingredient texts of a recipe — everything you actually buy.
// Pantry staples are excluded; non-deal basics (onion, garlic, …) are included
// even though they have no store.
export function recipeShoppables(recipe) {
  return (recipe?.ingredients || [])
    .filter(ing => !ing.isPantry)
    .map(ing => ing.text);
}

// The cart holds {id,text,store,checked} objects; legacy persisted carts (and the
// unit tests) may still pass plain strings, so read text tolerantly.
export function entryText(entry) {
  return typeof entry === "string" ? entry : entry?.text;
}

// QA #3: whether every shoppable ingredient of a recipe is already on the list.
// Empty (no shoppable ingredients) counts as "not in list" so the button stays actionable.
export function allShoppablesInList(recipe, shoppingList) {
  const texts = recipeShoppables(recipe);
  const listTexts = new Set((shoppingList || []).map(entryText));
  return texts.length > 0 && texts.every(t => listTexts.has(t));
}

// QA #6 (legacy string cart): remove the checked items from the shopping list.
export function removeCheckedItems(shoppingList, checkedSet) {
  return shoppingList.filter(item => !checkedSet.has(item));
}

// QA #6 (object cart): drop the entries the user has checked off. Identity is the
// item's own .checked flag, so duplicate texts are handled independently.
export function removeCheckedEntries(cart) {
  return (cart || []).filter(it => !it.checked);
}

// QA #4: the serving count to store with a saved recipe — the user's current
// selection, falling back to the recipe's own default.
export function savedServingsFor(recipe, servingsSel) {
  return servingsSel || recipe?.servings_count || 4;
}
