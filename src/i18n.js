// Lightweight i18n for Tilbudskokken.
//
// The source keeps its original Danish strings as lookup keys. `EN` maps each
// Danish UI string to English. `t(danish)` returns the English string when the
// current language is "en", otherwise the Danish original.
//
// Language is held in a module-level variable (initialised from localStorage)
// so the many top-level components (RecipeCard, RecipeCounter, StarRating,
// FeedbackResults) can translate without prop-drilling. The <App> owns a React
// state mirror and calls setLangGlobal() so a change re-renders the whole tree.
//
// Recipe content, ingredient/food names, store/chain names and diet *values*
// stay in Danish on purpose — the matching logic depends on those exact strings.
// Only the interface chrome is translated.

let _lang = (() => {
  try { return localStorage.getItem("lang") || "da"; } catch { return "da"; }
})();

export function getLang() { return _lang; }
export function isEn() { return _lang === "en"; }
export function setLangGlobal(l) { _lang = l; }

export const LANGUAGES = [
  { code: "da", label: "Dansk" },
  { code: "en", label: "English" },
];

const EN = {
  // ── Splash / onboarding ──────────────────────────────────────────
  "Bedre tilbud. Bedre mad.": "Better deals. Better food.",
  "Opskrifter bygget præcis på hvad der er på tilbud i dine butikker denne uge.":
    "Recipes built precisely around what's on sale in your stores this week.",
  "Kom i gang →": "Get started →",
  "← Tilbage": "← Back",
  "Vælg dine butikker": "Choose your stores",
  "Vælg de kæder du handler i — vi finder de bedste tilbudsmiddag til dig.":
    "Pick the chains you shop at — we'll find the best deal dinners for you.",
  "Fravælg alle": "Deselect all",
  "Vælg alle": "Select all",
  "Kostpræferencer": "Dietary preferences",
  "Vælg din kostpræference — vi tilpasser opskrifterne.":
    "Choose your dietary preference — we'll adapt the recipes.",
  "Ingen": "None",
  "Hvor mange personer?": "How many people?",
  "Vi tilpasser portionsstørrelserne til dit husstand.":
    "We'll adjust portion sizes to your household.",
  "Gå til opskrifter →": "Go to recipes →",
  "Fortsæt →": "Continue →",
  "Sprog": "Language",

  // ── RecipeCounter ────────────────────────────────────────────────
  "Vælg butikker for at se opskrifter": "Select stores to see recipes",

  // ── Store picker ─────────────────────────────────────────────────
  "Dine butikker": "Your stores",
  "+ Vælg alle": "+ Select all",
  "Ryd": "Clear",
  "Tryk på en kæde for at vælge eller fravælge den.":
    "Tap a chain to select or deselect it.",
  "Ingen butik valgt": "No store selected",
  "Administrer butikker": "Manage stores",
  "Skift": "Change",

  // ── Day picker ───────────────────────────────────────────────────
  "Vælg dag": "Choose day",
  "Ledig": "Free",

  // ── Header / nav ─────────────────────────────────────────────────
  "Opskrifter": "Recipes",
  "Ugen": "Week",
  "Gemte": "Saved",
  "Gemt": "Saved",
  "Kurv": "Cart",
  "Menu": "Menu",
  "Gemte opskrifter": "Saved recipes",
  "Lys tilstand": "Light mode",
  "Mørk tilstand": "Dark mode",
  "Indstillinger": "Settings",

  // ── Guided setup ─────────────────────────────────────────────────
  "Vælg butikker": "Choose stores",
  "Tilpas": "Customize",
  "Find opskrifter": "Find recipes",
  "Hvilke butikker handler du i?": "Which stores do you shop at?",
  "Vælg dine kæder — vi finder de bedste opskrifter baseret på netop dine tilbud denne uge":
    "Pick your chains — we'll find the best recipes based on your deals this week",

  // ── Search ───────────────────────────────────────────────────────
  "Søg opskrifter, ingredienser...": "Search recipes, ingredients...",

  // ── Preferences panel ────────────────────────────────────────────
  "Tilpas dine opskrifter": "Customize your recipes",
  "Tilpas kostpræferencer, tid og budget": "Adjust diet, time and budget",
  "Butikker": "Stores",
  "Kun én butik": "Single store only",
  "Kost": "Diet",
  "Tid": "Time",
  "Køkken": "Cuisine",
  "Pris pr. person": "Price per person",
  "Køleskab": "Fridge",
  "Hvad har du derhjemme?": "What do you have at home?",
  "Tilføj ingredienser — vi rykker opskrifter du kan lave nu øverst":
    "Add ingredients — we'll move recipes you can make now to the top",
  "Hvad har du i køleskabet i dag?": "What's in your fridge today?",
  "Tilføj flere ingredienser...": "Add more ingredients...",
  "Tilføj": "Add",
  "Ingen forslag — tryk Enter for at tilføje alligevel":
    "No suggestions — press Enter to add anyway",
  "Ryd alle": "Clear all",
  "Vis rangering": "Show ranking",

  // ── Detail view ──────────────────────────────────────────────────
  "← Tilbage til opskrifter": "← Back to recipes",
  "Del opskrift": "Share recipe",
  "Gem opskrift": "Save recipe",
  "Gemt": "Saved",
  "Fjern fra gemte": "Remove from saved",
  "Tilføj ingredienser til indkøbsliste": "Add ingredients to shopping list",
  "Tilføjet ✓": "Added ✓",
  "Til indkøb": "To cart",
  "I madplan": "In meal plan",
  "Tilføj til ugen": "Add to the week",
  "Ingredienser": "Ingredients",
  "Købes · klik + for indkøbsliste (butiksmærke = på tilbud)":
    "To buy · click + for shopping list (store badge = on sale)",
  "Basisvare · salt, olie, krydderier m.m. du har hjemme":
    "Basics · salt, oil, spices etc. you have at home",
  "Fremgangsmåde": "Method",
  "Tips": "Tips",

  // ── Cart ─────────────────────────────────────────────────────────
  "✓ Kopieret!": "✓ Copied!",
  "Del / kopiér liste": "Share / copy list",
  "Tøm hele listen?": "Empty the whole list?",
  "Ja, tøm": "Yes, empty",
  "Annuller": "Cancel",
  "Start forfra": "Start over",
  "Fjern hak": "Remove check",
  "Sæt hak": "Add check",
  "Fjern vare": "Remove item",

  // ── Browse / filters ─────────────────────────────────────────────
  "Filtre": "Filters",
  "Sorter": "Sort",
  "Mere": "More",
  "Anbefalet": "Recommended",
  "Billigst": "Cheapest",
  "Hurtigst": "Fastest",
  "Pris": "Price",
  "Tilføj ingrediens du har...": "Add an ingredient you have...",
  "Ryd filtre": "Clear filters",
  "Søgeresultater": "Search results",
  "Ugens opskrifter": "This week's recipes",
  "Ingen opskrifter matcher.": "No recipes match.",
  "Prøv et kortere søgeord eller nulstil filtrene":
    "Try a shorter search term or reset the filters",
  "Dine filtre er for snævre lige nu": "Your filters are too narrow right now",
  "Ingen opskrifter denne uge.": "No recipes this week.",
  "Tilføj en ekstra butik under filtre": "Add another store under filters",
  "Andre butikker": "Other stores",
  "Alle opskrifter er fra dine butikker.": "All recipes are from your stores.",

  // ── Meal plan ────────────────────────────────────────────────────
  "Madplan": "Meal plan",
  "Ingen opskrift planlagt": "No recipe planned",
  "Del madplan": "Share meal plan",
  "Skjul indkøbsliste": "Hide shopping list",
  "Vis indkøbsliste": "Show shopping list",
  "Ryd hele madplanen?": "Clear the whole meal plan?",
  "Ja, ryd": "Yes, clear",
  "Ryd madplan": "Clear meal plan",
  "Ingen tilbudsvarer i madplanen.": "No deal items in the meal plan.",
  "Vis madplan": "Show meal plan",
  "Skjul madplan": "Hide meal plan",
  "Fjern": "Remove",

  // ── Saved panel ──────────────────────────────────────────────────
  "Du har ikke gemt nogen opskrifter endnu — tryk på bogmærke-ikonet på en opskrift for at gemme den":
    "You haven't saved any recipes yet — tap the bookmark icon on a recipe to save it",
  "Tilføj alle til indkøbsliste": "Add all to shopping list",

  // ── Shopping sheet ───────────────────────────────────────────────
  "Indkøbsliste": "Shopping list",
  "Din indkøbsliste er tom endnu — åbn en opskrift og tryk “Til indkøb” for at samle ingredienserne her.":
    "Your shopping list is empty — open a recipe and tap “To cart” to gather the ingredients here.",

  // ── Feedback ─────────────────────────────────────────────────────
  "Giv feedback": "Give feedback",
  "Feedback": "Feedback",
  "Din mening tæller": "Your opinion counts",
  "Luk": "Close",
  "Tak for din feedback!": "Thanks for your feedback!",
  "Hvor let var det at finde en opskrift?": "How easy was it to find a recipe?",
  "Hvordan vil du vurdere det overordnede design?": "How would you rate the overall design?",
  "Hvor sandsynligt er det at du bruger appen til din ugentlige indkøbstur?":
    "How likely are you to use the app for your weekly shopping trip?",
  "Stødte du på fejl eller forvirrende øjeblikke?": "Did you run into bugs or confusing moments?",
  "Ja": "Yes",
  "Nej": "No",
  "Hvornår ville du oftest bruge appen?": "When would you most often use the app?",
  "Inden indkøb": "Before shopping",
  "Ugentlig madplan": "Weekly meal plan",
  "Inspiration": "Inspiration",
  "Andet": "Other",
  "Hvilken butik handler du normalt i?": "Which store do you normally shop at?",
  "En blanding": "A mix",
  "Ville du bruge denne i stedet for — eller sideløbende med — din normale metode?":
    "Would you use this instead of — or alongside — your usual method?",
  "I stedet for": "Instead of",
  "Sideløbende": "Alongside",
  "Ville nok ikke bruge den": "Probably wouldn't use it",
  "Hvor tit tror du, du ville bruge appen?": "How often do you think you'd use the app?",
  "Dagligt": "Daily",
  "Ugentligt": "Weekly",
  "Et par gange om måneden": "A few times a month",
  "Sjældent": "Rarely",
  "Hvilke af disse lagde du mærke til eller brugte?": "Which of these did you notice or use?",
  "(vælg alle der passer)": "(select all that apply)",
  "Butikfiltrering": "Store filtering",
  "Pris per person": "Price per person",
  "Ingen af disse": "None of these",
  "Hvad mangler der for at du ville bruge den regelmæssigt?":
    "What's missing for you to use it regularly?",
  "Fx en funktion, integration, noget der mangler…":
    "E.g. a feature, integration, something missing…",
  "Kommentarer eller fejl du stødte på": "Comments or bugs you ran into",
  "Beskriv hvad der skete og hvornår…": "Describe what happened and when…",
  "Send feedback": "Send feedback",
  "Anonym — ingen persondata gemmes": "Anonymous — no personal data is stored",

  // ── Filter sheet ─────────────────────────────────────────────────
  "Kosttype": "Diet type",
  "Sorter efter": "Sort by",

  // ── Install banner ───────────────────────────────────────────────
  "Tilføj til hjemmeskærm": "Add to home screen",
  "Åbn Tilbudskokken som en app": "Open Tilbudskokken as an app",

  // ── Navigation aria ──────────────────────────────────────────────
  "Hovednavigation": "Main navigation",
  "Navigation": "Navigation",

  // ── Feedback results (admin page) ────────────────────────────────
  "Slet alle svar?": "Delete all responses?",
  "Feedback — Tilbudskokken": "Feedback — Tilbudskokken",
  "Eksporter CSV": "Export CSV",
  "Ingen svar endnu.": "No responses yet.",
  "Tid": "Time",
  "Find opskrift": "Find recipe",
  "Design": "Design",
  "Brug sandsynlighed": "Use likelihood",
  "Fejl?": "Bugs?",
  "Hvornår": "When",
  "Butik": "Store",
  "Erstatter": "Replaces",
  "Hyppighed": "Frequency",
  "Brugte": "Used",
  "Hvad mangler": "What's missing",
  "Kommentarer": "Comments",
};

