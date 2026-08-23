# Filter & Onboarding Flow rework — design

Date: 2026-08-23
Source spec: `deal-recipe-app-flow_2 (1).html` (working spec, discussed & approved)
Live app: `C:\Users\Johan\tilbudsapp` (`src/App.jsx`)

## Goal

Reshape the browse flow so it matches the working spec:

- A **primary funnel** of three picks — Supermarket → Meal type → Prep time — is the path
  to results.
- **Secondary filters** (Price, Persons served, Cooking method, Difficulty) refine results
  afterward, never gate upfront.
- **Cuisine** is a card badge, not a filter.
- **Lifestyle diet** and **Allergies** are persistent, optional profile settings applied as
  soft personal filters — not onboarding gates.

## Decisions (approved)

1. **Onboarding = one-time, reordered** (not a per-session wizard). First visit only:
   Store → Meal type → Prep time. Return visits go straight to results with last picks
   pre-filled.
2. **Servings = secondary filter only.** Removed from onboarding; becomes a results-screen
   "persons served" control that scales price displays, default 4 when unset.
3. **Diet folded into Lifestyle-diet profile.** The simple diet step/strip is removed; the
   persistent Lifestyle diet + Allergies profile settings act as optional soft filters.

## Changes

### 1. Onboarding (first visit only) — `src/App.jsx` onboarding overlay
- Step 1: Supermarket — unchanged (hard gate).
- Step 2: Meal type — new, replaces diet step. Uses `MEAL_TYPES`. Stages `pendingMealType`.
- Step 3: Prep time — new, replaces servings step. Uses `PREP_BUCKETS`. Stages `pendingPrep`.
- On finish: persist meal-type + prep-time picks; set `onboardingDone`.
- Remove `pendingDiet` and `pendingServings` onboarding usage.

### 2. Primary picks persist across sessions
- `mealTypeFilter` & `prepFilter` initialize from localStorage and save on change
  (keys e.g. `lastMealType`, `lastPrep`), so returning users see last answers.

### 3. Results screen — primary picks first
- Reorder quick-strips: Meal type + Prep time render as the top/primary row, above the
  secondary filters.

### 4. Secondary filters
- Keep Cooking method, Difficulty (already secondary), Price.
- **Persons served**: move the servings stepper into the results toolbar; default 4; scales
  price-per-person / total displays. Remove servings from onboarding.

### 5. Remove Cuisine as a filter
- Delete the "Køkken" quick-strip; drop `cuisineFilter` from `matchRecipe`,
  `activeFilterCount`, and `noResults`. Cuisine stays as a card + detail badge only.

### 6. Fold diet into Lifestyle-diet profile
- Remove the onboarding diet step (via #1) and the "Kost" results quick-strip.
- Neutralize the old `diet` gate: pass `"Alle"` to `getScoredRecipes` so the scoring engine
  stays intact but no diet gating.
- Wire persistent `lifestyleDiet` (via `matchesLifestyleDiet`) and `allergies` as optional
  **soft** filters: dim/flag matching recipes rather than hard-remove.
- Covers vegetar/vegan via lifestyle; glutenfri/mælkefri via allergens.

### 7. Recipe card — `RecipeCard`
- Add **cuisine badge** (`r.cuisine` via `cuisineLabel`) and **allergy/intolerance tags**
  (`r.allergens`).
- Surface **difficulty + method** on the card.

## Judgment calls
- *Persons served* is a portion/price scaler (default 4), not a hard "serves exactly N" filter.
- *Allergy filter* is a soft dim/flag (self-screening convenience), not hard removal.

## Risk
- #6 touches the central `getScoredRecipes(diet)` path. Keep the engine intact; layer the new
  optional filters on top rather than removing the scoring system.

## Out of scope
- Realtime sync, Google sign-in, and other deferred account features.
- Any change to the deal-matching / recipe-scoring algorithm itself.
