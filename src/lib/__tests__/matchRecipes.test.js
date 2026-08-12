import { describe, it, expect } from "vitest";
import { matchRecipes } from "../matchRecipes.js";
import { recipes } from "../../data/recipes.js";

describe("matchRecipes", () => {
  it("ranks recipes by overlap of main ingredients with selected products", () => {
    const out = matchRecipes(["Hakket oksekød", "Spaghetti"], recipes, 3);
    expect(out[0].title).toBe("Klassisk bolognese med spaghetti");
  });
  it("returns at most `limit` results", () => {
    expect(matchRecipes(["kylling"], recipes, 1)).toHaveLength(1);
  });
  it("returns [] when nothing matches", () => {
    expect(matchRecipes(["ananas"], recipes, 5)).toEqual([]);
  });
  it("does not false-match short ingredients as substrings of unrelated products", () => {
    const list = [{ id: 99, title: "Æggekage", time: "15 min", servings: 2,
      ingredients: ["6 æg","salt"], steps: ["a","b","c"], tip: "x", tags: ["æg"], mainIngredients: ["æg"] }];
    // "pålæg" contains "æg" as a substring but is not eggs
    expect(matchRecipes(["pålæg"], list, 5)).toEqual([]);
    // exact token still matches
    expect(matchRecipes(["æg"], list, 5)).toHaveLength(1);
  });
});
