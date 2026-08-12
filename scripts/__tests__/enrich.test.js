import { describe, it, expect, vi } from "vitest";
import { enrichRows } from "../enrich.js";

describe("enrichRows", () => {
  it("splits variants and adds category/servingIdea/labels from Claude JSON", async () => {
    const base = [{ store: "Netto", name: "Nakkefilet eller røget bacon", price: 39, currency: "DKK" }];
    const callClaude = vi.fn(async () => JSON.stringify([
      { name: "Nakkefilet", category: "Kød", servingIdea: "Grill", labels: ["Dansk"] },
      { name: "Røget bacon", category: "Kød", servingIdea: "Morgenmad", labels: [] },
    ]));
    const out = await enrichRows(base, { callClaude });
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ store: "Netto", price: 39, name: "Nakkefilet", category: "Kød" });
    expect(out[1].name).toBe("Røget bacon");
  });

  it("falls back to the base row (uncategorised) if Claude returns invalid JSON", async () => {
    const base = [{ store: "Netto", name: "Æbler", price: 10 }];
    const callClaude = vi.fn(async () => "not json");
    const out = await enrichRows(base, { callClaude });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ name: "Æbler", category: "Ukategoriseret", labels: [] });
  });
});
