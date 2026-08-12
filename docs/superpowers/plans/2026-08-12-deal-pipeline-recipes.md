# Deal Pipeline + Curated Recipe Set Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a daily local pipeline that pulls each Danish supermarket's weekly catalog from the Tjek/ShopGun API into a per-store PDF and a multi-sheet Excel workbook, plus a static 150-recipe set matched to live deals in the app.

**Architecture:** A Node ESM CLI toolkit under `tilbudsapp/scripts/` with focused modules (Tjek client, normalize, fetch, enrich, excel, orchestrator) run daily by Windows Task Scheduler. State tracks processed catalogs to avoid redundant work and token spend. A separate static `src/data/recipes.js` module plus a `matchRecipes` helper delivers the deal-independent recipe set.

**Tech Stack:** Node 20+ (ESM), `exceljs`, `pdf-lib`, `vitest` (tests), Anthropic Messages API via `fetch` (`VITE_CLAUDE_KEY`), Tjek/ShopGun API (`TJEK_API_KEY`).

**Reference spec:** `docs/superpowers/specs/2026-08-12-tilbudskokken-data-pipeline-design.md`

---

## File Structure

**Phase A — deal pipeline (new files under `tilbudsapp/`):**

| File | Responsibility |
|---|---|
| `scripts/lib/config.js` | Tracked dealers (key/name/brand/dealerId) + all output paths |
| `scripts/lib/tjek.js` | Tjek API client: `getActiveCatalog`, `getCatalogPages`, `getCatalogOffers` |
| `scripts/lib/normalize.js` | Pure functions: `toBaseRow(offer, dealer)`, `isFood(row)` |
| `scripts/lib/state.js` | `loadState(path)`, `saveState(path, state)` |
| `scripts/lib/pdf.js` | `stitchPdf(imageBuffers, outPath)` — images → one PDF |
| `scripts/fetch.js` | `diffCatalogs(active, state)`, `fetchDealer(client, dealer, state)` |
| `scripts/enrich.js` | `enrichRows(baseRows, { callClaude })` — variant split + category/servingIdea/labels |
| `scripts/excel.js` | `writeWorkbook(rowsByStore, outPath)` — Oversigt + per-store sheets |
| `scripts/run.js` | CLI orchestrator; flags `--dealer= --dry-run --force --limit=` |
| `scripts/run-daily.cmd` | Wrapper invoked by Task Scheduler |
| `scripts/spikes/tjek-probe.mjs` | One-off connectivity probe (Task 1) |
| `scripts/__tests__/*.test.js` | Vitest unit tests + fixtures |
| `scripts/__tests__/fixtures/*.json` | Sample Tjek offers for offline tests |

**Phase B — recipe set:**

| File | Responsibility |
|---|---|
| `src/data/recipes.js` | 150 curated recipes (static array) |
| `src/lib/matchRecipes.js` | `matchRecipes(selectedProducts, recipeList, limit)` |
| `src/lib/__tests__/*.test.js` | Schema validation + matcher tests |

**Shared interfaces (locked here so tasks stay consistent):**

```js
// lib/tjek.js — createTjekClient returns:
//   getActiveCatalog(dealerId) -> { id, label, runFrom, runTill, dealerId } | null
//   getCatalogPages(catalogId) -> [{ index, imageUrl }]
//   getCatalogOffers(catalogId) -> [ rawOffer, ... ]   // raw Tjek objects, unmodified

// lib/normalize.js:
//   toBaseRow(offer, dealer) -> {
//     store, brand, catalogId, validFrom, validTo,
//     name, price, currency, weight, unit, pricePerUnit
//   }
//   isFood(row) -> boolean

// enrich.js:
//   enrichRows(baseRows, { callClaude }) -> [ { ...baseRow, category, servingIdea, labels: string[] } ]
//   // callClaude(prompt) -> Promise<string(JSON)>  (injected for tests)

// excel.js:
//   writeWorkbook(rowsByStore, outPath) -> Promise<void>
//   // rowsByStore: { [storeName]: enrichedRow[] }

// recipe schema (src/data/recipes.js entries):
//   { id, title, time, servings, ingredients: string[], steps: string[],
//     tip, tags: string[], mainIngredients: string[] }

// src/lib/matchRecipes.js:
//   matchRecipes(selectedProducts: string[], recipeList = recipes, limit = 10) -> recipe[]
```

---

## Phase A — Deal Pipeline

### Task 0: Project setup

**Files:**
- Modify: `package.json`
- Create: `scripts/lib/config.js`
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: Install dependencies**

Run:
```bash
cd tilbudsapp
npm install exceljs pdf-lib
npm install -D vitest
```
Expected: packages added, no errors.

