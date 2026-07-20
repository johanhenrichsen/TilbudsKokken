// Pure helpers extracted from App.jsx so the QA-regression logic has a single
// source of truth and can be unit-tested without rendering React.
// See shoppingLogic.test.js for the regression checks tied to each QA bug.

// The shoppable (deal) ingredient texts of a recipe — pantry staples excluded.
export function recipeShoppables(recipe) {
  return (recipe?.ingredients || [])
    .filter(ing => !ing.isPantry && ing.store)
    .map(ing => ing.text);
}

// QA #3: whether every shoppable ingredient of a recipe is already on the list.
// Empty (no shoppable ingredients) counts as "not in list" so the button stays actionable.
export function allShoppablesInList(recipe, shoppingList) {
  const texts = recipeShoppables(recipe);
  return texts.length > 0 && texts.every(t => shoppingList.includes(t));
}

// QA #6: remove the checked items from the shopping list.
export function removeCheckedItems(shoppingList, checkedSet) {
  return shoppingList.filter(item => !checkedSet.has(item));
}

// QA #4: the serving count to store with a saved recipe — the user's current
// selection, falling back to the recipe's own default.
export function savedServingsFor(recipe, servingsSel) {
  return servingsSel || recipe?.servings_count || 4;
}
