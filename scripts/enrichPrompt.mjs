import { ALLERGENS } from "../src/data/labels.js";

export const MEAL_TYPES = ["aftensmad", "frokost", "morgenmad", "snack"];
export const COOKING_METHODS = ["Én pande", "Ovn", "Gryde", "Wok", "Grill", "Bagning", "Ingen tilberedning"];
export const DIET_KEYS = ["vegetar", "vegansk", "pescetar", "fleksitar", "halal", "kosher"];
export const TARGET_FIELDS = ["mealType", "cookingMethod", "allergens", "difficulty", "cuisine", "dietTags"];

export function needsEnrichment(r) {
  return TARGET_FIELDS.some(f =>
    r[f] == null || ((f === "allergens" || f === "dietTags") && !Array.isArray(r[f])));
}

export function buildPrompt(r) {
  const ingredients = (r.ingredients || []).map(i => i.text).filter(Boolean).join(", ");
  const allergenList = ALLERGENS.map(a => a.da).join(", ");
  return `Du klassificerer en dansk madopskrift. Svar KUN med JSON.

Opskrift: "${r.title}"
Ingredienser: ${ingredients}
Beskrivelse: ${r.description || ""}

Returnér et JSON-objekt med præcis disse felter:
- "mealType": én af [${MEAL_TYPES.join(", ")}]
- "cookingMethod": én af [${COOKING_METHODS.join(", ")}]
- "allergens": array (kan være tomt) med kun værdier fra denne liste: [${allergenList}]
- "dietTags": array (kan være tomt) med de livsstilskostformer retten OPFYLDER, kun værdier fra: [${DIET_KEYS.join(", ")}]
- "difficulty": én af ["Nem", "Middel", "Svær"]
- "cuisine": én af ["nordisk","italiensk","asiatisk","mellemostlig","mexicansk","indisk","amerikansk","europaeisk"]

Kun JSON, ingen forklaring.`;
}

// Fill only target fields, and only with allowed values; never touch core recipe data.
export function mergeEnrichment(recipe, ai) {
  const out = { ...recipe };
  if (MEAL_TYPES.includes(ai.mealType)) out.mealType = ai.mealType;
  if (COOKING_METHODS.includes(ai.cookingMethod)) out.cookingMethod = ai.cookingMethod;
  if (Array.isArray(ai.allergens)) {
    const allowed = new Set(ALLERGENS.map(a => a.da));
    out.allergens = ai.allergens.filter(a => allowed.has(a));
  }
  if (Array.isArray(ai.dietTags)) {
    out.dietTags = ai.dietTags.filter(d => DIET_KEYS.includes(d));
  }
  if (["Nem", "Middel", "Svær"].includes(ai.difficulty)) out.difficulty = ai.difficulty;
  if (typeof ai.cuisine === "string" && ai.cuisine) out.cuisine = ai.cuisine;
  return out;
}