- [ ] **Step 2: Add test + pipeline scripts to `package.json`**

Add to the `"scripts"` block:
```json
"test": "vitest run",
"test:watch": "vitest",
"pipeline": "node scripts/run.js"
```

- [ ] **Step 3: Create `scripts/lib/config.js`**

```js
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// dealerId values are placeholders until confirmed by the Task 1 spike.
export const DEALERS = [
  { key: "netto",         name: "Netto",         brand: "netto",         dealerId: "" },
  { key: "foetex",        name: "Føtex",         brand: "foetex",        dealerId: "" },
  { key: "bilka",         name: "Bilka",         brand: "bilka",         dealerId: "" },
  { key: "lidl",          name: "Lidl",          brand: "lidl",          dealerId: "" },
  { key: "rema1000",      name: "Rema 1000",     brand: "rema1000",      dealerId: "" },
  { key: "meny",          name: "Meny",          brand: "meny",          dealerId: "" },
  { key: "superbrugsen",  name: "SuperBrugsen",  brand: "superbrugsen",  dealerId: "" },
  { key: "kvickly",       name: "Kvickly",       brand: "kvickly",       dealerId: "" },
  { key: "coop365",       name: "Coop 365",      brand: "coop365",       dealerId: "" },
  { key: "daglibrugsen",  name: "Dagli'Brugsen", brand: "daglibrugsen",  dealerId: "" },
  { key: "spar",          name: "Spar",          brand: "spar",          dealerId: "" },
  { key: "aldi",          name: "Aldi",          brand: "aldi",          dealerId: "" },
];

export const PATHS = {
  root: ROOT,
  catalogs: path.join(ROOT, "catalogs"),
  raw: path.join(ROOT, "data", "raw"),
  normalized: path.join(ROOT, "data", "normalized"),
  state: path.join(ROOT, "scripts", "state", "processed.json"),
  excel: path.join(ROOT, "tilbudsaviser.xlsx"),
};

export const ANTHROPIC_MODEL = "claude-opus-4-8";
```

- [ ] **Step 4: Create `.env.example` and update `.gitignore`**

`.env.example`:
```
TJEK_API_KEY=
VITE_CLAUDE_KEY=
SALLING_API_KEY=
```

Append to `.gitignore`:
```
catalogs/
data/raw/
data/normalized/
scripts/state/
```

- [ ] **Step 5: Verify test runner works**

Run: `npm test`
Expected: vitest runs, reports "No test files found" (exit 0 or 1 with that message) — confirms wiring.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json scripts/lib/config.js .env.example .gitignore
git commit -m "chore: scaffold pipeline deps, config, and test runner"
```

---

### Task 1: Tjek connectivity spike (RISK GATE)

**Purpose:** Discover the real Tjek/ShopGun API shape and confirm access before building against it. This is a throwaway probe; its findings fix the `lib/tjek.js` interface.

**Files:**
- Create: `scripts/spikes/tjek-probe.mjs`
- Modify: `scripts/lib/config.js` (fill real `dealerId`s)

- [ ] **Step 1: Write the probe**

```js
// scripts/spikes/tjek-probe.mjs
// Usage: node scripts/spikes/tjek-probe.mjs
import "dotenv/config";

const KEY = process.env.TJEK_API_KEY;
const BASE = "https://api.etilbudsavis.dk/v2"; // confirm during spike

async function get(pathq) {
  const res = await fetch(`${BASE}${pathq}`, {
    headers: { "X-Api-Key": KEY, Accept: "application/json" },
  });
  console.log(pathq, "->", res.status);
  const text = await res.text();
  console.log(text.slice(0, 1500));
  return text;
}