// Diet filter values → display label. Underlying value stays Danish.
const DIET_EN = {
  "Alle": "All",
  "Vegetar": "Vegetarian",
  "Veganer": "Vegan",
  "Glutenfri": "Gluten-free",
  "Mælkefri": "Dairy-free",
};

// Time filter values → display label.
const TIME_EN = {
  "Alle tider": "All times",
  "Under 20 min": "Under 20 min",
  "Under 45 min": "Under 45 min",
  "Over 45 min": "Over 45 min",
};

// Sort ids → display label.
const SORT_EN = {
  anbefalet: "Recommended",
  "pris-asc": "Cheapest",
  hurtigst: "Fastest",
};

// Cuisine display names (after the flag emoji is stripped).
const CUISINE_EN = {
  "Nordisk": "Nordic",
  "Italiensk": "Italian",
  "Fransk": "French",
  "Asiatisk": "Asian",
  "Indisk": "Indian",
  "Middelhavet": "Mediterranean",
  "Mellemøstlig": "Middle Eastern",
  "Mexicansk": "Mexican",
  "Amerikansk": "American",
  "Alle": "All",
};

export function t(da) {
  return _lang === "en" && EN[da] != null ? EN[da] : da;
}

export function dietLabel(v) {
  return _lang === "en" ? (DIET_EN[v] ?? v) : v;
}

export function timeLabel(v) {
  return _lang === "en" ? (TIME_EN[v] ?? v) : v;
}

export function sortLabel(id, fallback) {
  if (_lang === "en") return SORT_EN[id] ?? fallback ?? id;
  return fallback ?? id;
}

// Strip the leading flag/globe emoji, then translate the plain cuisine name.
export function cuisineText(c) {
  const stripped = String(c || "").replace(/^[^\p{L}]+/u, "");
  return _lang === "en" ? (CUISINE_EN[stripped] ?? stripped) : stripped;
}
