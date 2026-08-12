import { describe, it, expect } from "vitest";
import { toBaseRow, isFood } from "../lib/normalize.js";
import offer from "./fixtures/offer.json" assert { type: "json" };

const dealer = { name: "Netto", brand: "netto" };

describe("toBaseRow", () => {
  it("maps a Tjek offer to a base row", () => {
    const row = toBaseRow(offer, { ...dealer, catalogId: "cat1" });
    expect(row).toMatchObject({
      store: "Netto", brand: "netto", catalogId: "cat1",
      name: "Hakket oksekød 8-12%", price: 25.0, currency: "DKK",
      weight: "400 g", validFrom: "2026-08-11T00:00:00+0000",
    });
  });
});

describe("isFood", () => {
  it("keeps food items", () => {
    expect(isFood({ name: "Hakket oksekød" })).toBe(true);
  });
  it("excludes alcohol / candy / non-food", () => {
    expect(isFood({ name: "Gajol vodkashot" })).toBe(false);
    expect(isFood({ name: "Toiletpapir 8 ruller" })).toBe(false);
    expect(isFood({ name: "Marabou chokolade" })).toBe(false);
  });
});
