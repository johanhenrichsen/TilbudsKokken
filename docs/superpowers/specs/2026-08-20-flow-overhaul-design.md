# Spotkokken — User Flow Overhaul (Design Spec)

**Date:** 2026-08-20
**Status:** Approved — ready for implementation planning
**Source:** `deal-recipe-app-flow_2.html` guide + reconciliation discussion

## Summary

Overhaul the Spotkokken user flow to match the deal-to-recipe guide, **keeping the
current visual style unchanged**. The guide proposed a per-session funnel; the user
chose to **keep one-time onboarding**, so the guide's "primary funnel" steps become
prominent quick-filters on the results screen instead of session gates. Diet moves
out of onboarding into optional Profile settings.

## Reconciled decisions (locked)

1. **Data enrichment:** AI backfill script for the 149 existing recipes **and** update
   the generation prompts so new recipes carry the fields natively.
2. **Meal type:** NOT a funnel gate. The pool is ~100% dinner, so gating would collapse
   results (the over-gating the guide warns about for cuisine). Instead: tag `mealType`
   on every recipe, show it as a **card badge** and an **optional secondary filter** that
   only meaningfully engages once the pool gains breakfast/lunch/snack variety.
3. **Onboarding:** stays **one-time** (not re-run every visit). Simplified to
   Welcome → Stores (hard gate) → Household size. Diet step removed.
4. **Profile/settings:** full model — default supermarket, allergies/intolerances,
   lifestyle diet. All optional, editable anytime, persisted to localStorage + Supabase.

## Scope

### 1. Data enrichment (foundation)

New/normalized fields on each recipe in `src/data/weeklyRecipes.json`:

- `mealType` — one of `aftensmad` | `frokost` | `morgenmad` | `snack`
- `cookingMethod` — one of: `Én pande`, `Ovn`, `Gryde`, `Wok`, `Grill`, `Bagning`,
  `Ingen tilberedning`
- `allergens` — array drawn from the EU-14 DK labels (see Reference below)
- `difficulty` — normalized to `Nem` | `Middel` | `Svær` (80 currently undefined; the
  rest are inconsistent: Let/nem/Nem/Meget nem/Mellem/Middel/mellem)
- `cuisine` — normalized to the 8 canonical badges (currently inconsistent flag prefixes)

Deliverables:
- `scripts/enrich-recipes.mjs` — one-time Node script using the Anthropic API
  (`claude-opus-4-8` or a cheaper model — TBD in plan) that reads the JSON, tags each
  recipe, and writes back. Idempotent: skips recipes already fully tagged. Batches +
  logs progress. Requires `ANTHROPIC_API_KEY` in env.
- Update `api/match-recipes.js` and `api/generate-madspild-recipes.js` generation
  prompts + output schema so newly generated recipes include the new fields.

### 2. Onboarding (one-time, simplified)

- Steps: Welcome → **Stores** (hard gate, unchanged) → **Household size**.
- Remove the diet step. Existing users' saved `diet` localStorage value migrates into
  the new Profile settings on first load after upgrade.
- `onboardingDone` / existing skip logic preserved.

### 3. Results screen — two filter tiers

- **Primary quick-picks** (prominent top strip, always visible on desktop; behind the
  existing mobile "Filtre" affordance where appropriate):
  - **Prep time** rebucketed to the guide's ranges: `Under 15` / `15–30` / `30–60` /
    `60+ min`. Derived from the existing `time` string.
  - **Meal type** (badge-driven filter, see decision #2).
- **Secondary filters** (expandable/secondary): **Price**, **Antal personer**,
  **Tilberedningsmetode**, **Sværhedsgrad**.
- Profile diet + allergies drive **dimming/flagging** of non-matching recipes, NOT hard
  removal (guide: users cook it themselves, so this is convenience not a safety gate).

### 4. Recipe card (same visual style, new content)

Card shows: photo · title · **cuisine badge** · **allergen tags** · **pris/ret** ·
**pris/person** · **sværhedsgrad** · **tilberedningstid** · **metode**.

- `pris/ret` = sum of non-pantry deal prices; `pris/person` = `pris/ret ÷ servings_count`.
- Reuse existing card CSS classes, badge styles, and dark-mode tokens. No visual restyle —
  only new badge/stat rows composed from existing primitives.

### 5. Profile & settings (new)

Optional, editable anytime:
- **Default supermarket** — pre-fills onboarding store step.
- **Allergies/intolerances** — multi-select from EU-14; dims/flags matching recipes.
- **Lifestyle diet** — Vegetar, Vegansk, Pescetar, Fleksitar, Halal, Kosher.

Persists to localStorage and, for signed-in users, syncs via the existing Supabase
cloud sync (`src/cloud.js`).

### 6. Reference constants

`src/data/labels.js` exports the canonical label sets (Danish + English) for allergens,
lifestyle diets, and cuisines. Imported everywhere labelling appears so it stays
consistent between cards, filters, settings, and the enrichment script.

## Reference — Danish labels

**Allergens (EU-14, DK):** Gluten, Skaldyr, Æg, Fisk, Jordnødder, Soja, Mælk/laktose,
Nødder, Selleri, Sennep, Sesamfrø, Svovldioxid og sulfitter, Lupin, Bløddyr.

**Lifestyle diets:** Vegetar, Vegansk, Pescetar, Fleksitar, Halal, Kosher.

**Cuisine badges (display only):** Dansk/nordisk, Italiensk, Asiatisk, Mellemøstlig,
Mexicansk, Indisk, Amerikansk, Fransk/europæisk.

## Rollout order (dependency-driven)

1. Data enrichment (script + generator prompts) — everything depends on the fields.
2. Reference constants (`labels.js`) + Profile/settings.
3. Results filters (primary/secondary tiers) + recipe card redesign.
4. Onboarding cleanup (remove diet step, migrate value).

## Out of scope

- Per-session re-running funnel (explicitly rejected).
- Meal type as a hard gate.
- Any visual restyle of the existing app chrome.
- Adding non-dinner recipes to the pool (data will fill in via the generator over time).

## Open items for the implementation plan

- Which model the enrichment script uses (cost vs. quality).
- Exact mobile placement of the primary quick-picks vs. the existing "Filtre" collapse.
- Whether allergen dimming also applies inside saved/meal-plan panels.
