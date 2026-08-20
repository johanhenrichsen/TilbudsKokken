// Pure, testable metadata derived from a recipe object. No React, no DOM.
import { CUISINES } from "./data/labels.js";

// "25 minutter" | "1 time 15 minutter" | "2 timer 30 minutter" -> total minutes.
export function parseMinutes(timeStr) {
  const s = String(timeStr || "").toLowerCase();
  let mins = 0;
  const h = s.match(/(\d+)\s*time/);            // "time" / "timer"
  if (h) mins += parseInt(h[1], 10) * 60;
  const m = s.match(/(\d+)\s*min/);             // "minut" / "minutter"
  if (m) mins += parseInt(m[1], 10);
  if (!h && !m) { const n = s.match(/(\d+)/); if (n) mins = parseInt(n[1], 10); }
  return mins;
}

// Guide buckets: Under 15 / 15–30 / 30–60 / 60+.
export function prepBucket(timeStr) {
  const m = parseMinutes(timeStr);
  if (m < 15) return "under15";
  if (m <= 30) return "15-30";
  if (m <= 60) return "30-60";
  return "60plus";
}

export const PREP_BUCKETS = [
  { key: "under15", da: "Under 15 min", en: "Under 15 min" },
  { key: "15-30",   da: "15–30 min",    en: "15–30 min" },
  { key: "30-60",   da: "30–60 min",    en: "30–60 min" },
  { key: "60plus",  da: "60+ min",      en: "60+ min" },
];

// Sum every ingredient you actually buy (deal items + non-deal basics); pantry excluded.
export function pricePerMeal(recipe) {
  let total = 0, has = false;
  for (const ing of (recipe.ingredients || [])) {
    if (ing.isPantry) continue;
    const m = String(ing.price || "").match(/(\d+(?:[.,]\d+)?)/);
    if (m) { const v = parseFloat(m[1].replace(",", ".")); if (v > 0) { total += v; has = true; } }
  }
  return has ? Math.round(total) : null;
}

export function pricePerPerson(recipe) {
  const total = pricePerMeal(recipe);
  const servings = recipe.servings_count || 4;
  if (total == null || servings <= 0) return null;
  const pp = Math.round(total / servings);
  return (pp < 1 || pp > 500 || !isFinite(pp)) ? null : pp;
}

export function normalizeDifficulty(d) {
  if (!d) return null;
  const s = String(d).toLowerCase();
  if (/svær|svaer|hard|advanced/.test(s)) return "Svær";
  if (/mellem|middel|medium/.test(s)) return "Middel";
  if (/nem|let|easy/.test(s)) return "Nem";
  return null;
}

export function normalizeCuisineKey(cuisine) {
  const raw = String(cuisine || "").replace(/[^\p{L}\s/]/gu, "").trim().toLowerCase();
  const hit = CUISINES.find(c => raw.includes(c.key) || c.da.toLowerCase().includes(raw) || raw.includes(c.da.toLowerCase().split(" ")[0]));
  if (hit) return hit.key;
  if (/nordisk|dansk/.test(raw)) return "nordisk";
  if (/middelhav|græsk|graesk/.test(raw)) return "europaeisk";
  return raw || null;
}

export function recipeAllergens(recipe) {
  return Array.isArray(recipe.allergens) ? recipe.allergens : [];
}

// Diet match against the recipe's tags. The enrichment step populates `dietTags`
// (which of the 6 lifestyle diets a recipe satisfies); older recipes may only have
// `dietaryFilters`. Combine both. Returns true when the recipe satisfies the diet key.
export function matchesLifestyleDiet(recipe, dietKey) {
  if (!dietKey || dietKey === "alle") return true;
  const tags = [...(recipe.dietTags || []), ...(recipe.dietaryFilters || [])]
    .map(x => String(x).toLowerCase());
  return tags.some(t => t.includes(dietKey));
}
