// Canonical labelling vocabulary, imported everywhere labels appear (cards,
// filters, settings, enrichment) so the wording stays identical across the app.
// Each entry carries Danish (da, the primary market) + English (en).

export const ALLERGENS = [
  { key: "gluten",    da: "Gluten",                    en: "Gluten" },
  { key: "skaldyr",   da: "Skaldyr",                   en: "Crustaceans" },
  { key: "aeg",       da: "Æg",                        en: "Eggs" },
  { key: "fisk",      da: "Fisk",                      en: "Fish" },
  { key: "jordnodder",da: "Jordnødder",                en: "Peanuts" },
  { key: "soja",      da: "Soja",                      en: "Soybeans" },
  { key: "maelk",     da: "Mælk / laktose",            en: "Milk / lactose" },
  { key: "nodder",    da: "Nødder",                    en: "Tree nuts" },
  { key: "selleri",   da: "Selleri",                   en: "Celery" },
  { key: "sennep",    da: "Sennep",                    en: "Mustard" },
  { key: "sesam",     da: "Sesamfrø",                  en: "Sesame" },
  { key: "sulfitter", da: "Svovldioxid og sulfitter",  en: "Sulphur dioxide / sulphites" },
  { key: "lupin",     da: "Lupin",                     en: "Lupin" },
  { key: "bloddyr",   da: "Bløddyr",                   en: "Molluscs" },
];

export const LIFESTYLE_DIETS = [
  { key: "vegetar",  da: "Vegetar",   en: "Vegetarian" },
  { key: "vegansk",  da: "Vegansk",   en: "Vegan" },
  { key: "pescetar", da: "Pescetar",  en: "Pescetarian" },
  { key: "fleksitar",da: "Fleksitar", en: "Flexitarian" },
  { key: "halal",    da: "Halal",     en: "Halal" },
  { key: "kosher",   da: "Kosher",    en: "Kosher" },
];

export const CUISINES = [
  { key: "nordisk",     da: "Dansk / nordisk",  en: "Danish / Nordic", emoji: "🇩🇰" },
  { key: "italiensk",   da: "Italiensk",        en: "Italian",         emoji: "🇮🇹" },
  { key: "asiatisk",    da: "Asiatisk",         en: "Asian",           emoji: "🥢" },
  { key: "mellemostlig",da: "Mellemøstlig",     en: "Middle Eastern",  emoji: "🧆" },
  { key: "mexicansk",   da: "Mexicansk",        en: "Mexican",         emoji: "🌮" },
  { key: "indisk",      da: "Indisk",           en: "Indian",          emoji: "🍛" },
  { key: "amerikansk",  da: "Amerikansk",       en: "American",        emoji: "🇺🇸" },
  { key: "europaeisk",  da: "Fransk / europæisk",en: "French / European",emoji: "🇫🇷" },
];

function lookup(list, value, lang) {
  if (!value) return "";
  const v = String(value).toLowerCase();
  const hit = list.find(x => x.key === v || x.da.toLowerCase() === v || x.en.toLowerCase() === v);
  return hit ? (lang === "en" ? hit.en : hit.da) : value;
}

export const allergenLabel = (v, lang = "da") => lookup(ALLERGENS, v, lang);
export const dietLabelFull  = (v, lang = "da") => lookup(LIFESTYLE_DIETS, v, lang);
export const cuisineLabel   = (v, lang = "da") => lookup(CUISINES, v, lang);
