import { recipes as defaultRecipes } from "../data/recipes.js";

function score(recipe, selectedLower) {
  return recipe.mainIngredients.reduce((s, ing) => {
    const i = ing.toLowerCase();
    return s + (selectedLower.some(p => p.includes(i) || i.includes(p)) ? 1 : 0);
  }, 0);
}

export function matchRecipes(selectedProducts, recipeList = defaultRecipes, limit = 10) {
  const selectedLower = selectedProducts.map(p => p.toLowerCase());
  return recipeList
    .map(r => ({ r, s: score(r, selectedLower) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(x => x.r);
}
