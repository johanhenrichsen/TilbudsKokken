// Lightweight i18n for TilbudsKokken.
//
// Strategy: the source code keeps its original Danish strings as the lookup
// keys. `EN_STRINGS` maps each Danish UI string to its English equivalent.
// `makeT(lang)` returns a `t(danish)` helper that returns the English string
// when the language is "en", and otherwise falls back to the Danish original.
//
// Recipe content, ingredient/food names, store names and diet *values* stay in
// Danish on purpose — they are data that the matching logic depends on. Only
// the user-facing interface chrome is translated.

export const LANGUAGES = [
  { code: "da", label: "Dansk", short: "DA" },
  { code: "en", label: "English", short: "EN" },
];

export const EN_STRINGS = {
  // Splash
  "BEDRE TILBUD. BEDRE MAD.": "BETTER DEALS. BETTER FOOD.",

  // Onboarding / settings modal
  "Få opskrifter der er bygget præcis på hvad der er på tilbud i dine butikker denne uge. Spar penge og spis godt.":
    "Get recipes built precisely around what's on sale in your stores this week. Save money and eat well.",
  "Kom i gang →": "Get started →",
  "← Tilbage": "← Back",
  "Vælg dine butikker": "Choose your stores",
  "Vælg de kæder du handler i — vi finder de bedste tilbudsmiddag til dig.":
    "Pick the chains you shop at — we'll find the best deal dinners for you.",
  "Kostpræferencer": "Dietary preferences",
  "Vælg din kostpræference — vi tilpasser opskrifterne.":
    "Choose your dietary preference — we'll adapt the recipes.",
  "Hvor mange personer?": "How many people?",
  "Vi tilpasser portionsstørrelserne til dit husstand.":
    "We'll adjust portion sizes to your household.",
  "Gå til opskrifter →": "Go to recipes →",
  "Fortsæt →": "Continue →",
  "Sprog": "Language",

  // Diet labels (onboarding step 2 — display only)
  "Ingen": "None",

  // Store picker
  "Søg by eller postnummer...": "Search city or postal code...",
  "Ingen butikker fundet": "No stores found",
  "Dine butikker": "Your stores",
  "Klik for at tilføje eller fjerne butikker.": "Click to add or remove stores.",
  "Ingen butik valgt": "No store selected",
  "skift": "change",

  // Day picker
  "Vælg dag": "Choose day",
  "Ledig": "Free",

  // Pantry
  "🧺 Hvad har jeg derhjemme?": "🧺 What do I have at home?",
  "Vis kun opskrifter jeg kan lave nu": "Show only recipes I can make now",
  "Tilpas opskrifter til dit køleskab": "Match recipes to your fridge",

  // Search
  "Søg opskrifter, ingredienser...": "Search recipes, ingredients...",

  // Recipe detail
  "← Tilbage til opskrifter": "← Back to recipes",
  "Del opskrift": "Share recipe",
  "Del": "Share",
  "Kopieret!": "Copied!",
  "Gem opskrift": "Save recipe",
  "Gemt": "Saved",
  "Gem": "Save",
  "I madplan": "In meal plan",
  "Madplan": "Meal plan",
  "🌱 Madspild — aktuelle priser": "🌱 Food waste — current prices",
  "⚠ Udløber snart": "⚠ Expires soon",
  "Ingredienser": "Ingredients",
  "Tilbudsvare · klik + for indkøbsliste": "Deal item · click + for shopping list",
  "Pantry-vare · du har det hjemme": "Pantry item · you have it at home",
  "Fremgangsmåde": "Method",
  "💡 Tips": "💡 Tips",
  "Ryd liste": "Clear list",

  // Madspild section
  "Madspild": "Food waste",
  "Spar op til 50%": "Save up to 50%",
  "Henter aktuelle madspildstilbud…": "Loading current food-waste deals…",
  "Ingen madspildstilbud fundet i dine butikker lige nu — tjek igen senere.":
    "No food-waste deals found in your stores right now — check back later.",
  "Tilføj Netto eller Føtex for at se madspildstilbud":
    "Add Netto or Føtex to see food-waste deals",
  "Tilføj butik": "Add store",

  // Browse sections
  "⭐ Denne uges anbefalinger": "⭐ This week's recommendations",
  "Kræver andre butikker": "Requires other stores",
  "Ingen opskrifter fundet": "No recipes found",
  "Ingen opskrifter matcher det valgte filter": "No recipes match the selected filter",

  // Meal plan
  "Del madplan": "Share meal plan",
  "✓ Kopieret!": "✓ Copied!",
  "Skjul": "Hide",
  "Indkøbsliste": "Shopping list",
  "Ingen tilbudsvarer i madplanen.": "No deal items in the meal plan.",
  "Fjern": "Remove",

  // Cards
  "🌱 Madspild": "🌱 Food waste",
  "🔥 Populær": "🔥 Popular",
  "✓ Kan laves nu": "✓ Can make now",
  "📅 I madplan": "📅 In meal plan",
  "📅 Tilføj til madplan": "📅 Add to meal plan",
  "⚠ Snart": "⚠ Soon",
  "Allerede i madplan": "Already in meal plan",
  "Tilføj til madplan": "Add to meal plan",

  // Misc
  "Indstillinger": "Settings",
  "Tips:": "Tips:",
};

// Diet filter buttons — display label per language, underlying value stays Danish.
export const DIET_LABELS_EN = {
  "Alle": "All",
  "Vegetar": "Vegetarian",
  "Veganer": "Vegan",
  "Glutenfri": "Gluten-free",
  "Mælkefri": "Dairy-free",
};

// Time filter buttons — display label per language, underlying value stays Danish.
export const TIME_LABELS_EN = {
  "Alle tider": "All times",
  "Under 20 min": "Under 20 min",
  "Under 45 min": "Under 45 min",
  "Over 45 min": "Over 45 min",
};

export function makeT(lang) {
  const en = lang === "en";
  return (da) => (en && EN_STRINGS[da] != null ? EN_STRINGS[da] : da);
}
