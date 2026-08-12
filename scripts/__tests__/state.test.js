import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { loadState, saveState } from "../lib/state.js";

let dir, file;
beforeEach(() => { dir = mkdtempSync(path.join(tmpdir(), "state-")); file = path.join(dir, "s.json"); });

describe("state", () => {
  it("returns empty object when file is missing", async () => {
    expect(await loadState(file)).toEqual({});
  });
  it("round-trips state through save/load", async () => {
    await saveState(file, { netto: { catalogId: "cat1", processedAt: "2026-08-12" } });
    expect(await loadState(file)).toEqual({ netto: { catalogId: "cat1", processedAt: "2026-08-12" } });
    rmSync(dir, { recursive: true, force: true });
  });
});
