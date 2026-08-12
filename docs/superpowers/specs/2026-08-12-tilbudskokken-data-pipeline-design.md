# Tilbudskokken — Deal Pipeline + Curated Recipe Set

**Date:** 2026-08-12
**Status:** Approved design

## Summary

Two independent deliverables for the Tilbudskokken app:

- **A. Deal pipeline** (daily, automated): download the current weekly catalog for each
  tracked Danish supermarket from the Tjek / ShopGun API (the backend behind
  etilbudsavis.dk), archive it as a per-store PDF, and extract structured product data
  into a multi-sheet Excel workbook (`tilbudsaviser.xlsx`).
- **B. Curated recipe set** (one-time, static): 150 hand-curated Danish recipes baked into
  the app as a static module, matched against active deals at runtime.

The two deliverables share nothing at runtime. B is deal-independent. We build A first,
then B (honoring the original "after all data is there, build the recipes" ordering).

## Context

- App: React 19 + Vite (`tilbudsapp/`), Danish UI, PWA.
- Existing data paths:
  - `api/deals.js` — Salling Group food-waste API (unchanged, unrelated to this work).
  - `api/recipe.js` — proxy to the Anthropic API using `VITE_CLAUDE_KEY`.
- Existing manual workflow (being replaced/automated): store PDFs downloaded by hand +
  a Claude "tilbudsavis-pdf" skill that visually extracts products into `tilbudsaviser.xlsx`
  (sheets: `Oversigt`, `Bilka`, `Coop 365discount`, `Dagli'Brugsen`, `Føtex`, `Lidl`,
  `Meny`, `Netto`, `Spar`, `SuperBrugsen Kvickly`).
- Existing recipe schema (from `App.jsx`):
  `{ title, time, servings, ingredients: string[], steps: string[], tip }`, selected by a
  4-way keyword `pickRecipe(selected)`.
- Available keys: `VITE_CLAUDE_KEY` (Anthropic), `SALLING_API_KEY`. **No Tjek token yet.**

## Key decisions

| Decision | Choice |
|---|---|
| Data source | Tjek/ShopGun API: page images → stitched PDF (archival) **and** structured offers JSON (product base) |
| Update trigger | Daily scheduled check; only new/changed catalogs are processed |
| Extraction engine | Hybrid — Tjek JSON as base, Claude enriches (variant split, category, serving idea, labels) |
| Recipes | 150 fixed, curated, deal-independent static recipes; app matches them to live deals |
| Packaging | Local Node CLI toolkit in `tilbudsapp/scripts/`, run daily by Windows Task Scheduler |

## A. Deal pipeline

### Components

Each module is focused and independently testable.

| Module | Responsibility | Depends on |
|---|---|---|
| `scripts/lib/tjek.js` | Tjek/ShopGun API client: auth, list active catalog per dealer, fetch page images, fetch structured offers JSON | Tjek API, `TJEK_API_KEY` |
| `scripts/lib/config.js` | Tracked stores → Tjek dealer IDs, output paths | — |
| `scripts/fetch.js` | Per dealer: compare active catalog to state; if new → download page images, stitch a per-store PDF into `catalogs/`, save raw offers JSON into `raw/` | `lib/tjek.js`, `pdf-lib` |
| `scripts/enrich.js` | Filter offers to food only; call Claude to split bundled variants and add category / serving idea / labels → normalized rows into `normalized/` | `raw/*.json`, Anthropic (`VITE_CLAUDE_KEY`) |
| `scripts/excel.js` | Write `tilbudsaviser.xlsx`: `Oversigt` sheet + one sheet per store; category color-coding, bold product name column, per-sheet summary row | `normalized/*.json`, `exceljs` |
| `scripts/run.js` | Orchestrate fetch → enrich → excel; update `state/processed.json`; log. Flags: `--dealer=`, `--dry-run`, `--force`, `--limit=` | all of the above |

### Data flow

