import { describe, it, expect } from "vitest";
import { diffCatalogs } from "../fetch.js";

describe("diffCatalogs", () => {
  it("marks a dealer to process when its catalog id changed", () => {
    const active = { netto: { id: "cat2" }, bilka: { id: "catA" } };
    const state = { netto: { catalogId: "cat1" }, bilka: { catalogId: "catA" } };
    const { toProcess, unchanged } = diffCatalogs(active, state);
    expect(toProcess).toEqual(["netto"]);
    expect(unchanged).toEqual(["bilka"]);
  });

  it("processes a dealer with no prior state", () => {
    const { toProcess } = diffCatalogs({ meny: { id: "x" } }, {});
    expect(toProcess).toEqual(["meny"]);
  });

  it("skips dealers with no active catalog (null)", () => {
    const { toProcess, unchanged } = diffCatalogs({ spar: null }, {});
    expect(toProcess).toEqual([]);
    expect(unchanged).toEqual([]);
  });
});
