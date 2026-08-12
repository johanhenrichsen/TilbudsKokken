import { recipes as defaultRecipes } from "../data/recipes.js";

function tokenize(str) {
  return str.toLowerCase().split(/[^a-zæøå]+/).filter(Boolean);
}

function score(recipe, selectedTokens) {
  return recipe.mainIngredients.reduce((s, ing) => {
    const i = ing.toLowerCase();
    const matched = selectedTokens.some(tokens =>
      tokens.some(tok => tok === i) ||
      (i.length >= 4 && tokens.some(tok => tok.includes(i) || i.includes(tok)))
    );
    return s + (matched ? 1 : 0);
  }, 0);
}

export function matchRecipes(selectedProducts, recipeList = defaultRecipes, limit = 10) {
  const selectedTokens = selectedProducts.map(p => tokenize(p));
  return recipeList
    .map(r => ({ r, s: score(r, selectedTokens) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(x => x.r);
}