```
Windows Task Scheduler (daily)
  └─ node scripts/run.js
       ├─ fetch.js   → catalogs/<store>_<week>.pdf   +  raw/<store>.json
       ├─ enrich.js  → normalized/<store>.json        (Tjek JSON base + Claude enrich)
       └─ excel.js   → tilbudsaviser.xlsx  (Oversigt + one sheet per store)
```

### Update detection

`scripts/state/processed.json` stores, per dealer: last processed catalog id, publish/valid
dates, and a content hash. On each run, `fetch.js` asks Tjek for the currently active catalog
per dealer and skips any dealer whose catalog id is unchanged. `--force` bypasses the skip.
This prevents redundant downloads and redundant Claude token spend.

### Normalized row schema (base for Excel + future app use)

```
{
  store, brand, catalogId, validFrom, validTo,
  name, brandName, weight, price, pricePerUnit, unit,
  origin, labels: string[], category, servingIdea, notes
}
```

Tjek JSON provides: name, price, dates, sometimes weight/unit. Claude enrich adds/derives:
variant splitting, `category`, `servingIdea`, `labels`, and cleans `weight`/`unit`.

### Excel output

Reuses the existing workbook shape: an `Oversigt` overview sheet plus one sheet per tracked
store. Rows colored by `category`; product name column bold; a summary row per sheet with the
total product count. Written atomically (temp file → rename) so a partial run never corrupts
the workbook.

### Error handling

- **Per-dealer isolation:** one store's failure (network, missing catalog, bad JSON) logs a
  warning and continues; other stores still process.
- **API retry/backoff** on Tjek and Anthropic calls.
- **`--dry-run`** performs no writes and no token spend — reports what would happen.
- Atomic Excel write; state is only updated for dealers that fully succeed.

### Testing

- Unit tests for `enrich` normalization and `excel` writer against committed fixture JSON
  (no network, no AI).
- `node scripts/run.js --dealer=netto --limit=1` for a cheap single-store live smoke test.
- Mocked Tjek responses for `fetch.js` catalog-diffing logic.

## B. Curated recipe set

- `src/data/recipes.js` — **150 curated Danish recipes** in the existing app schema, extended
  with `tags: string[]` and `mainIngredients: string[]` so many recipes can be matched to a
  set of selected deal products:
  ```
  { id, title, time, servings, ingredients: string[], steps: string[], tip,
    tags: string[], mainIngredients: string[] }
  ```
- `matchRecipes(selectedProducts)` helper replacing the current 4-way `pickRecipe`, ranking
  recipes by overlap of `mainIngredients`/`tags` with selected products.
- Fully static: written once, committed, no AI at runtime, no deal dependency.

## Config

- `.env` adds `TJEK_API_KEY` (+ secret if the API requires it).
- `scripts/lib/config.js` lists tracked dealers with their Tjek dealer IDs.
- **Default tracked stores:** Bilka, Føtex, Netto, Lidl, Rema 1000, Meny, SuperBrugsen,
  Kvickly, Coop 365, Dagli'Brugsen, Spar, Aldi.

## Dependencies

- `exceljs` — Excel writing.
- `pdf-lib` — stitch page images into a per-store PDF.
- Anthropic via the existing `fetch` pattern (`VITE_CLAUDE_KEY`).
- Node ESM (repo is `"type": "module"`).

## Risks & first step

- **Tjek API access is the main risk.** Tjek has restricted this API over time and it may
  require partner credentials. **Implementation step 1 is a connectivity spike**: verify we
  can authenticate, list the active catalog, and pull offers for a single dealer.
- **Fallback:** if the structured offers endpoint is unavailable, fall back to
  images + Claude-vision extraction (the original "download images → PDF → AI extract"
  approach). The rest of the design (state, Excel, scheduling, recipes) is unchanged.

## Out of scope

- The app does **not** yet consume tilbudsavis deal data; Excel is the pipeline's end product.
  Only the curated recipes are integrated into the app.
- Restoring the app's missing `src/` (index.html references `/src/main.jsx`) is a separate
  concern; recipe integration assumes `src/data/recipes.js` as the integration point.
