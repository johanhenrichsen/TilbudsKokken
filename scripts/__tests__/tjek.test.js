import { describe, it, expect, vi } from "vitest";
import { createTjekClient } from "../lib/tjek.js";

function jsonResponse(body, status = 200) {
  return Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });
}

describe("tjek client", () => {
  it("getActiveCatalog returns the currently valid catalog for a dealer", async () => {
    const now = new Date("2026-08-12").toISOString();
    const fetchImpl = vi.fn(() => jsonResponse([
      { id: "cat1", label: "Uge 33", dealer_id: "d1",
        run_from: "2026-08-11T00:00:00+0000", run_till: "2026-08-17T23:59:59+0000" },
    ]));
    const client = createTjekClient({ apiKey: "k", fetchImpl, now: () => new Date(now) });
    const cat = await client.getActiveCatalog("d1");
    expect(cat).toEqual({
      id: "cat1", label: "Uge 33", dealerId: "d1",
      runFrom: "2026-08-11T00:00:00+0000", runTill: "2026-08-17T23:59:59+0000",
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("dealer_ids=d1"),
      expect.objectContaining({ headers: expect.objectContaining({ "X-Api-Key": "k" }) }),
    );
  });

  it("getActiveCatalog prefers the food avis over a Nonfood catalog when several are active", async () => {
    const fetchImpl = vi.fn(() => jsonResponse([
      { id: "nonfood", label: "Netto uge 33 Nonfood", dealer_id: "d1",
        run_from: "2026-08-07T00:00:00+0000", run_till: "2026-08-14T23:59:59+0000" },
      { id: "food", label: "Netto uge 33", dealer_id: "d1",
        run_from: "2026-08-07T00:00:00+0000", run_till: "2026-08-14T23:59:59+0000" },
    ]));
    const client = createTjekClient({ apiKey: "k", fetchImpl, now: () => new Date("2026-08-12") });
    const cat = await client.getActiveCatalog("d1");
    expect(cat.id).toBe("food");
  });

  it("getActiveCatalog returns null when no catalog is currently valid", async () => {
    const fetchImpl = vi.fn(() => jsonResponse([
      { id: "old", dealer_id: "d1", run_from: "2026-01-01T00:00:00+0000", run_till: "2026-01-07T23:59:59+0000" },
    ]));
    const client = createTjekClient({ apiKey: "k", fetchImpl, now: () => new Date("2026-08-12") });
    expect(await client.getActiveCatalog("d1")).toBeNull();
  });
});
