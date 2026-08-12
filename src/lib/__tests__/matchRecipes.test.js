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
});