// 1) find a dealer, 2) find its active catalog, 3) list offers for that catalog
await get("/dealers?query=Netto");
// After noting a dealer_id and catalog_id from output, probe:
// await get(`/catalogs?dealer_ids=<id>`);
// await get(`/offers?catalog_id=<id>`);
// await get(`/catalogs/<id>/pages`);
```

- [ ] **Step 2: Install dotenv and run the probe**

Run:
```bash
npm install -D dotenv
node scripts/spikes/tjek-probe.mjs
```
Expected: HTTP 200 with JSON for at least the dealers endpoint. **If 401/403:** the API needs partner credentials — STOP and report to the user; the fallback (images + Claude-vision) branch is triggered (see Task 2b note). **If 200:** record the exact base URL, auth header, and JSON field names.

- [ ] **Step 3: Record findings inline as a comment block in `scripts/lib/tjek.js` header**

Create `scripts/lib/tjek.js` starting with a comment documenting: base URL, auth header name, and the field names for catalog id / run_from / run_till / offer heading / offer price / page image URL. (Implementation added in Task 2.)

- [ ] **Step 4: Fill real `dealerId`s in `scripts/lib/config.js`**

Replace each empty `dealerId: ""` with the id discovered via the probe for that chain.

- [ ] **Step 5: Commit**

```bash
git add scripts/spikes/tjek-probe.mjs scripts/lib/tjek.js scripts/lib/config.js package.json package-lock.json
git commit -m "spike: confirm Tjek API access and dealer ids"
```

---

### Task 2: Tjek client (`lib/tjek.js`)

**Files:**
- Modify: `scripts/lib/tjek.js`
- Test: `scripts/__tests__/tjek.test.js`

- [ ] **Step 1: Write the failing test (client shape + URL/headers via injected fetch)**

```js
// scripts/__tests__/tjek.test.js
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

  it("getActiveCatalog returns null when no catalog is currently valid", async () => {
    const fetchImpl = vi.fn(() => jsonResponse([
      { id: "old", dealer_id: "d1", run_from: "2026-01-01T00:00:00+0000", run_till: "2026-01-07T23:59:59+0000" },
    ]));
    const client = createTjekClient({ apiKey: "k", fetchImpl, now: () => new Date("2026-08-12") });
    expect(await client.getActiveCatalog("d1")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/__tests__/tjek.test.js`
Expected: FAIL — `createTjekClient` is not exported.

- [ ] **Step 3: Implement `lib/tjek.js`**

Keep the Task-1 findings comment at top, then:
```js
const BASE = "https://api.etilbudsavis.dk/v2"; // per Task 1 spike

export function createTjekClient({ apiKey, fetchImpl = fetch, now = () => new Date() }) {
  async function get(pathq) {
    const res = await fetchImpl(`${BASE}${pathq}`, {
      headers: { "X-Api-Key": apiKey, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Tjek ${pathq} -> ${res.status}`);
    return res.json();
  }

  function mapCatalog(c) {
    return { id: c.id, label: c.label ?? "", dealerId: c.dealer_id,
             runFrom: c.run_from, runTill: c.run_till };
  }

  return {
    async getActiveCatalog(dealerId) {
      const list = await get(`/catalogs?dealer_ids=${encodeURIComponent(dealerId)}`);
      const t = now().getTime();
      const active = (list || [])
        .map(mapCatalog)
        .find(c => new Date(c.runFrom).getTime() <= t && t <= new Date(c.runTill).getTime());
      return active ?? null;
    },
    async getCatalogPages(catalogId) {
      const pages = await get(`/catalogs/${encodeURIComponent(catalogId)}/pages`);
      return (pages || []).map((p, i) => ({ index: i, imageUrl: p.view ?? p.zoom ?? p.image }));
    },
    async getCatalogOffers(catalogId) {
      return get(`/offers?catalog_id=${encodeURIComponent(catalogId)}`);
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run scripts/__tests__/tjek.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/tjek.js scripts/__tests__/tjek.test.js
git commit -m "feat: Tjek API client with active-catalog selection"
```

---

### Task 3: Normalize + food filter (`lib/normalize.js`)

**Files:**
- Create: `scripts/lib/normalize.js`
- Test: `scripts/__tests__/normalize.test.js`
- Create: `scripts/__tests__/fixtures/offer.json`

- [ ] **Step 1: Create fixture `scripts/__tests__/fixtures/offer.json`**

```json
{
  "id": "off1",
  "heading": "Hakket oksekød 8-12%",
  "pricing": { "price": 25.0, "currency": "DKK" },
  "quantity": { "size": { "from": 400, "to": 400 }, "unit": { "symbol": "g" } },
  "run_from": "2026-08-11T00:00:00+0000",
  "run_till": "2026-08-17T23:59:59+0000"
}
```

- [ ] **Step 2: Write the failing test**

```js
// scripts/__tests__/normalize.test.js
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run scripts/__tests__/normalize.test.js`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `lib/normalize.js`**

```js
const EXCLUDE = [
  "vodka", "vin ", "øl", "bajer", "spiritus", "gajol", "shot", "cocktail",
  "slik", "chokolade", "marabou", "chips", "sodavand", "cola", "energidrik",
  "toiletpapir", "køkkenrulle", "vaskepulver", "sæbe", "shampoo", "tandpasta",
  "bleer", "rengøring", "opvasketabs",
];

export function toBaseRow(offer, dealer) {
  const q = offer.quantity?.size;
  const unit = offer.quantity?.unit?.symbol ?? "";
  const size = q?.from ?? null;
  const weight = size != null && unit ? `${size} ${unit}` : "";
  return {
    store: dealer.name,
    brand: dealer.brand,
    catalogId: dealer.catalogId ?? null,
    validFrom: offer.run_from ?? null,
    validTo: offer.run_till ?? null,
    name: offer.heading ?? "",
    price: offer.pricing?.price ?? null,
    currency: offer.pricing?.currency ?? "DKK",
    weight,
    unit,
    pricePerUnit: null,
  };
}

export function isFood(row) {
  const n = (row.name ?? "").toLowerCase();
  if (!n) return false;
  return !EXCLUDE.some(bad => n.includes(bad));
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run scripts/__tests__/normalize.test.js`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/normalize.js scripts/__tests__/normalize.test.js scripts/__tests__/fixtures/offer.json
git commit -m "feat: normalize Tjek offers to base rows + food filter"
```

---

### Task 4: State store (`lib/state.js`)

**Files:**
- Create: `scripts/lib/state.js`
- Test: `scripts/__tests__/state.test.js`

- [ ] **Step 1: Write the failing test**

```js
// scripts/__tests__/state.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/__tests__/state.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/state.js`**

```js
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export async function loadState(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return {};
    throw err;
  }
}

export async function saveState(file, state) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(state, null, 2), "utf8");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run scripts/__tests__/state.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/state.js scripts/__tests__/state.test.js
git commit -m "feat: JSON state store for processed catalogs"
```

---

### Task 5: PDF stitching (`lib/pdf.js`)

**Files:**
- Create: `scripts/lib/pdf.js`
- Test: `scripts/__tests__/pdf.test.js`

- [ ] **Step 1: Write the failing test**

```js
// scripts/__tests__/pdf.test.js
import { describe, it, expect } from "vitest";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { stitchPdf } from "../lib/pdf.js";

// 1x1 PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

describe("stitchPdf", () => {
  it("creates a PDF with one page per image", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "pdf-"));
    const out = path.join(dir, "out.pdf");
    await stitchPdf([PNG, PNG], out);
    const doc = await PDFDocument.load(readFileSync(out));
    expect(doc.getPageCount()).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/__tests__/pdf.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/pdf.js`**

```js
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

export async function stitchPdf(imageBuffers, outPath) {
  const doc = await PDFDocument.create();
  for (const buf of imageBuffers) {
    const bytes = new Uint8Array(buf);
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
    const img = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    const page = doc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, await doc.save());
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run scripts/__tests__/pdf.test.js`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/pdf.js scripts/__tests__/pdf.test.js
git commit -m "feat: stitch catalog page images into a PDF"
```

---

### Task 6: Catalog diffing (`fetch.js` — pure part)

**Files:**
- Create: `scripts/fetch.js`
- Test: `scripts/__tests__/fetch.test.js`

- [ ] **Step 1: Write the failing test**

```js
// scripts/__tests__/fetch.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/__tests__/fetch.test.js`
Expected: FAIL — `diffCatalogs` not exported.

- [ ] **Step 3: Implement `diffCatalogs` in `scripts/fetch.js`**

```js
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { PATHS } from "./lib/config.js";
import { stitchPdf } from "./lib/pdf.js";

export function diffCatalogs(active, state) {
  const toProcess = [];
  const unchanged = [];
  for (const [key, cat] of Object.entries(active)) {
    if (!cat) continue; // no active catalog this week
    if (state[key]?.catalogId === cat.id) unchanged.push(key);
    else toProcess.push(key);
  }
  return { toProcess, unchanged };
}

// fetchDealer downloads pages, stitches a PDF, and saves raw offers JSON.
// Returns { catalog, pdfPath, rawPath }.
export async function fetchDealer(client, dealer, catalog) {
  const pages = await client.getCatalogPages(catalog.id);
  const buffers = [];
  for (const p of pages) {
    if (!p.imageUrl) continue;
    const res = await fetch(p.imageUrl);
    buffers.push(Buffer.from(await res.arrayBuffer()));
  }
  const week = (catalog.label || catalog.id).replace(/[^\w-]+/g, "_");
  const pdfPath = path.join(PATHS.catalogs, `${dealer.key}_${week}.pdf`);
  if (buffers.length) await stitchPdf(buffers, pdfPath);

  const offers = await client.getCatalogOffers(catalog.id);
  const rawPath = path.join(PATHS.raw, `${dealer.key}.json`);
  await mkdir(path.dirname(rawPath), { recursive: true });
  await writeFile(rawPath, JSON.stringify(offers, null, 2), "utf8");

  return { catalog, pdfPath: buffers.length ? pdfPath : null, rawPath };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run scripts/__tests__/fetch.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/fetch.js scripts/__tests__/fetch.test.js
git commit -m "feat: catalog diffing + per-dealer fetch (pages->PDF, offers->JSON)"
```

---

### Task 7: Enrichment (`enrich.js`)

**Files:**
- Create: `scripts/enrich.js`
- Test: `scripts/__tests__/enrich.test.js`

- [ ] **Step 1: Write the failing test (Claude injected as a stub)**

```js
// scripts/__tests__/enrich.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/__tests__/enrich.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `enrich.js`**

```js
const PROMPT = (rows) => `Du er en dansk madvareekspert. For hver vare nedenfor:
- Split sammensatte varer ("X eller Y") i separate varer.
- Tilføj felterne: category (dansk madkategori), servingIdea (kort), labels (fx Dansk, Økologisk, ASC, MSC).
Svar KUN med et JSON-array af objekter med felterne: name, category, servingIdea, labels.
Varer: ${JSON.stringify(rows.map(r => r.name))}`;

export async function enrichRows(baseRows, { callClaude }) {
  if (baseRows.length === 0) return [];
  let parsed;
  try {
    parsed = JSON.parse(await callClaude(PROMPT(baseRows)));
    if (!Array.isArray(parsed)) throw new Error("not an array");
  } catch {
    return baseRows.map(r => ({ ...r, category: "Ukategoriseret", servingIdea: "", labels: [] }));
  }
  // Attach enrichment back to the originating base row by name prefix match.
  return parsed.map(p => {
    const base = baseRows.find(b => p.name?.startsWith(b.name) || b.name?.startsWith(p.name)) ?? baseRows[0];
    return {
      ...base,
      name: p.name ?? base.name,
      category: p.category ?? "Ukategoriseret",
      servingIdea: p.servingIdea ?? "",
      labels: Array.isArray(p.labels) ? p.labels : [],
    };
  });
}

// Real Claude caller used by run.js (not exercised in unit tests).
export function makeClaudeCaller({ apiKey, model }) {
  return async function callClaude(prompt) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text ?? "";
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run scripts/__tests__/enrich.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/enrich.js scripts/__tests__/enrich.test.js
git commit -m "feat: Claude enrichment with variant split and safe fallback"
```

---

### Task 8: Excel writer (`excel.js`)

**Files:**
- Create: `scripts/excel.js`
- Test: `scripts/__tests__/excel.test.js`

- [ ] **Step 1: Write the failing test**

```js
// scripts/__tests__/excel.test.js
import { describe, it, expect } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import ExcelJS from "exceljs";
import { writeWorkbook } from "../excel.js";

describe("writeWorkbook", () => {
  it("writes an Oversigt sheet plus one sheet per store", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "xls-"));
    const out = path.join(dir, "t.xlsx");
    await writeWorkbook({
      Netto: [{ name: "Æbler", price: 10, weight: "1 kg", category: "Frugt", labels: ["Dansk"] }],
      Bilka: [{ name: "Mælk", price: 8, weight: "1 l", category: "Mejeri", labels: [] }],
    }, out);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(out);
    expect(wb.getWorksheet("Oversigt")).toBeTruthy();
    expect(wb.getWorksheet("Netto")).toBeTruthy();
    expect(wb.getWorksheet("Bilka")).toBeTruthy();
    // Oversigt lists total counts
    const oversigt = wb.getWorksheet("Oversigt");
    const values = oversigt.getColumn(1).values.map(String);
    expect(values.some(v => v.includes("Netto"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/__tests__/excel.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `excel.js`**

```js
import { rename, mkdir } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";

const CATEGORY_COLORS = {
  Frugt: "FFE8F5E9", Grønt: "FFE8F5E9", Kød: "FFFFEBEE", Mejeri: "FFFFF9E6",
  Fisk: "FFE3F2FD", Brød: "FFFFF3E0", Ukategoriseret: "FFF5F5F5",
};

function addStoreSheet(wb, store, rows) {
  const ws = wb.addWorksheet(store);
  ws.columns = [
    { header: "Vare", key: "name", width: 40 },
    { header: "Pris", key: "price", width: 10 },
    { header: "Mængde", key: "weight", width: 14 },
    { header: "Kategori", key: "category", width: 18 },
    { header: "Mærker", key: "labels", width: 24 },
    { header: "Serveringsforslag", key: "servingIdea", width: 30 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const r of rows) {
    const row = ws.addRow({
      name: r.name, price: r.price, weight: r.weight ?? "",
      category: r.category ?? "", labels: (r.labels ?? []).join(", "),
      servingIdea: r.servingIdea ?? "",
    });
    row.getCell("name").font = { bold: true };
    const color = CATEGORY_COLORS[r.category] ?? CATEGORY_COLORS.Ukategoriseret;
    row.eachCell(c => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } }; });
  }
  ws.addRow({});
  ws.addRow({ name: `I alt: ${rows.length} varer` }).getCell("name").font = { bold: true, italic: true };
}

export async function writeWorkbook(rowsByStore, outPath) {
  const wb = new ExcelJS.Workbook();
  const overview = wb.addWorksheet("Oversigt");
  overview.columns = [
    { header: "Butik", key: "store", width: 24 },
    { header: "Antal varer", key: "count", width: 14 },
  ];
  overview.getRow(1).font = { bold: true };

  for (const [store, rows] of Object.entries(rowsByStore)) {
    overview.addRow({ store, count: rows.length });
    addStoreSheet(wb, store, rows);
  }

  await mkdir(path.dirname(outPath), { recursive: true });
  const tmp = `${outPath}.tmp`;
  await wb.xlsx.writeFile(tmp);
  await rename(tmp, outPath); // atomic replace
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run scripts/__tests__/excel.test.js`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add scripts/excel.js scripts/__tests__/excel.test.js
git commit -m "feat: multi-sheet Excel writer with category colors and atomic write"
```

---

### Task 9: Orchestrator (`run.js`)

**Files:**
- Create: `scripts/run.js`

- [ ] **Step 1: Implement `run.js`**

```js
import "dotenv/config";
import { parseArgs } from "node:util";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { DEALERS, PATHS, ANTHROPIC_MODEL } from "./lib/config.js";
import { createTjekClient } from "./lib/tjek.js";
import { loadState, saveState } from "./lib/state.js";
import { diffCatalogs, fetchDealer } from "./fetch.js";
import { toBaseRow, isFood } from "./lib/normalize.js";
import { enrichRows, makeClaudeCaller } from "./enrich.js";
import { writeWorkbook } from "./excel.js";

const { values } = parseArgs({ options: {
  dealer: { type: "string" }, "dry-run": { type: "boolean" },
  force: { type: "boolean" }, limit: { type: "string" },
} });

const log = (...a) => console.log(new Date().toISOString(), ...a);

async function main() {
  const dealers = DEALERS.filter(d => !values.dealer || d.key === values.dealer);
  const client = createTjekClient({ apiKey: process.env.TJEK_API_KEY });
  const state = await loadState(PATHS.state);

  // 1) active catalog per dealer
  const active = {};
  for (const d of dealers) {
    try { active[d.key] = await client.getActiveCatalog(d.dealerId); }
    catch (e) { log("WARN active catalog", d.key, e.message); active[d.key] = null; }
  }

  let { toProcess } = diffCatalogs(active, values.force ? {} : state);
  if (values.limit) toProcess = toProcess.slice(0, Number(values.limit));
  log("to process:", toProcess);

  const callClaude = makeClaudeCaller({ apiKey: process.env.VITE_CLAUDE_KEY, model: ANTHROPIC_MODEL });
  const rowsByStore = {};

  for (const key of toProcess) {
    const dealer = dealers.find(d => d.key === key);
    const catalog = active[key];
    try {
      if (values["dry-run"]) { log("DRY would process", key, catalog.id); continue; }
      const { rawPath } = await fetchDealer(client, dealer, catalog);
      const offers = JSON.parse(await readFile(rawPath, "utf8"));
      const base = offers.map(o => toBaseRow(o, { ...dealer, catalogId: catalog.id })).filter(isFood);
      const enriched = await enrichRows(base, { callClaude });
      rowsByStore[dealer.name] = enriched;
      state[key] = { catalogId: catalog.id, processedAt: new Date().toISOString(), count: enriched.length };
      log("processed", key, enriched.length, "rows");
    } catch (e) {
      log("ERROR dealer", key, e.message); // per-dealer isolation
    }
  }

  if (!values["dry-run"] && Object.keys(rowsByStore).length) {
    await writeWorkbook(rowsByStore, PATHS.excel);
    await saveState(PATHS.state, state);
    log("wrote", PATHS.excel);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Dry-run smoke test**

Run: `node scripts/run.js --dry-run`
Expected: logs "to process: [...]" and "DRY would process ..." lines, no files written, exit 0. (Requires a valid `TJEK_API_KEY` in `.env`; if the key is missing, it logs WARN per dealer and processes nothing — still exit 0.)

- [ ] **Step 3: Single-dealer live test**

Run: `node scripts/run.js --dealer=netto --limit=1`
Expected: creates `catalogs/netto_*.pdf`, `data/raw/netto.json`, updates `tilbudsaviser.xlsx` with a `Netto` sheet. Inspect the Excel opens without error.

- [ ] **Step 4: Commit**

```bash
git add scripts/run.js
git commit -m "feat: pipeline orchestrator with dealer isolation and CLI flags"
```

---

### Task 10: Daily scheduling

**Files:**
- Create: `scripts/run-daily.cmd`
- Create: `docs/pipeline-scheduling.md`

- [ ] **Step 1: Create `scripts/run-daily.cmd`**

```bat
@echo off
cd /d "%~dp0.."
node scripts\run.js >> scripts\state\run.log 2>&1
```

- [ ] **Step 2: Create `docs/pipeline-scheduling.md`**

Document the exact Task Scheduler registration command:
```
schtasks /Create /SC DAILY /TN "TilbudskokkenPipeline" /TR "\"C:\Users\Johan\Documents\Tilbudskokken\tilbudsapp\scripts\run-daily.cmd\"" /ST 06:00 /RL LIMITED /F
```
Include: how to view logs (`scripts/state/run.log`), how to run once manually (`schtasks /Run /TN TilbudskokkenPipeline`), and how to delete (`schtasks /Delete /TN TilbudskokkenPipeline /F`).

- [ ] **Step 3: Verify the wrapper runs**

Run: `scripts\run-daily.cmd`
Expected: exits 0; `scripts/state/run.log` contains a timestamped run.

- [ ] **Step 4: Commit**

```bash
git add scripts/run-daily.cmd docs/pipeline-scheduling.md
git commit -m "feat: daily Task Scheduler wrapper and scheduling docs"
```

---

## Phase B — Curated Recipe Set

### Task 11: Recipe matcher (`src/lib/matchRecipes.js`)

**Files:**
- Create: `src/lib/matchRecipes.js`
- Create: `src/data/recipes.js` (seeded with 3 recipes for now)
- Test: `src/lib/__tests__/matchRecipes.test.js`

- [ ] **Step 1: Seed `src/data/recipes.js` with 3 valid recipes**

```js
export const recipes = [
  { id: 1, title: "Klassisk bolognese med spaghetti", time: "35 min", servings: 4,
    ingredients: ["500g hakket oksekød","500g spaghetti","2 løg","400g dåsetomater","3 fed hvidløg","Salt og peber","1 tsk oregano","Olivenolie"],
    steps: ["Hak løg og hvidløg og svits i olie.","Brun oksekødet.","Tilsæt tomater og krydderier.","Simr 20 min mens spaghetti koges.","Server med parmesan."],
    tip: "Et skvæt mælk giver mildere sauce.",
    tags: ["pasta","comfort","børnevenlig"], mainIngredients: ["oksekød","spaghetti","tomat"] },
  { id: 2, title: "Citron-hvidløgskylling med ris", time: "30 min", servings: 4,
    ingredients: ["600g kyllingefilet","300g ris","4 fed hvidløg","1 citron","Basilikum","Salt og peber","Olivenolie"],
    steps: ["Kog ris.","Krydr kylling.","Svits hvidløg, steg kylling.","Pres citron over.","Server med ris."],
    tip: "Lad kyllingen hvile før servering.",
    tags: ["kylling","let"], mainIngredients: ["kylling","ris","citron"] },
  { id: 3, title: "Laks med flødesauce og kartofler", time: "30 min", servings: 4,
    ingredients: ["400g laksefilet","1kg kartofler","0.5L fløde","1 løg","Dild","Salt og peber","Smør","Citron"],
    steps: ["Kog kartofler.","Krydr laks.","Steg laks i smør.","Lav flødesauce.","Anret med urter."],
    tip: "Brug frisk dild for bedste smag.",
    tags: ["fisk","fredagsmad"], mainIngredients: ["laks","kartofler","fløde"] },
];
```

- [ ] **Step 2: Write the failing matcher test**

```js
// src/lib/__tests__/matchRecipes.test.js
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/matchRecipes.test.js`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `src/lib/matchRecipes.js`**

```js
import { recipes as defaultRecipes } from "../data/recipes.js";

function score(recipe, selectedLower) {
  return recipe.mainIngredients.reduce((s, ing) => {
    const i = ing.toLowerCase();
    return s + (selectedLower.some(p => p.includes(i) || i.includes(p)) ? 1 : 0);
  }, 0);
}

export function matchRecipes(selectedProducts, recipeList = defaultRecipes, limit = 10) {
  const selectedLower = selectedProducts.map(p => p.toLowerCase());
  return recipeList
    .map(r => ({ r, s: score(r, selectedLower) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(x => x.r);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/matchRecipes.test.js`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/matchRecipes.js src/data/recipes.js src/lib/__tests__/matchRecipes.test.js
git commit -m "feat: recipe matcher ranking by ingredient overlap"
```

---

### Task 12: Recipe schema validation test (gate for the 150)

**Files:**
- Test: `src/data/__tests__/recipes.schema.test.js`

- [ ] **Step 1: Write the validation test (expects 150; will fail until content is complete)**

```js
// src/data/__tests__/recipes.schema.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/recipes.schema.test.js`
Expected: FAIL — "has exactly 150 recipes" (currently 3).

- [ ] **Step 3: Commit the gating test**

```bash
git add src/data/__tests__/recipes.schema.test.js
git commit -m "test: recipe schema validation gate (expects 150)"
```

---

### Task 13: Author the 150 recipes (content, in batches)

**Files:**
- Modify: `src/data/recipes.js`

This task fills `recipes` to 150 entries. Do it in batches of ~25, running the schema test after each batch. Every entry uses the exact schema from Task 11. Do NOT invent new fields.

**Category coverage target (so `matchRecipes` has breadth):** aim for roughly —
- 30 kød (oksekød, svinekød, kylling, hakket)
- 20 fisk (laks, torsk, rejer, tun)
- 30 pasta/ris/kartoffel-baserede
- 20 vegetar/vegansk
- 20 supper/gryder
- 15 salater/lette retter
- 15 morgenmad/brunch/æg

- [ ] **Step 1: Add recipes 4–28 (batch 1)** — append 25 entries to the `recipes` array. Run: `npx vitest run src/data/__tests__/recipes.schema.test.js` (still fails on count; must pass schema/unique-id checks — if a schema assertion fails, fix the offending entry).
- [ ] **Step 2: Commit** — `git add src/data/recipes.js && git commit -m "feat: recipes batch 1 (4-28)"`
- [ ] **Step 3: Add recipes 29–53 (batch 2)** — same process.
- [ ] **Step 4: Commit** — `git commit -m "feat: recipes batch 2 (29-53)"`
- [ ] **Step 5: Add recipes 54–78 (batch 3)** — same process.
- [ ] **Step 6: Commit** — `git commit -m "feat: recipes batch 3 (54-78)"`
- [ ] **Step 7: Add recipes 79–103 (batch 4)** — same process.
- [ ] **Step 8: Commit** — `git commit -m "feat: recipes batch 4 (79-103)"`
- [ ] **Step 9: Add recipes 104–128 (batch 5)** — same process.
- [ ] **Step 10: Commit** — `git commit -m "feat: recipes batch 5 (104-128)"`
- [ ] **Step 11: Add recipes 129–150 (batch 6, 22 entries)** — same process.
- [ ] **Step 12: Run full validation** — Run: `npx vitest run src/data/__tests__/recipes.schema.test.js` — Expected: PASS (150, all valid, unique ids).
- [ ] **Step 13: Commit** — `git commit -m "feat: complete 150 curated recipes"`

---

### Task 14: Full test sweep + finish

**Files:** none (verification)

- [ ] **Step 1: Run the entire suite**

Run: `npm test`
Expected: all Phase A + Phase B tests PASS.

- [ ] **Step 2: Confirm pipeline dry-run still works**

Run: `node scripts/run.js --dry-run`
Expected: exit 0, no crashes.

- [ ] **Step 3: Final commit / branch is ready for review**

```bash
git add -A
git commit -m "chore: full green test sweep for pipeline + recipes" --allow-empty
```

---

## Self-Review Notes

- **Spec coverage:** Tjek client (T2) ✓, images→PDF (T5) ✓, offers JSON (T6) ✓, food filter (T3) ✓, Claude enrich/variant split (T7) ✓, multi-sheet Excel with colors/bold/summary (T8) ✓, update detection/state (T4, T6, T9) ✓, daily scheduling (T10) ✓, per-dealer isolation + dry-run (T9) ✓, config/.env/dealers (T0, T1) ✓, 150 static recipes + matcher replacing pickRecipe (T11–T13) ✓, Tjek risk spike + fallback flagged (T1) ✓.
- **Interface consistency:** `createTjekClient`, `toBaseRow`/`isFood`, `enrichRows({callClaude})`, `writeWorkbook(rowsByStore,out)`, `matchRecipes(selected,list,limit)` are used identically wherever referenced.
- **Fallback branch:** if Task 1 returns 401/403, stop and consult the user; the images+Claude-vision fallback becomes a plan revision (enrich reads page images instead of offers JSON) — the Excel/state/recipe tasks are unchanged.
