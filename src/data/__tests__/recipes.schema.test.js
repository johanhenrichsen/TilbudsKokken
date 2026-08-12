import { describe, it, expect } from "vitest";
import { recipes } from "../recipes.js";

describe("recipes data", () => {
  it("has exactly 150 recipes", () => {
    expect(recipes).toHaveLength(150);
  });
  it("every recipe matches the schema with unique ids", () => {
    const ids = new Set();
    for (const r of recipes) {
      expect(typeof r.id).toBe("number");
      expect(ids.has(r.id)).toBe(false); ids.add(r.id);
      expect(typeof r.title).toBe("string");
      expect(typeof r.time).toBe("string");
      expect(typeof r.servings === "number" || typeof r.servings === "string").toBe(true);
      expect(Array.isArray(r.ingredients) && r.ingredients.length >= 3).toBe(true);
      expect(Array.isArray(r.steps) && r.steps.length >= 3).toBe(true);
      expect(typeof r.tip).toBe("string");
      expect(Array.isArray(r.tags) && r.tags.length >= 1).toBe(true);
      expect(Array.isArray(r.mainIngredients) && r.mainIngredients.length >= 1).toBe(true);
    }
  });
});
