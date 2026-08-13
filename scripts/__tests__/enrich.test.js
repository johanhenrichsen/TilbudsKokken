import { describe, it, expect, vi } from "vitest";
import { enrichRows } from "../enrich.js";

describe("enrichRows", () => {
  it("splits variants and adds category/servingIdea/labels from Claude JSON", async () => {
    const base = [{ store: "Netto", name: "Nakkefilet eller røget bacon", price: 39, currency: "DKK" }];
    const callClaude = vi.fn(async () => JSON.stringify([
      { i: 0, name: "Nakkefilet", category: "Kød", servingIdea: "Grill", labels: ["Dansk"] },
      { i: 0, name: "Røget bacon", category: "Kød", servingIdea: "Morgenmad", labels: [] },
    ]));
    const out = await enrichRows(base, { callClaude });
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ store: "Netto", price: 39, name: "Nakkefilet", category: "Kød" });
    expect(out[1].name).toBe("Røget bacon");
    expect(out[1].price).toBe(39);
  });

  it("attaches enrichment to the correct base row by index, not name prefix", async () => {
    const base = [
      { store: "Netto", name: "Kylling", price: 30, currency: "DKK" },
      { store: "Netto", name: "Kyllingelår", price: 45, currency: "DKK" },
    ];
    const callClaude = vi.fn(async () => JSON.stringify([
      { i: 0, name: "Kylling", category: "Kød", servingIdea: "", labels: [] },
      { i: 1, name: "Kyllingelår", category: "Kød", servingIdea: "", labels: [] },
    ]));
    const out = await enrichRows(base, { callClaude });
    expect(out.find(r => r.name === "Kylling").price).toBe(30);
    expect(out.find(r => r.name === "Kyllingelår").price).toBe(45);
  });

  it("parses Claude output wrapped in markdown fences and preamble", async () => {
    const base = [{ store: "Netto", name: "Æbler", price: 10, currency: "DKK" }];
    const callClaude = vi.fn(async () => "Her er resultatet:\n```json\n[{\"i\":0,\"name\":\"Æbler\",\"category\":\"Frugt\",\"servingIdea\":\"Snack\",\"labels\":[\"Dansk\"]}]\n```");
    const out = await enrichRows(base, { callClaude });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ name: "Æbler", price: 10, category: "Frugt", labels: ["Dansk"] });
  });

  it("falls back to the base row (uncategorised) if Claude returns invalid JSON", async () => {
    const base = [{ store: "Netto", name: "Æbler", price: 10 }];
    const callClaude = vi.fn(async () => "not json");
    const out = await enrichRows(base, { callClaude });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ name: "Æbler", category: "Ukategoriseret", labels: [] });
  });
});
