import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import "./App.css";
import { recipeBank as staticRecipes } from "./recipes";
import weeklyRecipesJson from "./data/weeklyRecipes.json";
const recipeBank = weeklyRecipesJson.length > 0 ? weeklyRecipesJson : staticRecipes;
const recipeIndexMap = new Map(recipeBank.map((r, i) => [r.id, i]));
import LogoIcon from "./LogoIcon";
import { allShoppablesInList, removeCheckedEntries, savedServingsFor } from "./shoppingLogic";
import { t, dietLabel, timeLabel, difficultyLabel, timeText, sortLabel, cuisineText, LANGUAGES, getLang, setLangGlobal, isEn } from "./i18n";

// Muted warm-earth palette — one accent per chain.
// Applied as a CSS custom property (--chain-color) on each badge so the
// same token drives every surface: badge left-border, filter dot, recipe tag.
const CHAIN_COLORS = {
  "Netto":                      "#C8922A",  // warm amber/ochre
  "Føtex":                      "#B85A3C",  // dusty terracotta
  "Bilka":                      "#C07038",  // burnt copper
  "Rema 1000":                  "#A83030",  // clay red
  "Coop 365":                   "#5A9A8A",  // dusty teal
  "Coop 365discount":           "#5A9A8A",
  "SuperBrugsen / Kvickly":     "#7A8E54",  // warm olive
  "SuperBrugsen":               "#7A8E54",
  "Kvickly":                    "#7A8E54",
  "Dagli'Brugsen / Brugsen":    "#5A7888",  // dusty slate
  "Dagli'Brugsen":              "#5A7888",
  "Brugsen":                    "#5A7888",
  "Meny":                       "#9C8040",  // warm brass
  "Spar":                       "#6A8B5A",  // muted forest
  "Lidl":                       "#5A6888",  // dusty slate-blue
};
const _CHAIN_COLORS_NORM = new Map(
  Object.entries(CHAIN_COLORS).map(([k, v]) => [k.toLowerCase().trim(), v])
);
function getChainColor(store) {
  if (!store) return undefined;
  return _CHAIN_COLORS_NORM.get(store.toLowerCase().trim());
}

// Stable, collision-free ids for cart line items so React keys, checked-state and
// removal never rely on the (possibly duplicated) item text. See cart rebuild.
let _cartSeq = 0;
function cartUid() { return `c${Date.now().toString(36)}_${(_cartSeq++).toString(36)}`; }
const CART_STORE_FALLBACK = "Øvrige varer";

// Normalise an item text for dedup: strip a leading quantity + unit so
// "500 g hakket oksekød" and "hakket oksekød" collapse to one entry.
function normCartText(text) {
  return (text || "")
    .toLowerCase()
    .replace(/^\s*\d+[\d.,]*\s*(?:g|kg|l|dl|cl|ml|stk\.?|pk\.?|pose|karton|dåse|potte|bakke)?\.?\s*/i, "")
    .trim();
}

// Short monograms for compact chain badges
const CHAIN_ABBR = {
  "Netto": "N",
  "Føtex": "F",
  "Bilka": "B",
  "Rema 1000": "R1",
  "Coop 365": "C365",
  "Coop 365discount": "C365",
  "SuperBrugsen / Kvickly": "SB",
  "SuperBrugsen": "SB",
  "Kvickly": "KV",
  "Dagli'Brugsen / Brugsen": "DB",
  "Dagli'Brugsen": "DB",
  "Brugsen": "DB",
  "Meny": "MENY",
  "Spar": "SPAR",
  "Lidl": "LIDL",
};
const _CHAIN_ABBR_NORM = new Map(
  Object.entries(CHAIN_ABBR).map(([k, v]) => [k.toLowerCase().trim(), v])
);
function getChainAbbr(store) {
  if (!store) return "?";
  const hit = _CHAIN_ABBR_NORM.get(store.toLowerCase().trim());
  if (hit) return hit;
  const cleaned = store.replace(/[^0-9A-Za-zÆØÅæøå]/g, "");
  return (cleaned.slice(0, 3) || "?").toUpperCase();
}

const CHAIN_ORDER = [
  // Salling Group
  "Netto", "Føtex", "Bilka",
  // Rema
  "Rema 1000",
  // Coop
  "Coop 365", "SuperBrugsen", "Dagli'Brugsen / Brugsen",
  // Independent
  "Meny", "Spar",
  // International discounters
  "Lidl",
];

// Maps legacy / variant store names → canonical CHAIN_ORDER key.
// Handles old localStorage entries and recipe data that still uses "/ Kvickly".
const CHAIN_CANONICAL = {
  "SuperBrugsen / Kvickly": "SuperBrugsen",
  "Kvickly":                "SuperBrugsen",
};
function canonicalChain(name) { return CHAIN_CANONICAL[name] || name; }

// Group cart entries by store for the aisle-by-aisle shopping view. Groups follow
// CHAIN_ORDER; items without a store fall into a trailing "Øvrige varer" group.
function groupCartByStore(cart) {
  const byStore = new Map();
  for (const it of cart || []) {
    const key = it.store ? canonicalChain(it.store) : CART_STORE_FALLBACK;
    if (!byStore.has(key)) byStore.set(key, []);
    byStore.get(key).push(it);
  }
  const rank = s => {
    if (s === CART_STORE_FALLBACK) return CHAIN_ORDER.length + 1;
    const i = CHAIN_ORDER.indexOf(s);
    return i < 0 ? CHAIN_ORDER.length : i;
  };
  return [...byStore.entries()]
    .sort((a, b) => rank(a[0]) - rank(b[0]))
    .map(([store, items]) => ({ store, items }));
}

const ALL_CUISINES_ORDERED = ["🇩🇰 Nordisk", "🇮🇹 Italiensk", "🇫🇷 Fransk", "🇯🇵 Asiatisk", "🇮🇳 Indisk", "🇬🇷 Middelhavet", "🇲🇦 Mellemøstlig", "🇲🇽 Mexicansk", "🇺🇸 Amerikansk"];
const CUISINE_SEARCH_MAP = {
  "japan": "🇯🇵 Asiatisk", "japansk": "🇯🇵 Asiatisk", "sushi": "🇯🇵 Asiatisk",
  "asiatisk": "🇯🇵 Asiatisk", "wok": "🇯🇵 Asiatisk", "soja": "🇯🇵 Asiatisk",
  "italia": "🇮🇹 Italiensk", "italiensk": "🇮🇹 Italiensk", "pasta": "🇮🇹 Italiensk",
  "carbonara": "🇮🇹 Italiensk", "bolognese": "🇮🇹 Italiensk", "lasagne": "🇮🇹 Italiensk",
  "risotto": "🇮🇹 Italiensk", "parmesan": "🇮🇹 Italiensk", "mozzarella": "🇮🇹 Italiensk",
  "curry": "🇮🇳 Indisk", "tikka": "🇮🇳 Indisk", "masala": "🇮🇳 Indisk", "karry": "🇮🇳 Indisk",
  "nordisk": "🇩🇰 Nordisk", "dansk": "🇩🇰 Nordisk", "hygge": "🇩🇰 Nordisk",
  "frikadeller": "🇩🇰 Nordisk", "kartofler": "🇩🇰 Nordisk",
  "fransk": "🇫🇷 Fransk", "gratin": "🇫🇷 Fransk", "bechamel": "🇫🇷 Fransk",
  "tacos": "🇲🇽 Mexicansk", "burrito": "🇲🇽 Mexicansk", "mexicansk": "🇲🇽 Mexicansk",
  "caprese": "🇬🇷 Middelhavet", "middelhavet": "🇬🇷 Middelhavet", "hummus": "🇬🇷 Middelhavet",
};
const _availCuisines = new Set(recipeBank.map(r => r.cuisine).filter(Boolean));
const CUISINE_ORDER = ["Alle", ...ALL_CUISINES_ORDERED.filter(c => _availCuisines.has(c))];

// Display-only: strip the leading flag/globe emoji so "🇩🇰 Nordisk" renders as
// "Nordisk". The emoji-prefixed string stays the canonical key everywhere else
// (recipe data, search map, color map, filter matching), so nothing migrates.
function cuisineLabel(c) {
  return String(c || "").replace(/^[^\p{L}]+/u, "");
}

// Cuisine-keyed accent + monogram — a designed stand-in for emoji iconography
// in compact list rows (meal plan, saved recipes). Uses the warm-earth palette.
const CUISINE_COLORS = {
  "🇩🇰 Nordisk":      "#7C8F5A",
  "🇮🇹 Italiensk":    "#B83A24",
  "🇫🇷 Fransk":       "#5A7888",
  "🇯🇵 Asiatisk":     "#A83030",
  "🇮🇳 Indisk":       "#CE9F3E",
  "🇬🇷 Middelhavet":  "#5A9A8A",
  "🇲🇦 Mellemøstlig": "#9C8040",
  "🇲🇽 Mexicansk":    "#C07038",
  "🇺🇸 Amerikansk":   "#6A8B5A",
};
function recipeAccent(r) {
  return (r && CUISINE_COLORS[r.cuisine]) || "#CE9F3E";
}
function recipeMonogram(r) {
  const src = (r && (r.category || r.title)) || "";
  const ch = src.replace(/[^A-Za-zÆØÅæøå]/g, "").charAt(0);
  return (ch || "•").toUpperCase();
}
function RecipeMonogram({ recipe, className }) {
  return (
    <span
      className={className}
      style={{ "--mono-accent": recipeAccent(recipe) }}
      aria-hidden="true"
    >
      {recipeMonogram(recipe)}
    </span>
  );
}

// Cap how many recipe cards render at once. Each card mounts an <img> and
// fires a Pexels fetch, so rendering the full list (100+) at once can crash
// the tab on low-memory phones. Render in batches with a "show more" button.
const PAGE_SIZE = 24;

const PANTRY_CATEGORIES = [
  {
    id: "koed", label: "Kød & fisk",
    items: ["Hakket oksekød", "Kyllingefilet", "Kylling", "Laks", "Rejer", "Tun", "Æg", "Bacon"],
  },
  {
    id: "groent", label: "Grøntsager",
    items: ["Løg", "Hvidløg", "Gulerødder", "Kartofler", "Tomater", "Peberfrugt", "Spinat", "Broccoli", "Squash", "Champignon", "Selleri", "Porrer"],
  },
  {
    id: "mejeri", label: "Mejeri",
    items: ["Smør", "Mælk", "Fløde", "Ost", "Mozzarella", "Yoghurt", "Creme fraiche", "Parmesan"],
  },
  {
    id: "toervarer", label: "Tørvarer",
    items: ["Pasta", "Ris", "Mel", "Dåsetomater", "Bouillon", "Olivenolie", "Sojasauce", "Kokosmælk", "Brødkrummer", "Linser"],
  },
  {
    id: "krydderier", label: "Krydderier",
    items: ["Paprika", "Spidskommen", "Karry", "Oregano", "Timian", "Rosmarin", "Basilikum", "Chili", "Ingefær", "Kanel", "Sennep"],
  },
];
const ALWAYS_AVAILABLE = new Set(["salt", "peber", "sort peber", "olie", "vand", "sukker"]);

const PANTRY_SUGGESTIONS = ["Æg", "Pasta", "Ris", "Løg", "Kartofler", "Smør", "Hvidløg", "Tomat", "Ost", "Kylling"];

// Deduplicated ingredient name list built from the actual recipe bank.
// Used for autocomplete — every entry is guaranteed to match ≥1 recipe.
const INGREDIENT_AUTOCOMPLETE = (() => {
  const seen = new Set();
  const out = [];
  const add = name => {
    const key = name.toLowerCase().trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(name.trim());
  };
  // Strip leading quantity from shoppable ingredient text for autocomplete
  for (const r of recipeBank) {
    for (const ing of (r.ingredients || [])) {
      if (!ing.isPantry) {
        const clean = (ing.text || "").replace(/^\s*\d+[\d.,]*\s*(?:g|kg|l|dl|cl|ml|stk\.?|pk\.?|pose|karton|dåse|potte|bakke)?\.?\s*/i, "").trim();
        add(clean);
      }
    }
  }
  // Pantry category items (already clean, covers pantry staples)
  for (const cat of PANTRY_CATEGORIES) for (const item of cat.items) add(item);
  return out.sort((a, b) => a.localeCompare(b, "da"));
})();

// Splits `text` into before/match/after parts for rendering the amber highlight.
function highlightSuggestion(text, query) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return [text, "", ""];
  return [text.slice(0, idx), text.slice(idx, idx + query.length), text.slice(idx + query.length)];
}

// Synonym expansions for terms where contains-check alone fails.
// Keyed by lowercase search term → array of extra strings to check in ingredient text.
const INGREDIENT_SYNONYMS = {
  "pasta":        ["spaghetti", "penne", "fettuccine", "tagliatelle", "rigatoni", "linguine", "lasagne", "nudler"],
  "nudler":       ["spaghetti", "penne", "pasta", "tagliatelle"],
  "fisk":         ["laks", "torsk", "kuller", "tun", "sild", "makrel", "tilapia", "rødspætte", "hellefisk"],
  "skaldyr":      ["rejer", "muslinger", "krabber", "kammuslinger", "østers"],
  "ost":          ["mozzarella", "parmesan", "cheddar", "gouda", "feta", "ricotta", "brie", "gruyère", "emmental"],
  "svinekød":     ["flæsk", "kotelet", "nakkefilet", "bacon", "skinke", "ribbensteg", "svinefilet"],
  "svine":        ["svinekød", "flæsk", "kotelet", "nakkefilet", "bacon", "skinke"],
  "flæsk":        ["bacon", "svinekød", "kotelet"],
  "lam":          ["lammekød", "lammekølle", "lammesteg", "lammeribs"],
  "fløde":        ["piskefløde", "madlavningsfløde", "creme fraiche", "cremefraiche"],
  "urter":        ["timian", "rosmarin", "basilikum", "oregano", "persille", "koriander", "dild", "estragon", "salvie"],
  "krydderurter": ["timian", "rosmarin", "basilikum", "oregano", "persille", "koriander", "dild"],
  "kød":          ["kylling", "laks", "rejer", "hakket", "bøf", "kotelet"],
};

// Normalise a chain name for fuzzy comparison: lowercase, strip ' and /,
// collapse whitespace. Handles mismatches between CHAIN_ORDER labels and
// xlsx sheet names, e.g. "SuperBrugsen / Kvickly" ↔ "SuperBrugsen  Kvickly",
// "Dagli'Brugsen / Brugsen" ↔ "Dagli'Brugsen", "Coop 365" ↔ "Coop 365discount".
function normalizeChain(s) {
  return (s || '').toLowerCase().replace(/['/]/g, '').replace(/\s+/g, ' ').trim();
}
function chainNamesMatch(a, b) {
  const na = normalizeChain(a);
  const nb = normalizeChain(b);
  return na === nb || na.startsWith(nb) || nb.startsWith(na);
}

function pantryMatchIngredient(ingText, searchTerm) {
  const ing = ingText.toLowerCase();
  const term = searchTerm.toLowerCase().trim();
  if (term.length < 2) return true; // too short — don't filter
  if (ing.includes(term)) return true;
  const extras = INGREDIENT_SYNONYMS[term];
  return extras ? extras.some(s => ing.includes(s)) : false;
}

// Returns which of the added pantry ingredients a recipe actually uses.
// Drives the relevance sort and the "X/Y ingredienser" card indicator — never filters.
function getPantryMatches(r, pantrySet) {
  if (pantrySet.size === 0) return [];
  const ings = r.ingredients || [];
  const matched = [];
  for (const p of pantrySet) {
    if (ings.some(ing => pantryMatchIngredient(ing.text || ing, p))) matched.push(p);
  }
  return matched;
}

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return { week: Math.ceil(((d - yearStart) / 86400000 + 1) / 7), year: d.getUTCFullYear() };
}


const stores = [
  {
    name: "Rema 1000", color: "#CC0000",
    items: [
      { name: "Hakket oksekød 500g", price: 24.95, unit: "pr. pk." },
      { name: "Gulerødder 1kg", price: 7.95, unit: "pr. pose" },
      { name: "Æg 10 stk.", price: 18.50, unit: "pr. bakke" },
      { name: "Spaghetti 500g", price: 8.95, unit: "pr. pk." },
    ],
  },
  {
    name: "Netto", color: "#e6a800",
    items: [
      { name: "Kyllingefilet 600g", price: 29.95, unit: "pr. pk." },
      { name: "Ris 1kg", price: 11.95, unit: "pr. pose" },
      { name: "Dåsetomater 400g", price: 5.95, unit: "pr. dåse" },
      { name: "Mozzarella 125g", price: 14.95, unit: "pr. pk." },
      { name: "Basilikum", price: 8.95, unit: "pr. potte" },
    ],
  },
  {
    name: "Coop 365", color: "#0066cc",
    items: [
      { name: "Kartofler 2kg", price: 12.95, unit: "pr. pose" },
      { name: "Laks filet 400g", price: 39.95, unit: "pr. pk." },
      { name: "Fløde 38% 0.5L", price: 17.95, unit: "pr. karton" },
      { name: "Pasta penne 500g", price: 7.95, unit: "pr. pk." },
      { name: "Spinat frisk 200g", price: 12.95, unit: "pr. pose" },
      { name: "Parmesan revet 80g", price: 21.95, unit: "pr. pk." },
    ],
  },
];

const storeColorMap = Object.fromEntries(stores.map(s => [s.name, s.color]));

const itemPriceMap = Object.fromEntries(
  stores.flatMap(s => s.items.map(it => [it.name, it.price]))
);

function calcPricePerPerson(recipe) {
  const servings = recipe.servings_count || 4;
  let total = 0;
  let hasPrice = false;
  // Sum every ingredient you actually buy — deal items AND non-deal basics
  // (onion, garlic, butter, …). Pantry staples carry no price and are excluded.
  for (const ing of (recipe.ingredients || [])) {
    if (ing.isPantry) continue;
    const m = String(ing.price || '').match(/(\d+(?:[.,]\d+)?)/);
    if (m) {
      const val = parseFloat(m[1].replace(',', '.'));
      if (val > 0) { total += val; hasPrice = true; }
    }
  }
  if (!hasPrice || servings <= 0) return null;
  const pp = Math.round(total / servings);
  return (pp < 1 || pp > 500 || !isFinite(pp)) ? null : pp;
}

// Keyword regexes matched against actual ingredient texts (case-insensitive).
// Checked against both dealItems[].name and ingredients[].text so nothing slips through.
const dietKeywords = {
  Vegetar:  /kylling|chicken|okse|grise|svine|pork|laks|salmon|tun|fisk|bacon|pølse|rejer|shrimp|torsk|\band|lam|bøf|spareribs|dorade|gyros|steak|pepperoni|krebinetter|fjerkræ/i,
  Veganer:  /kylling|chicken|okse|grise|svine|pork|laks|salmon|tun|fisk|bacon|pølse|rejer|shrimp|torsk|\band|lam|bøf|spareribs|dorade|gyros|steak|pepperoni|krebinetter|fjerkræ|mælk|fløde|smør|ost|mozzarella|parmesan|skyr|yoghurt|cremefine|æg/i,
  Glutenfri:/spaghetti|pasta|fusilli|udon|rugbrød|hvedemel|tortilla|couscous|bulgur|penne|lasagne|makaroni|knækbrød|pitabrød|hotdogbrød|pølsebrød|baguette|pizzabund|pizzadej|gyoza|tempura|petit beurre|boller/i,
  Mælkefri: /mælk|fløde|smør|ost|mozzarella|parmesan|skyr|yoghurt|cremefine|havarti|cheddar/i,
};

const DAY_SHORT = ["Man", "Tirs", "Ons", "Tors", "Fre", "Lør", "Søn"];
const DAY_FULL  = ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"];

function mergeIngredientTexts(texts) {
  if (texts.length === 1) return texts[0];
  const re = /^(\d+(?:[.,]\d+)?)\s*([a-zA-ZæøåÆØÅ]*)\s+(.+)$/;
  const parsed = texts.map(t => { const m = t.match(re); return m ? { amount: parseFloat(m[1].replace(",",".")), unit: m[2].toLowerCase(), rest: m[3].trim() } : null; });
  if (parsed.every(p => p && p.unit === parsed[0].unit && p.rest === parsed[0].rest)) {
    const total = parsed.reduce((s, p) => s + p.amount, 0);
    const str = Number.isInteger(total) ? total : parseFloat(total.toFixed(1));
    return `${str}${parsed[0].unit ? parsed[0].unit + " " : ""}${parsed[0].rest}`;
  }
  if (texts.every(t => t === texts[0])) return `${texts.length}× ${texts[0]}`;
  return texts.join(" + ");
}


// Attaches touch-swipe-down-to-dismiss listeners to a DOM element.
// Returns a cleanup function. Call with a setState ref setter as the ref prop.
function attachSwipeDismiss(el, onDismiss) {
  let startY = null;
  let curDy = 0;
  function onTouchStart(e) {
    startY = e.touches[0].clientY;
    curDy = 0;
    el.style.transition = 'none';
  }
  function onTouchMove(e) {
    if (startY === null) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 0) {
      curDy = dy;
      el.style.transform = `translateY(${Math.min(dy, 300)}px)`;
    }
  }
  function onTouchEnd() {
    el.style.transform = '';
    el.style.transition = '';
    const dy = curDy;
    startY = null;
    curDy = 0;
    if (dy > 80) onDismiss();
  }
  el.addEventListener('touchstart', onTouchStart, { passive: true });
  el.addEventListener('touchmove', onTouchMove, { passive: true });
  el.addEventListener('touchend', onTouchEnd, { passive: true });
  return () => {
    el.removeEventListener('touchstart', onTouchStart);
    el.removeEventListener('touchmove', onTouchMove);
    el.removeEventListener('touchend', onTouchEnd);
  };
}

// ── Recipe photo query builder ───────────────────────────────────────────────
// Recipe titles are Danish, but Pexels is an English stock-photo library, so
// searching the raw title (e.g. "Klassiske Frikadeller med Kartofler") returns
// generic/irrelevant images. We translate the dish into English keywords first.
// Bump PHOTO_CACHE_VER whenever this logic changes so cached photos are refetched.
const PHOTO_CACHE_VER = "v5";

// Photos already assigned to a recipe card, so two recipes never show the same
// image. Seeded once from localStorage (previously cached picks survive reloads)
// and extended as fresh cards resolve. JS is single-threaded, so the
// check-then-add inside each fetch callback runs atomically — no race.
const usedPhotos = new Set();
let usedPhotosSeeded = false;
function seedUsedPhotos() {
  if (usedPhotosSeeded) return;
  usedPhotosSeeded = true;
  const prefix = `photo_${PHOTO_CACHE_VER}_`;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) {
      const v = localStorage.getItem(k);
      if (v) usedPhotos.add(v);
    }
  }
}
// Pick the highest-ranked candidate not already used by another card. Falls back
// to the top candidate if every option is taken (better a repeat than no image).
function pickUnusedPhoto(candidates) {
  seedUsedPhotos();
  const fresh = candidates.find(u => !usedPhotos.has(u));
  const chosen = fresh || candidates[0] || null;
  if (chosen) usedPhotos.add(chosen);
  return chosen;
}

// Multi-word dish identities, matched against the whole lowercased title first
// (longer/more specific phrases before shorter ones). The matched span is then
// removed so its component words aren't re-processed.
const PHOTO_PHRASES = [
  ["butter chicken", "indian butter chicken curry"],
  ["tikka masala", "chicken tikka masala"],
  ["pasta al forno", "pasta al forno bake"],
  ["spaghetti bolognese", "spaghetti bolognese"],
  ["pasta bolognese", "pasta bolognese"],
  ["pasta carbonara", "spaghetti carbonara"],
  ["gravad laks", "cured salmon gravlax"],
  ["sushi bowl", "salmon sushi bowl"],
  ["poke bowl", "poke bowl"],
  ["rejepoke", "shrimp poke bowl"],
  ["taco bowl", "taco bowl"],
  ["tacobowl", "taco bowl"],
  ["taco-aften", "tacos"],
  ["butternut squash", "butternut squash soup"],
  // Note: sides like garlic bread / fries are intentionally NOT phrases — they
  // would otherwise lead the query over the main protein and mislead the photo.
  ["smørrebrød", "danish open sandwich smorrebrod"],
  ["stjerneskud", "danish shrimp open sandwich"],
  ["miso ramen", "miso ramen"],
  ["ramensuppe", "ramen soup"],
  ["svamperisotto", "mushroom risotto"],
  ["kyllingespyd", "grilled chicken skewers"],
  ["kyllingebowl", "chicken rice bowl"],
  ["kyllingesalat", "chicken salad"],
  ["kyllingesteg", "roast chicken"],
  ["kyllingekurry", "chicken curry"],
  ["kyllingetortilla", "chicken tortilla"],
  ["kyllingatortilla", "chicken tortilla"],
  ["laksepasta", "creamy salmon pasta"],
  ["lakseburger", "salmon burger"],
  ["oksekødsgryde", "beef stew"],
  ["svinekoteletter", "pork chops"],
  ["kartoffelmos", "mashed potatoes"],
  ["grøntsagssuppe", "vegetable soup"],
];

// Single-token Danish→English food terms. Unmapped tokens are dropped, which
// naturally strips Danish filler ("med", "og") and sauce names we don't model.
const PHOTO_WORDS = {
  // proteins
  kylling: "chicken", kyllinge: "chicken", laks: "salmon", lakse: "salmon",
  rejer: "shrimp", reje: "shrimp", spareribs: "pork ribs", dorade: "sea bream",
  gyros: "gyros", krebinetter: "pork patties", flanksteak: "flank steak",
  lammecuolotte: "roast lamb", lamme: "lamb", lam: "lamb", svinekam: "roast pork loin",
  frikadeller: "danish meatballs", oksekød: "beef", okse: "beef", oksesteg: "roast beef",
  torsk: "cod", fiskefilet: "fish fillet", fisk: "fish", leverpostej: "liver pate",
  chorizo: "chorizo", pepperoni: "pepperoni", bacon: "bacon", chicken: "chicken",
  // burgers / breads
  burger: "burger", smashburger: "smashburger", burgerbrød: "burger",
  hotdog: "hot dog", hotdogs: "hot dogs", brioche: "brioche", baguette: "baguette",
  rugbrød: "rye bread", knækbrøds: "crispbread", pita: "pita", tortilla: "tortilla",
  wrap: "wrap", naan: "naan", pizza: "pizza", surdejsbund: "sourdough",
  // pasta / rice / noodles
  spaghetti: "spaghetti", pasta: "pasta", lasagne: "lasagna", risotto: "risotto",
  ris: "rice", basmatiris: "basmati rice", jasminris: "jasmine rice",
  nudler: "noodles", udonnudler: "udon noodles", soba: "soba noodles", udon: "udon noodles",
  couscous: "couscous", kartofler: "potatoes",
  // dish types
  ramen: "ramen", gyoza: "gyoza dumplings", sushi: "sushi", tempura: "tempura",
  suppe: "soup", salat: "salad", gryde: "stew", steg: "roast", bowl: "bowl",
  tacos: "tacos", taco: "tacos", tærte: "tart", jordbærtærte: "strawberry tart",
  // cheeses
  parmesan: "parmesan", mozzarella: "mozzarella", feta: "feta", fetacreme: "feta",
  ricotta: "ricotta", cheddar: "cheddar cheese",
  // veg / sides
  broccoli: "broccoli", asparges: "asparagus", majs: "corn", edamame: "edamame",
  mukimame: "edamame", rødkål: "red cabbage", squash: "squash", linser: "lentils",
  spinat: "spinach", avocado: "avocado", rodfrugter: "root vegetables",
  grøntsager: "vegetables", tomater: "tomatoes", cherrytomater: "cherry tomatoes",
  rødløg: "red onion", løg: "onion", æbler: "apple", asaparges: "asparagus",
  // flavour identities
  teriyaki: "teriyaki", miso: "miso", misopaste: "miso", kimchi: "kimchi",
  tikka: "tikka", masala: "masala", curry: "curry", kurry: "curry", karry: "curry",
  kyllingekurry: "chicken curry", dal: "indian dal", raita: "raita", hummus: "hummus",
  tabbouleh: "tabbouleh", tzatziki: "tzatziki", pesto: "pesto", carbonara: "carbonara",
  bolognese: "bolognese", chimichurri: "chimichurri", butter: "butter",
  // cooking methods (kept for plating context)
  grillet: "grilled", ovnbagt: "oven baked", bagte: "baked", bagt: "baked",
  stegt: "pan fried", cremet: "creamy", sprød: "crispy",
  // --- Danish compound dish names (each is one token, so it must be mapped
  // whole; without these the query collapsed to the "food dish" safety net or a
  // lone side like "potatoes"). ---
  // fish & seafood
  laksesteak: "salmon steak", laksefilet: "salmon fillet", laksefillet: "salmon fillet",
  sommerlaks: "salmon", tunfisk: "tuna", tunfiskpasta: "tuna pasta",
  havtaske: "monkfish", havtasker: "monkfish", rejesteg: "fried shrimp",
  rejestegt: "fried shrimp", rejespagetti: "shrimp spaghetti",
  rejenudler: "shrimp noodles", rejenuddler: "shrimp noodles",
  krebsehale: "crayfish", krebsehaler: "crayfish", hummerhale: "lobster tail",
  hummerhalesteg: "lobster tail",
  // chicken & poultry
  kyllingefilet: "chicken breast", kyllingebryst: "chicken breast",
  kyllingebrystfilet: "chicken breast", kyllingelår: "chicken thighs",
  kyllingestuvning: "chicken stew", kyllingragu: "chicken ragout",
  kyllingeragu: "chicken ragout", kalkun: "turkey",
  // pork
  svinekød: "pork", svineköd: "pork", svinesteak: "pork steak",
  svinesteaks: "pork steak", svinekotelet: "pork chop", svinekødwok: "pork stir fry",
  karbonade: "breaded pork patty", karbonader: "breaded pork patty",
  // beef & lamb
  oksefars: "ground beef", oksefarsboller: "beef meatballs",
  oksemørbrad: "beef tenderloin", oksebouillon: "beef broth", mørbrad: "pork tenderloin",
  lammekølle: "leg of lamb", lammekolle: "leg of lamb",
  // meatballs / minced dishes
  kødboller: "meatballs", køtboller: "meatballs", køttboller: "meatballs",
  farsboller: "meatballs", løgstuvning: "onion stew", gryderet: "stew",
  // veg / sauces / aromatics
  champignon: "mushroom", champignonsauce: "mushroom sauce", courgette: "zucchini",
  zucchini: "zucchini", gulerod: "carrot", gulerødder: "carrots", gulerødssauce: "carrot",
  citron: "lemon", citronmarineret: "lemon", citronsyltet: "lemon",
  dild: "dill", dil: "dill", estragon: "tarragon", rosmarin: "rosemary",
  kokos: "coconut", kokossauce: "coconut", kokosmælk: "coconut", kokosmelk: "coconut",
  fløde: "cream", flødesauce: "creamy sauce", flødesovs: "creamy sauce",
  smørsauce: "butter sauce", smørsouce: "butter sauce", rødvin: "red wine",
  parmesankruste: "parmesan crust", wok: "stir fry", wraps: "wrap",
  entrecote: "entrecote steak", smørstegt: "pan fried", svinestuvning: "pork stew",
  tomatsovs: "tomato sauce", tomatsauce: "tomato sauce",
};

// Category → English cuisine hint appended for cultural plating accuracy.
const PHOTO_CUISINE = {
  Asiatisk: "asian", Indisk: "indian", Italiensk: "italian", Mexicansk: "mexican",
  Middelhavet: "mediterranean", Mellemøstlig: "middle eastern", Nordisk: "",
  Amerikansk: "", Verden: "",
};

function buildPhotoQuery(r) {
  let t = ` ${(r.title || "").toLowerCase()} `;
  const kws = [];
  const push = v => v.split(" ").forEach(w => { if (w && !kws.includes(w)) kws.push(w); });

  // Phrase pass — capture and remove multi-word dish identities first.
  for (const [phrase, en] of PHOTO_PHRASES) {
    if (t.includes(phrase)) { push(en); t = t.split(phrase).join(" "); }
  }
  // Token pass — translate remaining single words; drop the rest.
  for (const tok of t.split(/[^a-zæøåé]+/i)) {
    if (!tok || tok.length < 2) continue;
    const en = PHOTO_WORDS[tok];
    if (en) push(en);
  }

  let words = kws.slice(0, 6);
  if (words.length === 0) words = ["food", "dish"]; // safety net
  const cuisine = PHOTO_CUISINE[r.category];
  const q = [...(cuisine && !words.includes(cuisine) ? [cuisine] : []), ...words].join(" ");
  return `${q} food`.trim();
}

function RecipeCard({ r, inPlan, isSaved, availableNames, pantryTotal, onSelect, onAddToPlan, onToggleSave, displayTitle, displayCategory, displayTime }) {
  const photoKey = `photo_${PHOTO_CACHE_VER}_${r.id}`;
  const photoFailKey = `photo_fail_${PHOTO_CACHE_VER}_${r.id}`;
  const [photoUrl, setPhotoUrl] = useState(() => localStorage.getItem(photoKey) || null);
  const [photoLoading, setPhotoLoading] = useState(() => {
    return !localStorage.getItem(photoKey) && !localStorage.getItem(photoFailKey);
  });
  // Household size the user picked during onboarding — drives the total price shown.
  const cardServings = parseInt(localStorage.getItem('defaultServings')) || r.servings_count || 4;

  useEffect(() => {
    if (localStorage.getItem(photoFailKey)) { setPhotoLoading(false); return; }
    const cached = localStorage.getItem(photoKey);
    if (cached) { setPhotoUrl(cached); setPhotoLoading(false); return; }
    setPhotoLoading(true);
    fetch(`/api/pexels?query=${encodeURIComponent(buildPhotoQuery(r))}`)
      .then(res => res.json())
      .then(data => {
        const candidates = data?.candidates?.length ? data.candidates : (data?.url ? [data.url] : []);
        const url = pickUnusedPhoto(candidates);
        if (url) {
          localStorage.setItem(photoKey, url);
          setPhotoUrl(url);
        } else {
          localStorage.setItem(photoFailKey, '1');
        }
        setPhotoLoading(false);
      })
      .catch(() => {
        localStorage.setItem(photoFailKey, '1');
        setPhotoLoading(false);
      });
  }, [r.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const basePp = calcPricePerPerson(r);
  const totalPrice = basePp != null ? Math.round(basePp * cardServings) : null;

  return (
    <div
      className={`recipe-browse-card reveal${r.fullyMatched ? " featured" : ""}`}
      onClick={() => onSelect(r)}
    >
      <div className="card-photo-wrap">
        {photoLoading
          ? <div className="card-photo-skeleton" />
          : photoUrl
            ? <img className="card-photo" src={photoUrl} alt="" loading="lazy"
                onError={() => { setPhotoUrl(null); localStorage.removeItem(photoKey); }} />
            : <div className="card-photo-placeholder"><LogoIcon size={48} style={{ opacity: 0.18 }} /></div>
        }
        <div className="card-photo-gradient" />
        <div className="recipe-category-tag card-photo-tag">{displayCategory ?? r.category}</div>
      </div>
      <div className="card-body">
        <div className="recipe-browse-title">{displayTitle ?? r.title}</div>
        {totalPrice != null && (
          <div className="card-price-line">
            {isEn() ? "approx." : "ca."} {totalPrice} kr. {isEn() ? "for" : "til"} {cardServings} {isEn() ? "ppl" : "pers."}
            <span className="card-price-pp"> · {Math.round(basePp)} kr. {isEn() ? "per person" : "pr. person"}</span>
          </div>
        )}
        <div className="recipe-browse-meta">
          <span>{displayTime ?? r.time}</span>
          <span>{(r.ingredients || []).length} {isEn() ? "ingr." : "ing."}</span>
        </div>

        {/* Ingredient-match indicator — only when the user has added ingredients */}
        {pantryTotal > 0 && (
          <div
            className={`card-pantry-match${
              r.pantryMatchCount >= pantryTotal ? " full" : ""
            }${r.pantryMatchCount === 0 ? " none" : ""}`}
          >
            <span className="card-pantry-match-count">
              {r.pantryMatchCount}/{pantryTotal} {isEn() ? "ingredients" : "ingredienser"}
            </span>
            {r.pantryMatchCount > 0 && (
              <span className="card-pantry-match-items">
                {(r.pantryMatches || []).map(m => (
                  <span key={m} className="card-pantry-match-chip">{m}</span>
                ))}
              </span>
            )}
          </div>
        )}

        <div className="recipe-deal-tags">
          {[...new Set((r.dealItems || []).map(di => di.store))].map(ch => (
            <span key={ch} className="deal-chain-tag">{ch}</span>
          ))}
        </div>
        <div className="card-action-row">
          <button
            className={`add-to-plan-btn${inPlan ? " in-plan" : ""}`}
            onClick={e => { e.stopPropagation(); if (!inPlan) onAddToPlan(r); }}
            title={inPlan ? (isEn() ? "Already in the week" : "Allerede på ugen") : (isEn() ? "Add to the week" : "Sæt på ugen")}
          >
            {inPlan ? (isEn() ? "In the week" : "På ugen") : (isEn() ? "Add to week" : "Sæt på ugen")}
          </button>
          <button
            className={`card-save-btn${isSaved ? " saved" : ""}`}
            onClick={e => { e.stopPropagation(); onToggleSave(r, cardServings); }}
            title={isSaved ? t("Fjern fra gemte") : t("Gem opskrift")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function countRecipesForChains(chains) {
  if (chains.size === 0) return 0;
  return recipeBank.filter(r =>
    (r.dealItems || []).length > 0 &&
    (r.dealItems || []).every(di => chains.has(canonicalChain(di.store)))
  ).length;
}

function RecipeCounter({ chains }) {
  const count = countRecipesForChains(chains);
  const total = recipeBank.length;
  const allSelected = chains.size >= CHAIN_ORDER.length;

  if (chains.size === 0) {
    return (
      <div className="chain-recipe-counter chain-recipe-counter--zero">
        {t("Vælg butikker for at se opskrifter")}
      </div>
    );
  }
  if (allSelected) {
    return (
      <div className="chain-recipe-counter chain-recipe-counter--all">
        {isEn() ? "You have access to all " : "Du har adgang til alle "}
        <span className="chain-recipe-count" key={total}>{total}</span>
        {isEn() ? " recipes 🎉" : " opskrifter 🎉"}
      </div>
    );
  }
  return (
    <div className="chain-recipe-counter">
      {isEn() ? "With these stores you can make " : "Med disse butikker kan du lave "}
      <span className="chain-recipe-count" key={count}>{count}</span>{" "}
      {isEn() ? `recipe${count !== 1 ? "s" : ""} this week` : `opskrift${count !== 1 ? "er" : ""} denne uge`}
    </div>
  );
}

// ── Feedback helpers ─────────────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  return (
    <div className="fb-stars" role="radiogroup">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          className={`fb-star${n <= value ? " active" : ""}`}
          onClick={() => onChange(n)}
          aria-label={isEn() ? `${n} star${n !== 1 ? "s" : ""}` : `${n} stjerne${n !== 1 ? "r" : ""}`}
        >★</button>
      ))}
    </div>
  );
}

// Apply theme synchronously before first paint when rendering standalone
(() => {
  const theme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  if (theme === "dark" || (!theme && prefersDark)) {
    document.documentElement.classList.add("dark");
  }
})();

function FeedbackResults() {
  const [responses, setResponses] = useState(() => {
    try { return JSON.parse(localStorage.getItem("feedbackResponses") || "[]"); } catch { return []; }
  });

  useEffect(() => {
    document.body.style.background = document.documentElement.classList.contains("dark") ? "#1B1613" : "#F1E9DB";
    return () => { document.body.style.background = ""; };
  }, []);

  function exportCSV() {
    const cols = [
      "Tidsstempel","Side",
      "Nem at finde opskrift (1-5)","Design (1-5)","Sandsynlighed for brug (1-5)",
      "Stødte på fejl","Hvornår","Butik","Erstatter/supplerer","Brug hyppighed",
      "Bemærkede","Hvad mangler","Kommentarer",
    ];
    const rows = responses.map(r => [
      r.timestamp, r.page,
      r.findRecipe, r.design, r.likelihood,
      r.hadBugs === true ? "Ja" : r.hadBugs === false ? "Nej" : "",
      r.when, r.store, r.replace, r.frequency,
      Array.isArray(r.noticed) ? r.noticed.join("; ") : "",
      r.whatsMissing, r.comments,
    ].map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","));
    const csv = [cols.map(c => `"${c}"`).join(","), ...rows].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `tilbudskokken-feedback-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  function clearAll() {
    if (!window.confirm(t("Slet alle svar?"))) return;
    localStorage.removeItem("feedbackResponses");
    setResponses([]);
  }

  return (
    <div className="fb-results-page">
      <div className="fb-results-header">
        <h1 className="fb-results-title">{t("Feedback — Tilbudskokken")}</h1>
        <div className="fb-results-actions">
          <span className="fb-results-count">{responses.length} {isEn() ? "responses" : "svar"}</span>
          <button className="fb-results-export-btn" onClick={exportCSV} disabled={responses.length === 0}>
            {t("Eksporter CSV")}
          </button>
          <button className="fb-results-clear-btn" onClick={clearAll} disabled={responses.length === 0}>
            {t("Ryd alle")}
          </button>
          <a className="fb-results-back" href="/">{t("← Tilbage")}</a>
        </div>
      </div>
      {responses.length === 0 ? (
        <div className="fb-results-empty">{t("Ingen svar endnu.")}</div>
      ) : (
        <div className="fb-results-table-wrap">
          <table className="fb-results-table">
            <thead>
              <tr>
                <th>#</th><th>{t("Tid")}</th>
                <th>{t("Find opskrift")}</th><th>{t("Design")}</th><th>{t("Brug sandsynlighed")}</th>
                <th>{t("Fejl?")}</th><th>{t("Hvornår")}</th><th>{t("Butik")}</th>
                <th>{t("Erstatter")}</th><th>{t("Hyppighed")}</th>
                <th>{t("Brugte")}</th><th>{t("Hvad mangler")}</th><th>{t("Kommentarer")}</th>
              </tr>
            </thead>
            <tbody>
              {[...responses].reverse().map((r, i) => (
                <tr key={r.id || i}>
                  <td>{responses.length - i}</td>
                  <td className="fb-td-time">{new Date(r.timestamp).toLocaleString("da-DK")}</td>
                  <td className="fb-td-center">{r.findRecipe ? `${r.findRecipe}/5` : "—"}</td>
                  <td className="fb-td-center">{r.design ? `${r.design}/5` : "—"}</td>
                  <td className="fb-td-center">{r.likelihood ? `${r.likelihood}/5` : "—"}</td>
                  <td className="fb-td-center">{r.hadBugs === true ? t("Ja") : r.hadBugs === false ? t("Nej") : "—"}</td>
                  <td>{r.when || "—"}</td>
                  <td>{r.store || "—"}</td>
                  <td>{r.replace || "—"}</td>
                  <td>{r.frequency || "—"}</td>
                  <td>{Array.isArray(r.noticed) ? r.noticed.join(", ") : "—"}</td>
                  <td className="fb-td-text">{r.whatsMissing || "—"}</td>
                  <td className="fb-td-text">{r.comments || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function App() {
  if (window.location.pathname === "/feedback-results") return <FeedbackResults />;

  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch { return true; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    try { localStorage.setItem("theme", darkMode ? "dark" : "light"); } catch {}
  }, [darkMode]);

  // ── Language (Danish / English) ─────────────────────────────────
  const [lang, setLang] = useState(getLang());
  const en = lang === "en";
  function changeLang(next) {
    setLangGlobal(next);
    setLang(next);
    try { localStorage.setItem("lang", next); } catch {}
    try { document.documentElement.lang = next; } catch {}
  }
  useEffect(() => {
    try { document.documentElement.lang = lang; } catch {}
  }, [lang]);

  // ── Recipe content translation (Danish → English, on demand + cached) ──
  // Recipe text (titles, ingredients, steps…) is Danish data. When English is
  // active we translate the *visible* strings via /api/translate and cache them
  // in localStorage, keyed by the Danish source string, so each is translated
  // only once. The underlying Danish data is untouched, so all matching/filter
  // logic keeps working. Bump TX_VER to invalidate the cache if quality changes.
  const TX_VER = "v1";
  const [txCache, setTxCache] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`txCache_en_${TX_VER}`) || "{}"); }
    catch { return {}; }
  });
  const txPending = useRef(new Set());
  // Translate one Danish string for display (falls back to Danish until cached).
  const tr = (s) => (en && s && txCache[s] != null ? txCache[s] : s);
  function mergeTx(map) {
    if (!map || Object.keys(map).length === 0) return;
    setTxCache(prev => {
      const next = { ...prev, ...map };
      try { localStorage.setItem(`txCache_en_${TX_VER}`, JSON.stringify(next)); } catch {}
      return next;
    });
  }
  async function translateStrings(strings) {
    const unique = [...new Set(strings.filter(
      s => s && typeof s === "string" && txCache[s] == null && !txPending.current.has(s)
    ))];
    if (unique.length === 0) return;
    unique.forEach(s => txPending.current.add(s));
    for (let i = 0; i < unique.length; i += 40) {
      const chunk = unique.slice(i, i + 40);
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts: chunk }),
        });
        const data = await res.json();
        const map = {};
        (data.translations || []).forEach((val, idx) => { if (val) map[chunk[idx]] = val; });
        mergeTx(map);
      } catch { /* leave untranslated — shows Danish */ }
      finally { chunk.forEach(s => txPending.current.delete(s)); }
    }
  }

  const [localStores, setLocalStores] = useState(() => {
    try {
      const v = localStorage.getItem("localStores");
      if (v) {
        const parsed = JSON.parse(v);
        if (!Array.isArray(parsed)) return null;
        // old format without chain field — force re-setup to avoid {undefined} in selectedChains
        if (parsed.length > 0 && !parsed[0].chain) return null;
        const seen = new Set();
        return parsed
          .filter(s => s.chain && !seen.has(s.chain) && seen.add(s.chain))
          .map(s => ({ chain: s.chain }));
      }
      // migrate from old single-store key
      const old = localStorage.getItem("localStore");
      if (old) { const s = JSON.parse(old); return s && s.chain ? [{ chain: s.chain }] : null; }
      return null;
    } catch { return null; }
  });
  const [showStorePicker, setShowStorePicker] = useState(false);

  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [servings, setServings] = useState(4);
  const [shoppingList, setShoppingList] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("shoppingList") || "[]");
      if (!Array.isArray(raw)) return [];
      // Migrate legacy carts: string[] items + a separate `checkedItems` string[].
      if (raw.length > 0 && typeof raw[0] === "string") {
        let legacyChecked = [];
        try { legacyChecked = JSON.parse(localStorage.getItem("checkedItems") || "[]"); } catch {}
        const checkedSet = new Set(Array.isArray(legacyChecked) ? legacyChecked : []);
        const migrated = raw.map(text => ({
          id: cartUid(), text, store: null, checked: checkedSet.has(text),
        }));
        try { localStorage.setItem("shoppingList", JSON.stringify(migrated)); } catch {}
        try { localStorage.removeItem("checkedItems"); } catch {}
        return migrated;
      }
      // Already object model — normalise defensively so every entry has all fields.
      return raw
        .map(it => ({ id: it.id || cartUid(), text: it.text || "", store: it.store ?? null, checked: !!it.checked }))
        .filter(it => it.text);
    } catch { return []; }
  });
  const [confirmClearCart, setConfirmClearCart] = useState(false);
  const [cartCopied, setCartCopied] = useState(false);
  const [showShoppingSheet, setShowShoppingSheet] = useState(false);
  const [diet, setDiet] = useState(() => {
    try { return localStorage.getItem("defaultDiet") || "Alle"; } catch { return "Alle"; }
  });
  const [copied, setCopied] = useState(false);
  const [searchHidden, setSearchHidden] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(true);
  const [savedRecipes, setSavedRecipes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("savedRecipes") || "[]"); }
    catch { return []; }
  });
  const [expandedSaved, setExpandedSaved] = useState(new Set());
  const [showSavedPanel, setShowSavedPanel] = useState(false);

  // ── Meal plan ───────────────────────────────────────────────────
  const [mealPlan, setMealPlan] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("mealPlan") || "null");
      return saved && saved.length === 7 ? saved : Array(7).fill(null);
    } catch { return Array(7).fill(null); }
  });
  const [addingToPlan, setAddingToPlan] = useState(null); // recipe waiting for day pick
  const [showCombinedList, setShowCombinedList] = useState(false);
  const [dragFromDay, setDragFromDay] = useState(null);

  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("Alle tider");
  const [cuisineFilter, setCuisineFilter] = useState("Alle");
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(null); // null = no upper limit
  const [planCopied, setPlanCopied] = useState(false);
  const [showMealPlanPanel, setShowMealPlanPanel] = useState(false);
  const [showPantryPanel, setShowPantryPanel] = useState(false);
  // Desktop meal-plan rail can be collapsed so it stops eating screen width;
  // preference persists so it stays hidden across reloads.
  const [mpSidebarHidden, setMpSidebarHidden] = useState(() => {
    try { return localStorage.getItem("mpSidebarHidden") === "1"; } catch { return false; }
  });
  const [confirmClearPlan, setConfirmClearPlan] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState(() => {
    try {
      const saved = localStorage.getItem("collapsedSections");
      if (saved) return { ...JSON.parse(saved), recommended: false };
    } catch {}
    return { recommended: false, others: true };
  });

  // ── Popularity tracking ─────────────────────────────────────────
  const [popularityMap, setPopularityMap] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("recipePopularity") || "null");
      const { week, year } = getISOWeek(new Date());
      if (stored && stored.week === week && stored.year === year) return stored.counts;
    } catch {}
    return {};
  });

  // ── Pantry ──────────────────────────────────────────────────────
  const [pantryItems, setPantryItems] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("pantryItems") || "null");
      return stored ? new Set(stored) : new Set();
    } catch { return new Set(); }
  });
  const [pantryInput, setPantryInput] = useState("");
  const [pantryDropdownIdx, setPantryDropdownIdx] = useState(-1);
  const [pantryDropdownPos, setPantryDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const pantryInputWrapRef = useRef(null);

  // ── Onboarding ──────────────────────────────────────────────────
  const [onboardingStep, setOnboardingStep] = useState(() => {
    try {
      if (localStorage.getItem("onboardingDone") === "true") return null;
      if (localStorage.getItem("localStores") || localStorage.getItem("localStore")) return null;
    } catch {}
    return 0;
  });
  const [onboardingExiting, setOnboardingExiting] = useState(false);
  // Direction of the last onboarding step change: 1 = forward, -1 = back.
  // Drives which side each step slides in from so the sequence reads as one motion.
  const [obDir, setObDir] = useState(1);
  const [pendingChains, setPendingChains] = useState(new Set());
  const [pendingDiet, setPendingDiet] = useState("Alle");
  const [pendingServings, setPendingServings] = useState(4);
  const [sortOrder, setSortOrder] = useState("anbefalet");
  const [visibleCounts, setVisibleCounts] = useState({ recommended: PAGE_SIZE, others: PAGE_SIZE });
  const [quickFilters, setQuickFilters] = useState(new Set());
  // Opt-in filter: show only the week's popular recipes (was a card badge before).
  const [popularOnly, setPopularOnly] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  // Mobile-only: the filter strips are collapsed behind a "Filtre" button.
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Collapse the sticky search when scrolling down; reveal on scroll up / near top
  useEffect(() => {
    if (selectedRecipe) { setSearchHidden(false); return; }
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y > 120 && y > last + 6) setSearchHidden(true);
        else if (y < last - 6 || y < 80) setSearchHidden(false);
        last = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [selectedRecipe]);

  // ── Feedback ─────────────────────────────────────────────────────
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const FEEDBACK_EMPTY = {
    findRecipe: 0, design: 0, likelihood: 0,
    hadBugs: null,
    when: "", store: "", replace: "", frequency: "",
    noticed: [],
    whatsMissing: "", comments: "",
  };
  const [feedbackForm, setFeedbackForm] = useState(FEEDBACK_EMPTY);

  // ── Splash screen ────────────────────────────────────────────────
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem("splashShown"));
  const [splashExiting, setSplashExiting] = useState(false);

  // ── PWA install prompt ───────────────────────────────────────────
  const [installEvent, setInstallEvent] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("installDismissed")) return;
    const handler = e => { e.preventDefault(); setInstallEvent(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  useEffect(() => {
    if (!installEvent || showSplash || onboardingStep !== null) return;
    const t = setTimeout(() => setShowInstallBanner(true), 45000);
    return () => clearTimeout(t);
  }, [installEvent, showSplash, onboardingStep]);
  function triggerInstall() {
    if (!installEvent) return;
    installEvent.prompt();
    installEvent.userChoice.then(() => { setInstallEvent(null); setShowInstallBanner(false); });
  }
  function dismissInstall() {
    setShowInstallBanner(false);
    try { localStorage.setItem("installDismissed", "1"); } catch {}
  }

  const dietFilters = ["Alle", "Vegetar", "Veganer", "Glutenfri", "Mælkefri"];
  const timeFilters = ["Alle tider", "Under 20 min", "Under 45 min", "Over 45 min"];

  useEffect(() => {
    if (!showSplash) return;
    sessionStorage.setItem("splashShown", "true");
    const t1 = setTimeout(() => setSplashExiting(true), 2400);
    const t2 = setTimeout(() => setShowSplash(false), 3150);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (selectedRecipe) {
      document.body.classList.add("recipe-open");
      window.scrollTo(0, 0);
    } else {
      document.body.classList.remove("recipe-open");
    }
    return () => document.body.classList.remove("recipe-open");
  }, [selectedRecipe]);

  // Sync search-collapsed body class so mobile-filter-row top can transition via CSS
  useEffect(() => {
    document.body.classList.toggle("search-collapsed", searchHidden);
    return () => document.body.classList.remove("search-collapsed");
  }, [searchHidden]);

  // True whenever any bottom sheet / modal / overlay is open. Used both to lock
  // scrolling and to hide the floating action buttons so they can't intercept
  // clicks meant for an open sheet (QA bugs #6 / #7).
  const anyModalOpen = showSavedPanel || showOverflowMenu || showShoppingSheet || showMealPlanPanel || showPantryPanel || showStorePicker || showFeedbackPanel || addingToPlan != null;

  // Lock page scroll while any bottom sheet / modal is open. The document scrolls
  // on the root <html> element (body has default overflow), so locking body alone
  // leaves the wheel able to scroll the background — lock both (QA bug #5).
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.style.overflow = anyModalOpen ? "hidden" : "";
    body.style.overflow = anyModalOpen ? "hidden" : "";
    return () => { html.style.overflow = ""; body.style.overflow = ""; };
  }, [anyModalOpen]);

  // ── Swipe-to-dismiss bottom sheets ──────────────────────────────
  const [shoppingSheetEl, setShoppingSheetEl] = useState(null);
  const [savedPanelEl, setSavedPanelEl] = useState(null);
  useEffect(() => {
    if (!shoppingSheetEl) return;
    return attachSwipeDismiss(shoppingSheetEl, () => setShowShoppingSheet(false));
  }, [shoppingSheetEl]);
  useEffect(() => {
    if (!savedPanelEl) return;
    return attachSwipeDismiss(savedPanelEl, () => setShowSavedPanel(false));
  }, [savedPanelEl]);

  // ── Matching ────────────────────────────────────────────────────
  const selectedChains = new Set((localStores || []).map(s => canonicalChain(s.chain)));
  const setupComplete = selectedChains.size > 0;

  function getAvailableItemNames() {
    if (selectedChains.size === 0) return new Set();
    const names = new Set();
    for (const r of recipeBank) {
      for (const di of (r.dealItems || [])) {
        if (selectedChains.has(canonicalChain(di.store))) names.add(di.name);
      }
    }
    return names;
  }

  function getScoredRecipes(dietFilter) {
    const pattern = dietKeywords[dietFilter] || null;
    return recipeBank
      .filter(r => {
        if (!pattern) return true;
        const texts = [
          ...(r.dealItems || []).map(di => di.name),
          ...(r.ingredients || []).map(i => i.text),
        ];
        return !texts.some(t => pattern.test(t));
      })
      .map(r => {
        const pantryMatches = getPantryMatches(r, pantryItems);
        return {
          ...r,
          matchCount: (r.dealItems || []).length,
          fullyMatched: selectedChains.size === 0
            || (r.dealItems || []).every(di => selectedChains.has(canonicalChain(di.store))),
          pantryMatches,
          pantryMatchCount: pantryMatches.length,
        };
      });
  }

  const scoredRecipes = getScoredRecipes(diet);
  const recommended = scoredRecipes.filter(r => r.fullyMatched).sort((a, b) => (b.dealItems || []).length - (a.dealItems || []).length);
  const others = scoredRecipes.filter(r => !r.fullyMatched);
  const activeFilterCount = [
    diet !== "Alle",
    timeFilter !== "Alle tider",
    cuisineFilter !== "Alle",
    pantryItems.size > 0,
    priceMin > 0 || priceMax !== null,
    quickFilters.size > 0,
    popularOnly,
  ].filter(Boolean).length;

  const maxRecipePrice = (() => {
    const prices = scoredRecipes
      .map(r => calcPricePerPerson(r))
      .filter(p => p !== null && p > 0);
    if (prices.length === 0) return 100;
    return Math.ceil(Math.max(...prices) / 10) * 10;
  })();

  function parseMinutes(timeStr) {
    const h = timeStr.match(/(\d+)\s*t/);
    const m = timeStr.match(/(\d+)\s*min/);
    return (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0);
  }
  const searchQ = search.toLowerCase();
  function matchRecipe(r) {
    // Chain split is handled by fullyMatched in getScoredRecipes.
    // Added ingredients ("tilføj ingredienser") no longer filter here — they drive a
    // relevance sort (see applySort) so all recipes stay visible, just reordered.
    // matchRecipe only applies search / time / cuisine / price.
    if (cuisineFilter !== "Alle" && r.cuisine !== cuisineFilter) return false;
    if (popularOnly && !popularityMap[r.id]) return false;
    if (search) {
      const cuisineFromKeyword = Object.entries(CUISINE_SEARCH_MAP).find(([kw]) => searchQ.includes(kw))?.[1];
      if (cuisineFromKeyword) {
        if (r.cuisine !== cuisineFromKeyword) return false;
      } else if (
        !r.title.toLowerCase().includes(searchQ) &&
        !(r.cuisine || "").toLowerCase().includes(searchQ) &&
        !(r.ingredients || []).some(ing => (ing.text || ing).toLowerCase().includes(searchQ))
      ) {
        return false;
      }
    }
    const mins = parseMinutes(r.time);
    if (timeFilter === "Under 20 min" && mins >= 20) return false;
    if (timeFilter === "Under 45 min" && mins >= 45) return false;
    if (timeFilter === "Over 45 min" && mins < 45) return false;
    if (priceMin > 0 || priceMax !== null) {
      const pp = calcPricePerPerson(r);
      if (pp !== null) {
        if (pp < priceMin) return false;
        if (priceMax !== null && pp > priceMax) return false;
      }
      // unpriced recipes always pass the slider filter
    }
    return true;
  }

  // Comparator for the user's chosen "Sorter" option. Returns 0 for "anbefalet"
  // so a stable sort preserves the incoming (recommended) order.
  function sortComparator(a, b) {
    switch (sortOrder) {
      case "pris-asc":  return (calcPricePerPerson(a) ?? Infinity) - (calcPricePerPerson(b) ?? Infinity);
      case "pris-desc": return (calcPricePerPerson(b) ?? -Infinity) - (calcPricePerPerson(a) ?? -Infinity);
      case "hurtigst":  return parseMinutes(a.time) - parseMinutes(b.time);
      case "nyeste":    return (recipeIndexMap.get(b.id) ?? 0) - (recipeIndexMap.get(a.id) ?? 0);
      // "anbefalet" folds in popularity: recommended order first (kept stable by
      // returning 0 elsewhere), so the old separate "Populær" sort is redundant.
      default:          return 0;
    }
  }

  function applySort(recipes) {
    const pantryActive = pantryItems.size > 0;
    // No added ingredients + "anbefalet" → nothing to reorder.
    if (!pantryActive && sortOrder === "anbefalet") return recipes;
    // Array.prototype.sort is stable, so equal keys keep their incoming order.
    return [...recipes].sort((a, b) => {
      if (pantryActive) {
        // Ingredient-match relevance is the primary key; more matches rank higher.
        const d = (b.pantryMatchCount || 0) - (a.pantryMatchCount || 0);
        if (d !== 0) return d;
      }
      // Chosen "Sorter" option acts as the tiebreaker.
      return sortComparator(a, b);
    });
  }

  const filteredRecommended = applySort(recommended.filter(matchRecipe));
  const filteredOthers = applySort(others.filter(matchRecipe));
  // Reset the render cap to the first batch whenever the result set changes
  // (search, sort, or filters), so we never mount the whole list at once.
  const paginationSig = `${search.trim()}|${sortOrder}|${filteredRecommended.length}|${filteredOthers.length}`;
  useEffect(() => {
    setVisibleCounts({ recommended: PAGE_SIZE, others: PAGE_SIZE });
  }, [paginationSig]);
  // How many currently-shown recipes actually use ≥1 of the added ingredients.
  const pantryMatchTotal = pantryItems.size > 0
    ? filteredRecommended.filter(r => r.pantryMatchCount > 0).length
      + filteredOthers.filter(r => r.pantryMatchCount > 0).length
    : 0;
  const priceFiltered = priceMin > 0 || priceMax !== null;
  const noResults = (search || timeFilter !== "Alle tider" || cuisineFilter !== "Alle" || priceFiltered || popularOnly) && filteredRecommended.length === 0 && filteredOthers.length === 0;

  // Collect the recipe strings currently on screen and translate any that aren't
  // cached yet. Titles/categories for visible cards, plus the full content of an
  // open recipe. Runs only in English; re-runs when the visible set changes.
  const txSig = en ? [
    selectedRecipe?.id ?? "",
    filteredRecommended.slice(0, visibleCounts.recommended).map(r => r.id).join(","),
    filteredOthers.slice(0, visibleCounts.others).map(r => r.id).join(","),
    mealPlan.map(e => e?.recipe?.id ?? "").join(","),
    savedRecipes.map(r => r.id).join(","),
  ].join("|") : "";
  useEffect(() => {
    if (!en) return;
    const needed = [];
    const addRecipeTitle = r => { if (r) { if (r.title) needed.push(r.title); if (r.category) needed.push(r.category); } };
    filteredRecommended.slice(0, visibleCounts.recommended).forEach(addRecipeTitle);
    filteredOthers.slice(0, visibleCounts.others).forEach(addRecipeTitle);
    mealPlan.forEach(e => e?.recipe && needed.push(e.recipe.title));
    savedRecipes.forEach(r => needed.push(r.title));
    if (selectedRecipe) {
      const r = selectedRecipe;
      if (r.title) needed.push(r.title);
      if (r.subtitle) needed.push(r.subtitle);
      if (r.description) needed.push(r.description);
      (r.ingredients || []).forEach(ing => { if (ing.text) needed.push(ing.text); });
      (r.steps || []).forEach(s => needed.push(s));
      if (r.tip) needed.push(r.tip);
      if (Array.isArray(r.tips)) r.tips.forEach(tp => needed.push(tp));
    }
    translateStrings(needed);
  }, [txSig]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scroll-triggered reveals (viewport-based, respects reduced-motion) ──
  const revealSig =
    // `selectedRecipe` flips when entering/leaving the detail view. Including it here
    // re-runs the effect on back-navigation so the freshly-remounted list cards get
    // re-observed (otherwise they stay stuck at opacity:0 — see QA bug #1).
    (selectedRecipe ? "detail" : "list") + "|" +
    filteredRecommended.map(r => r.id).join(",") + "|" +
    filteredOthers.map(r => r.id).join(",") + "|" +
    (collapsedSections.recommended ? "0" : "1") +
    (collapsedSections.others ? "0" : "1") + "|" +
    (showSavedPanel ? "s" : "");
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const els = document.querySelectorAll(".reveal:not(.is-visible)");
    if (reduce) { els.forEach(el => el.classList.add("is-visible")); return; }
    if (!els.length) return;
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          obs.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px 100px 0px", threshold: 0.01 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [revealSig]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Recipe selection ────────────────────────────────────────────
  function selectRecipe(r) {
    setSelectedRecipe(r);
    trackRecipeInteraction(r.id, 1);
    const ds = parseInt(localStorage.getItem("defaultServings"));
    setServings(ds || r.servings_count || 4);
  }

  // ── Shopping list ───────────────────────────────────────────────
  // Cart entries are { id, text, store, checked }. `checked` lives on the item so
  // there is one source of truth — keys, checking and removal are all id-based.
  function persistCart(next) {
    try { localStorage.setItem("shoppingList", JSON.stringify(next)); } catch {}
    return next;
  }
  function addToShoppingList(text, store = null) {
    const norm = normCartText(text);
    setShoppingList(prev => {
      if (prev.some(it => normCartText(it.text) === norm)) return prev;
      return persistCart([...prev, { id: cartUid(), text, store: store || null, checked: false }]);
    });
  }
  function removeFromShoppingList(id) {
    setShoppingList(prev => persistCart(prev.filter(it => it.id !== id)));
  }
  function clearShoppingList() {
    setConfirmClearCart(false);
    setShoppingList([]);
    try { localStorage.removeItem("shoppingList"); } catch {}
  }
  function toggleCheckedItem(id) {
    setShoppingList(prev =>
      persistCart(prev.map(it => (it.id === id ? { ...it, checked: !it.checked } : it))));
  }
  function clearCheckedItems() {
    setShoppingList(prev => persistCart(removeCheckedEntries(prev)));
  }
  // Plain-text export grouped by store, for the copy / native-share button.
  async function shareShoppingList() {
    const groups = groupCartByStore(shoppingList);
    const body = groups
      .map(g => `${g.store}:\n` + g.items.map(it => `  - ${it.text}`).join("\n"))
      .join("\n\n");
    const text = `Min indkøbsliste (Spotkokken)\n\n${body}`;
    try {
      if (navigator.share) { await navigator.share({ title: "Indkøbsliste", text }); return; }
      await navigator.clipboard.writeText(text);
      setCartCopied(true);
      setTimeout(() => setCartCopied(false), 1800);
    } catch { /* user cancelled share — ignore */ }
  }

  // ── Feedback ─────────────────────────────────────────────────────
  // Open the feedback survey, first closing any other sheet so we never stack
  // two modals on top of each other (single modal at a time — QA bug #7 guard).
  function openFeedback() {
    setShowSavedPanel(false);
    setShowMealPlanPanel(false);
    setShowShoppingSheet(false);
    setShowPantryPanel(false);
    setShowOverflowMenu(false);
    setShowStorePicker(false);
    setFeedbackSubmitted(false);
    setFeedbackForm(FEEDBACK_EMPTY);
    setShowFeedbackPanel(true);
  }

  function submitFeedback() {
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
      ...feedbackForm,
      noticed: [...feedbackForm.noticed],
    };
    try {
      const existing = JSON.parse(localStorage.getItem("feedbackResponses") || "[]");
      localStorage.setItem("feedbackResponses", JSON.stringify([...existing, entry]));
    } catch {}
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setShowFeedbackPanel(false);
      setFeedbackSubmitted(false);
      setFeedbackForm(FEEDBACK_EMPTY);
    }, 2000);
  }

  // ── Save / delete ───────────────────────────────────────────────
  // `servingsSel` captures the serving size the user had selected when saving so
  // the "Gemte opskrifter" sheet shows the real count, not the recipe default
  // (QA bug #4). Falls back to the recipe's own serving count when not provided.
  function saveRecipe(r, servingsSel) {
    const entry = { ...r, savedAt: Date.now(), savedServings: savedServingsFor(r, servingsSel) };
    const next = [entry, ...savedRecipes];
    setSavedRecipes(next);
    localStorage.setItem("savedRecipes", JSON.stringify(next));
    trackRecipeInteraction(r.id, 3);
  }
  function deleteSavedRecipe(savedAt) {
    const next = savedRecipes.filter(r => r.savedAt !== savedAt);
    setSavedRecipes(next);
    localStorage.setItem("savedRecipes", JSON.stringify(next));
  }
  function toggleSaveRecipe(r, servingsSel) {
    const existing = savedRecipes.find(s => s.id === r.id);
    if (existing) deleteSavedRecipe(existing.savedAt);
    else saveRecipe(r, servingsSel);
  }

  function addAllSavedToShoppingList(recipes) {
    const targetRecipes = recipes || savedRecipes;
    const existingNorm = new Set(shoppingList.map(it => normCartText(it.text)));
    const toAdd = [];
    for (const r of targetRecipes) {
      for (const ing of (r.ingredients || [])) {
        if (ing.isPantry) continue;
        const text = ing.text || '';
        const norm = normCartText(text);
        if (norm && !existingNorm.has(norm)) {
          existingNorm.add(norm);
          toAdd.push({ id: cartUid(), text, store: ing.store || null, checked: false });
        }
      }
    }
    if (toAdd.length === 0) return 0;
    setShoppingList(prev => persistCart([...prev, ...toAdd]));
    return toAdd.length;
  }

  function toggleExpanded(savedAt) {
    setExpandedSaved(prev => {
      const next = new Set(prev);
      next.has(savedAt) ? next.delete(savedAt) : next.add(savedAt);
      return next;
    });
  }

  // ── Share ───────────────────────────────────────────────────────
  async function shareRecipe(r) {
    const ingredientLines = (r.ingredients || []).map(ing => ing.text || ing).join("\n");
    const text = `${r.emoji} ${r.title}\n\nIngredienser:\n${ingredientLines}\n\nFremgangsmåde:\n${r.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}${r.tip ? `\n\nTip: ${r.tip}` : ""}\n\n— Tilbudskokken`;
    try {
      if (navigator.share) {
        await navigator.share({ title: r.title, text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch {}
      }
    }
  }

  // ── Scale ───────────────────────────────────────────────────────
  function scaleIngredient(text, baseServings, currentServings) {
    if (typeof text !== 'string') return String(text ?? '');
    const ratio = currentServings / baseServings;
    return text.replace(/(\d+([.,]\d+)?)/g, match => {
      const scaled = parseFloat(match.replace(",", ".")) * ratio;
      return Number.isInteger(scaled) ? scaled : scaled.toFixed(1).replace(".", ",");
    });
  }

  // ── Meal plan functions ─────────────────────────────────────────
  function saveMealPlanState(plan) {
    localStorage.setItem("mealPlan", JSON.stringify(plan));
  }
  function addToPlan(recipe, dayIdx) {
    setMealPlan(prev => {
      const next = [...prev];
      next[dayIdx] = { recipe, servings: recipe.servings_count || 4 };
      saveMealPlanState(next);
      return next;
    });
    setAddingToPlan(null);
  }
  function removeFromPlan(dayIdx) {
    setMealPlan(prev => {
      const next = [...prev];
      next[dayIdx] = null;
      saveMealPlanState(next);
      return next;
    });
  }
  function clearMealPlan() {
    const empty = Array(7).fill(null);
    setMealPlan(empty);
    saveMealPlanState(empty);
    setShowCombinedList(false);
    setShowMealPlanPanel(false);
    setConfirmClearPlan(false);
  }
  function setPlanServings(dayIdx, val) {
    setMealPlan(prev => {
      const next = [...prev];
      if (next[dayIdx]) next[dayIdx] = { ...next[dayIdx], servings: val };
      saveMealPlanState(next);
      return next;
    });
  }
  function handleDayDrop(toDayIdx) {
    if (dragFromDay === null || dragFromDay === toDayIdx) { setDragFromDay(null); return; }
    setMealPlan(prev => {
      const next = [...prev];
      [next[toDayIdx], next[dragFromDay]] = [next[dragFromDay], next[toDayIdx]];
      saveMealPlanState(next);
      return next;
    });
    setDragFromDay(null);
  }
  function buildCombinedList() {
    const byStore = {};
    for (const entry of mealPlan) {
      if (!entry) continue;
      const { recipe, servings: sv } = entry;
      for (const ing of (recipe.ingredients || [])) {
        if (ing.isPantry) continue;
        const store  = ing.store || CART_STORE_FALLBACK;
        const scaled = scaleIngredient(ing.text, recipe.servings_count || 4, sv);
        if (!byStore[store]) byStore[store] = {};
        if (!byStore[store][ing.text]) byStore[store][ing.text] = [];
        byStore[store][ing.text].push(scaled);
      }
    }
    return Object.entries(byStore).map(([store, items]) => ({
      store,
      items: Object.entries(items).map(([key, texts]) => ({
        dealItem: key,
        merged: mergeIngredientTexts(texts),
      })),
    }));
  }
  const combinedList = showCombinedList ? buildCombinedList() : [];
  const planCount = mealPlan.filter(Boolean).length;

  useEffect(() => {
    // Only reserve the rail's width when it's actually shown.
    document.body.classList.toggle("has-mp-sidebar", planCount > 0 && !mpSidebarHidden);
  }, [planCount, mpSidebarHidden]);

  function toggleMpSidebar() {
    setMpSidebarHidden(prev => {
      const next = !prev;
      try { localStorage.setItem("mpSidebarHidden", next ? "1" : "0"); } catch {}
      return next;
    });
  }

  function toggleQuickFilter(id) {
    setQuickFilters(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function changeDiet(val) {
    setDiet(val);
    try { localStorage.setItem("defaultDiet", val); } catch {}
  }

  // Reset every result-narrowing filter in one action. Leaves search (it has its
  // own clear) and the pantry/sort defaults handled by their own controls.
  function clearAllFilters() {
    changeDiet("Alle");
    setTimeFilter("Alle tider");
    setCuisineFilter("Alle");
    setPriceMin(0);
    setPriceMax(null);
    setQuickFilters(new Set());
    setPopularOnly(false);
  }

  function toggleSection(key) {
    setCollapsedSections(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem("collapsedSections", JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function trackRecipeInteraction(id, weight = 1) {
    setPopularityMap(prev => {
      const next = { ...prev, [id]: (prev[id] || 0) + weight };
      const { week, year } = getISOWeek(new Date());
      try { localStorage.setItem("recipePopularity", JSON.stringify({ week, year, counts: next })); } catch {}
      return next;
    });
  }

  // ── Pantry functions ────────────────────────────────────────────
  function togglePantryItem(item) {
    setPantryItems(prev => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      try { localStorage.setItem("pantryItems", JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  function clearPantry() {
    setPantryItems(new Set());
    try { localStorage.removeItem("pantryItems"); } catch {}
  }

  useEffect(() => {
    if (pantryInput.trim().length < 2 || !pantryInputWrapRef.current) return;
    const update = () => {
      if (!pantryInputWrapRef.current) return;
      const r = pantryInputWrapRef.current.getBoundingClientRect();
      setPantryDropdownPos({ top: r.bottom + 4, left: r.left, width: r.width });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pantryInput, showPantryPanel]);

  function addPantryFromInput(explicitItem) {
    const val = (explicitItem ?? pantryInput).trim();
    if (!val) return;
    togglePantryItem(val);
    setPantryInput("");
    setPantryDropdownIdx(-1);
  }

  async function shareMealPlan() {
    const lines = mealPlan
      .map((entry, i) => entry ? `${DAY_FULL[i]}: ${entry.recipe.emoji} ${entry.recipe.title} (${entry.servings} pers.)` : null)
      .filter(Boolean)
      .join("\n");
    const text = `📅 Min madplan:\n\n${lines}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Min madplan", text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      setPlanCopied(true);
      setTimeout(() => setPlanCopied(false), 2000);
    }
  }

  // ── Onboarding functions ────────────────────────────────────────
  function toggleChain(chain) {
    setPendingChains(prev => {
      const next = new Set(prev);
      next.has(chain) ? next.delete(chain) : next.add(chain);
      return next;
    });
  }

  function handleOnboardingContinue() {
    if (onboardingStep < 3) {
      setObDir(1);
      setOnboardingStep(s => s + 1);
    } else {
      const storesArray = CHAIN_ORDER
        .filter(ch => pendingChains.has(ch))
        .map(ch => ({ chain: ch }));
      setLocalStores(storesArray);
      localStorage.setItem("localStores", JSON.stringify(storesArray));
      localStorage.setItem("defaultDiet", pendingDiet);
      setDiet(pendingDiet);
      localStorage.setItem("defaultServings", String(pendingServings));
      localStorage.setItem("onboardingDone", "true");
      setOnboardingExiting(true);
      // Keep in sync with app-enter-slide: 40ms delay + 520ms duration = 560ms total.
      setTimeout(() => { setOnboardingStep(null); setOnboardingExiting(false); }, 580);
    }
  }

  function openSettings() {
    setPendingChains(new Set((localStores || []).map(s => s.chain)));
    setPendingDiet(diet);
    setPendingServings(parseInt(localStorage.getItem("defaultServings")) || 4);
    setOnboardingStep(1);
  }

  // toggle a chain in the store picker modal — saves immediately
  function toggleLocalChain(chain) {
    setLocalStores(prev => {
      const chains = new Set((prev || []).map(s => s.chain));
      chains.has(chain) ? chains.delete(chain) : chains.add(chain);
      const next = CHAIN_ORDER.filter(ch => chains.has(ch)).map(ch => ({ chain: ch }));
      localStorage.setItem("localStores", JSON.stringify(next));
      return next;
    });
  }
  function selectAllStores() {
    const next = CHAIN_ORDER.map(ch => ({ chain: ch }));
    setLocalStores(next);
    localStorage.setItem("localStores", JSON.stringify(next));
  }
  function clearStores() {
    setLocalStores([]);
    localStorage.setItem("localStores", JSON.stringify([]));
  }

  function storeHeaderLabel(list) {
    if (!list || list.length === 0) return t("Ingen butik valgt");
    if (list.length === 1) return list[0].chain;
    const and = en ? "and" : "og";
    if (list.length === 2) return `${list[0].chain} ${and} ${list[1].chain}`;
    return `${list[0].chain} ${and} ${list.length - 1} ${en ? "others" : "andre"}`;
  }

  const isRecipeSaved = selectedRecipe && savedRecipes.some(r => r.id === selectedRecipe.id);

  // Whether the selected recipe's shoppable (deal) ingredients are already on the
  // shopping list. Drives the persistent "Til indkøb" → "Tilføjet ✓" state so it
  // reflects real list membership instead of a 2-second timer (QA bug #3).
  const detailInList = selectedRecipe ? allShoppablesInList(selectedRecipe, shoppingList) : false;
  const weekBadge = `${en ? "WEEK" : "UGE"} ${getISOWeek(new Date()).week} · ${new Date().getFullYear()}`;

  // ── Shared cart rendering (used by both the inline card and the modal sheet) ──
  const cartCheckedCount = shoppingList.filter(it => it.checked).length;
  const cartCheckIcon = (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,7 6,11 12,3" />
    </svg>
  );
  // Store-grouped item list. One markup for every cart surface so they can't drift.
  function renderCartGroups() {
    return groupCartByStore(shoppingList).map(group => (
      <div key={group.store} className="cart-group">
        <div className="cart-group-label">
          <span className="chain-badge" style={getChainColor(group.store) ? { "--chain-color": getChainColor(group.store) } : undefined} />
          <span className="cart-group-name">{group.store}</span>
          <span className="cart-group-count">{group.items.length}</span>
        </div>
        <ul className="cart-item-list">
          {group.items.map(it => (
            <li
              key={it.id}
              className={`cart-item${it.checked ? " checked" : ""}`}
              onClick={() => toggleCheckedItem(it.id)}
            >
              <button
                className="cart-check-btn"
                onClick={e => { e.stopPropagation(); toggleCheckedItem(it.id); }}
                aria-label={it.checked ? t("Fjern hak") : t("Sæt hak")}
                tabIndex={-1}
              >
                {it.checked ? cartCheckIcon : null}
              </button>
              <span className="cart-item-text">{it.text}</span>
              <button
                className="cart-item-remove"
                onClick={e => { e.stopPropagation(); removeFromShoppingList(it.id); }}
                aria-label={t("Fjern vare")}
              >×</button>
            </li>
          ))}
        </ul>
      </div>
    ));
  }
  // Footer action row: share, clear-checked, and clear-all with a two-step confirm.
  function renderCartActions() {
    return (
      <div className="cart-actions">
        <button className={`cart-share-btn${cartCopied ? " copied" : ""}`} onClick={shareShoppingList}>
          {cartCopied ? t("✓ Kopieret!") : t("Del / kopiér liste")}
        </button>
        {cartCheckedCount > 0 && (
          <button className="cart-clear-btn cart-clear-btn--safe" onClick={clearCheckedItems}>
            {en ? "Clear checked" : "Ryd afkrydsede"} ({cartCheckedCount})
          </button>
        )}
        {confirmClearCart ? (
          <div className="cart-clear-confirm">
            <span>{t("Tøm hele listen?")}</span>
            <div className="cart-clear-confirm-btns">
              <button className="cart-clear-yes" onClick={clearShoppingList}>{t("Ja, tøm")}</button>
              <button className="cart-clear-no" onClick={() => setConfirmClearCart(false)}>{t("Annuller")}</button>
            </div>
          </div>
        ) : (
          <button className="cart-clear-btn" onClick={() => setConfirmClearCart(true)}>{t("Start forfra")}</button>
        )}
      </div>
    );
  }

  // Pantry (Køleskab) controls — input + autocomplete + suggestions + tags.
  // Extracted so the Køleskab nav destination reuses the exact same rich UI that
  // used to live inline in the filter panel.
  function renderPantryBody() {
    const query = pantryInput.trim();
    const dropdownItems = (() => {
      if (query.length < 2) return [];
      const q = query.toLowerCase();
      const available = INGREDIENT_AUTOCOMPLETE.filter(s => !pantryItems.has(s));
      const starts = available.filter(s => s.toLowerCase().startsWith(q));
      const partials = available.filter(s => !s.toLowerCase().startsWith(q) && s.toLowerCase().includes(q));
      return [...starts, ...partials].slice(0, 5);
    })();
    const showDropdown = query.length >= 2;
    return (
      <div className="pantry-body-inline">
        <div className="pantry-input-wrap" ref={pantryInputWrapRef}>
          <div className="pantry-input-row">
            <input
              className="pantry-text-input"
              type="text"
              placeholder={pantryItems.size === 0 ? t("Hvad har du i køleskabet i dag?") : t("Tilføj flere ingredienser...")}
              value={pantryInput}
              autoComplete="off"
              onChange={e => { setPantryInput(e.target.value); setPantryDropdownIdx(-1); }}
              onKeyDown={e => {
                if (e.key === "ArrowDown") { e.preventDefault(); setPantryDropdownIdx(i => Math.min(i + 1, dropdownItems.length - 1)); }
                else if (e.key === "ArrowUp") { e.preventDefault(); setPantryDropdownIdx(i => Math.max(i - 1, -1)); }
                else if (e.key === "Enter") { e.preventDefault(); addPantryFromInput(dropdownItems[pantryDropdownIdx] ?? undefined); }
                else if (e.key === "Escape") { setPantryInput(""); setPantryDropdownIdx(-1); }
              }}
              onBlur={() => setTimeout(() => setPantryDropdownIdx(-1), 150)}
            />
            {query && <button className="pantry-add-btn" onClick={() => addPantryFromInput()}>{t("Tilføj")}</button>}
          </div>
          {showDropdown && (
            <div className="pantry-dropdown" style={{ position: "fixed", top: pantryDropdownPos.top, left: pantryDropdownPos.left, width: pantryDropdownPos.width, zIndex: 1000 }}>
              {dropdownItems.length > 0 ? dropdownItems.map((s, i) => {
                const [before, match, after] = highlightSuggestion(s, query);
                return (
                  <button key={s} className={`pantry-dropdown-item${i === pantryDropdownIdx ? " active" : ""}`} onMouseDown={e => { e.preventDefault(); addPantryFromInput(s); }}>
                    {before}<span className="suggestion-highlight">{match}</span>{after}
                  </button>
                );
              }) : <div className="pantry-dropdown-empty">{t("Ingen forslag — tryk Enter for at tilføje alligevel")}</div>}
            </div>
          )}
        </div>
        <div className="pantry-suggestions">
          {PANTRY_SUGGESTIONS.filter(s => !pantryItems.has(s)).map(s => (
            <button key={s} className="pantry-suggest-chip" onClick={() => togglePantryItem(s)}>+ {s}</button>
          ))}
        </div>
        {pantryItems.size > 0 && (
          <div className="pantry-tags">
            {[...pantryItems].map(item => (
              <span key={item} className="pantry-tag">
                {item}
                <button className="pantry-tag-remove" onClick={() => togglePantryItem(item)} aria-label={`Fjern ${item}`}>×</button>
              </span>
            ))}
            <button className="pantry-clear-all" onClick={clearPantry}>{t("Ryd alle")}</button>
          </div>
        )}
        {pantryItems.size > 0 && (
          <button className="pantry-find-btn" onClick={() => setShowPantryPanel(false)}>
            {t("Vis rangering")}
            <span className="pantry-find-count">{pantryMatchTotal}</span>
          </button>
        )}
      </div>
    );
  }

  // The recipe-detail action buttons, shared between the desktop inline bar
  // (in the recipe header) and the mobile docked bar. On mobile the docked bar
  // is portaled to <body> (see below) so its position:fixed is relative to the
  // viewport — the .recipe-detail-sheet is itself position:fixed;overflow:auto,
  // and nesting the bar inside it left `bottom:0` resolving to the wrong box,
  // so the bar drifted mid-scroll instead of staying pinned to the bottom.
  const detailActionButtons = selectedRecipe && (
    <>
      <button
        className={`share-btn share-btn--icon${copied ? " copied" : ""}`}
        onClick={() => shareRecipe(selectedRecipe)}
        title={t("Del opskrift")}
        aria-label={t("Del opskrift")}
      >
        {copied ? (
          <span aria-hidden="true">✓</span>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
        )}
      </button>
      <button
        className={`save-btn${isRecipeSaved ? " saved" : ""}`}
        onClick={() => toggleSaveRecipe(selectedRecipe, servings)}
        title={isRecipeSaved ? t("Fjern fra gemte") : t("Gem opskrift")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
        <span>{isRecipeSaved ? t("Gemt") : t("Gem opskrift")}</span>
      </button>
      <button
        className={`save-btn detail-list-btn${detailInList ? " added" : ""}`}
        onClick={() => addAllSavedToShoppingList([selectedRecipe])}
        title={t("Tilføj ingredienser til indkøbsliste")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <span>{detailInList ? t("Tilføjet ✓") : t("Til indkøb")}</span>
      </button>
      {(() => {
        const inPlan = mealPlan.some(e => e?.recipe?.id === selectedRecipe.id);
        return (
          <button
            className={`add-to-plan-btn detail${inPlan ? " in-plan" : ""}`}
            onClick={() => !inPlan && setAddingToPlan(selectedRecipe)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>{inPlan ? t("I madplan") : t("Tilføj til ugen")}</span>
          </button>
        );
      })()}
    </>
  );

  // ── Render a grid of recipe cards ──────────────────────────────
  function renderRecipeGrid(recipes, sectionKey) {
    const availableNames = getAvailableItemNames();
    const limit = sectionKey ? (visibleCounts[sectionKey] ?? recipes.length) : recipes.length;
    return recipes.slice(0, limit).map(r => (
      <RecipeCard
        key={r.id}
        r={r}
        inPlan={mealPlan.some(e => e?.recipe?.id === r.id)}
        isSaved={savedRecipes.some(s => s.id === r.id)}
        availableNames={availableNames}
        pantryTotal={pantryItems.size}
        onSelect={selectRecipe}
        onAddToPlan={setAddingToPlan}
        onToggleSave={toggleSaveRecipe}
        displayTitle={tr(r.title)}
        displayCategory={en ? tr(r.category) : r.category}
        displayTime={timeText(r.time)}
      />
    ));
  }

  return (
    <>
    <div className={`app${onboardingExiting ? " app-entering" : ""}`}>

      {/* ── Splash screen ──────────────────────────────────────── */}
      {showSplash && (
        <div className={`splash-screen${splashExiting ? " exiting" : ""}`}>
          <div className="splash-glow" />
          <div className="splash-ring" />
          <div className="splash-ring splash-ring-2" />
          <div className="splash-content">
            <div className="splash-mark">
              <LogoIcon size={120} holeColor="#1B1613" />
            </div>
            <div className="splash-wordmark">Tilbudskokken</div>
            <p className="splash-tagline">{t("Bedre tilbud. Bedre mad.")}</p>
          </div>
        </div>
      )}

      {/* ── Onboarding overlay ───────────────────────────────────
          Portaled to <body> so `.app`'s transform during the enter animation
          can't become its containing block (which would box the fixed overlay
          to the centered column and flash on desktop). */}
      {onboardingStep !== null && createPortal((
        <div className={`ob-overlay${onboardingExiting ? " exiting" : ""}`}>

          {/* Welcome screen */}
          {onboardingStep === 0 && (
            <div className="ob-welcome">
              <div className="ob-welcome-deco-1" />
              <div className="ob-welcome-deco-2" />
              <div className="ob-welcome-content">
                <LogoIcon size={200} className="ob-welcome-logo" />
                <p className="ob-welcome-tagline">{t("Bedre tilbud. Bedre mad.")}</p>
                <p className="ob-welcome-desc">{t("Opskrifter bygget præcis på hvad der er på tilbud i dine butikker denne uge.")}</p>
                <button className="ob-cta-btn" onClick={() => { setObDir(1); setOnboardingStep(1); }}>
                  {t("Kom i gang →")}
                </button>
                <div className="ob-welcome-lang">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      type="button"
                      className={`ob-welcome-lang-btn${lang === l.code ? " active" : ""}`}
                      onClick={() => changeLang(l.code)}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step screens 1-3 */}
          {onboardingStep > 0 && (
            <div className="ob-step-layout">
              <div className="ob-topbar">
                <button className="ob-back-btn" onClick={() => { setObDir(-1); setOnboardingStep(s => s - 1); }}>
                  {t("← Tilbage")}
                </button>
                <div className="ob-progress">
                  {[1, 2, 3].map(n => (
                    <div key={n} className={`ob-progress-dot${onboardingStep >= n ? " active" : ""}${onboardingStep > n ? " done" : ""}`} />
                  ))}
                </div>
                <span className="ob-step-counter">{onboardingStep}/3</span>
              </div>

              {/* Step 1 — Store selection */}
              {onboardingStep === 1 && (
                <div className={`ob-content ob-slide-${obDir > 0 ? "fwd" : "back"}`} key="s1">
                  <h2 className="ob-title">{t("Vælg dine butikker")}</h2>
                  <p className="ob-desc">{t("Vælg de kæder du handler i — vi finder de bedste tilbudsmiddag til dig.")}</p>
                  <button
                    className="ob-select-all-btn"
                    onClick={() => pendingChains.size === CHAIN_ORDER.length
                      ? setPendingChains(new Set())
                      : setPendingChains(new Set(CHAIN_ORDER))
                    }
                  >
                    {pendingChains.size === CHAIN_ORDER.length ? t("Fravælg alle") : t("Vælg alle")}
                  </button>
                  <div className="ob-chain-grid">
                    {CHAIN_ORDER.map(chain => {
                      const sel = pendingChains.has(chain);
                      return (
                        <button
                          key={chain}
                          className={`ob-chain-card${sel ? " selected" : ""}`}
                          onClick={() => toggleChain(chain)}
                        >
                          <span className="chain-badge ob-chain-badge" style={getChainColor(chain) ? { '--chain-color': getChainColor(chain) } : undefined}></span>
                          <span className="ob-chain-name">{chain}</span>
                          <span className={`ob-chain-check${sel ? " checked" : ""}`}>✓</span>
                        </button>
                      );
                    })}
                  </div>
                  <RecipeCounter chains={pendingChains} />
                </div>
              )}

              {/* Step 2 — Dietary preference */}
              {onboardingStep === 2 && (
                <div className={`ob-content ob-slide-${obDir > 0 ? "fwd" : "back"}`} key="s3">
                  <h2 className="ob-title">{t("Kostpræferencer")}</h2>
                  <p className="ob-desc">{t("Vælg din kostpræference — vi tilpasser opskrifterne.")}</p>
                  <div className="ob-diet-grid">
                    {[
                      { label: t("Ingen"),        val: "Alle" },
                      { label: dietLabel("Vegetar"),  val: "Vegetar" },
                      { label: dietLabel("Veganer"),  val: "Veganer" },
                      { label: dietLabel("Glutenfri"),val: "Glutenfri" },
                      { label: dietLabel("Mælkefri"), val: "Mælkefri" },
                    ].map(({ label, val }) => {
                      const sel = pendingDiet === val;
                      return (
                        <button
                          key={val}
                          className={`ob-diet-chip${sel ? " selected" : ""}`}
                          onClick={() => setPendingDiet(val)}
                        >
                          <span className="ob-diet-label">{label}</span>
                          {sel && <span className="ob-diet-check">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3 — Serving size */}
              {onboardingStep === 3 && (
                <div className={`ob-content ob-slide-${obDir > 0 ? "fwd" : "back"}`} key="s4">
                  <h2 className="ob-title">{t("Hvor mange personer?")}</h2>
                  <p className="ob-desc">{t("Vi tilpasser portionsstørrelserne til dit husstand.")}</p>
                  <div className="ob-servings-picker">
                    <button className="ob-sv-btn" onClick={() => setPendingServings(s => Math.max(1, s - 1))}>−</button>
                    <div className="ob-sv-display">
                      <span className="ob-sv-number">{pendingServings}</span>
                      <span className="ob-sv-label">{en ? (pendingServings !== 1 ? "people" : "person") : `person${pendingServings !== 1 ? "er" : ""}`}</span>
                    </div>
                    <button className="ob-sv-btn" onClick={() => setPendingServings(s => Math.min(10, s + 1))}>+</button>
                  </div>
                </div>
              )}

              <button
                className="ob-continue-btn"
                disabled={onboardingStep === 1 && pendingChains.size === 0}
                onClick={handleOnboardingContinue}
              >
                {onboardingStep === 3 ? t("Gå til opskrifter →") : t("Fortsæt →")}
              </button>
            </div>
          )}
        </div>
      ), document.body)}

      {/* Store picker modal (skift / administrer) */}
      {showStorePicker && (
        <div className="store-picker-overlay" onClick={e => e.target === e.currentTarget && setShowStorePicker(false)}>
          <div className="store-picker-card">
            <div className="sp-modal-header">
              <div>
                <h2 className="sp-title">{t("Dine butikker")}</h2>
                <div className="sp-chain-count-row">
                  <span className="sp-chain-count-badge">{selectedChains.size}/{CHAIN_ORDER.length} {en ? "selected" : "valgt"}</span>
                  {selectedChains.size < CHAIN_ORDER.length && (
                    <button className="sp-select-all-btn" onClick={selectAllStores}>{t("+ Vælg alle")}</button>
                  )}
                  {selectedChains.size > 0 && (
                    <button className="sp-clear-btn" onClick={clearStores}>{t("Ryd")}</button>
                  )}
                </div>
              </div>
              <button className="sp-close-btn" onClick={() => setShowStorePicker(false)}>×</button>
            </div>
            <p className="sp-desc" style={{ margin: "0 0 1rem" }}>{t("Tryk på en kæde for at vælge eller fravælge den.")}</p>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <div className="ob-chain-grid">
                {CHAIN_ORDER.map(chain => {
                  const sel = selectedChains.has(chain);
                  return (
                    <button
                      key={chain}
                      className={`ob-chain-card${sel ? " selected" : ""}`}
                      onClick={() => toggleLocalChain(chain)}
                    >
                      <span className="chain-badge ob-chain-badge" style={getChainColor(chain) ? { '--chain-color': getChainColor(chain) } : undefined}></span>
                      <span className="ob-chain-name">{chain}</span>
                      <span className={`ob-chain-check${sel ? " checked" : ""}`}>✓</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <RecipeCounter chains={selectedChains} />
          </div>
        </div>
      )}

      {/* Day picker modal */}
      {addingToPlan && (
        <div className="day-picker-overlay" onClick={e => e.target === e.currentTarget && setAddingToPlan(null)}>
          <div className="day-picker-card">
            <div className="sp-modal-header">
              <div>
                <h2 className="sp-title">{t("Vælg dag")}</h2>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-dim)" }}>{tr(addingToPlan.title)}</p>
              </div>
              <button className="sp-close-btn" onClick={() => setAddingToPlan(null)}>×</button>
            </div>
            <div className="day-picker-grid">
              {DAY_FULL.map((day, i) => {
                const occupied = mealPlan[i];
                return (
                  <button
                    key={i}
                    className={`day-picker-btn${occupied ? " occupied" : ""}`}
                    onClick={() => addToPlan(addingToPlan, i)}
                  >
                    <span className="day-picker-short">{DAY_SHORT[i]}</span>
                    <span className="day-picker-full">{day}</span>
                    {occupied && <span className="day-picker-recipe">{tr(occupied.recipe.title)}</span>}
                    {!occupied && <span className="day-picker-empty-label">{t("Ledig")}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* intentionally empty — pantry is now inline below filters */}

      {/* Slim app header */}
      <div className="app-hero">
        <div className="hero-topbar">
          <div className="hero-brand">
            <LogoIcon size={40} />
            <div className="hero-brand-text">
              <span className="hero-brand-name">Tilbudskokken</span>
              <span className="hero-brand-slogan">{t("Bedre tilbud. Bedre mad.")}</span>
            </div>
            <div className="week-badge">{weekBadge}</div>
          </div>
          {setupComplete && (
            <nav className="desktop-nav" aria-label={t("Hovednavigation")}>
              {[
                {
                  id: "opskrifter",
                  label: t("Opskrifter"),
                  active: !showMealPlanPanel && !showSavedPanel && !showShoppingSheet && !showPantryPanel && !selectedRecipe,
                  badge: null,
                  onClick: () => { setSelectedRecipe(null); setShowMealPlanPanel(false); setShowSavedPanel(false); setShowShoppingSheet(false); setShowPantryPanel(false); window.scrollTo({ top: 0, behavior: "smooth" }); },
                },
                {
                  id: "koleskab",
                  label: t("Køleskab"),
                  active: showPantryPanel,
                  badge: pantryItems.size > 0 ? pantryItems.size : null,
                  onClick: () => { setShowMealPlanPanel(false); setShowSavedPanel(false); setShowShoppingSheet(false); setShowPantryPanel(v => !v); },
                },
                {
                  id: "madplan",
                  label: t("Ugen"),
                  active: showMealPlanPanel,
                  badge: planCount > 0 ? planCount : null,
                  onClick: () => { setShowSavedPanel(false); setShowShoppingSheet(false); setShowPantryPanel(false); setShowMealPlanPanel(v => !v); },
                },
                {
                  id: "gemt",
                  label: t("Gemte"),
                  active: showSavedPanel,
                  badge: savedRecipes.length > 0 ? savedRecipes.length : null,
                  onClick: () => { setShowMealPlanPanel(false); setShowShoppingSheet(false); setShowPantryPanel(false); setShowSavedPanel(v => !v); },
                },
                {
                  id: "indkob",
                  label: t("Kurv"),
                  active: showShoppingSheet,
                  badge: shoppingList.length > 0 ? shoppingList.length : null,
                  onClick: () => { setShowMealPlanPanel(false); setShowSavedPanel(false); setShowPantryPanel(false); setShowShoppingSheet(v => !v); },
                },
              ].map(t => (
                <button key={t.id} className={`dnav-item${t.active ? " active" : ""}`} onClick={t.onClick}>
                  {t.label}
                  {t.badge != null && <span className="dnav-badge">{t.badge}</span>}
                </button>
              ))}
            </nav>
          )}
          <div className="hero-topbar-right">
            <div className="header-actions">
              <button className="header-icon-btn header-overflow-btn" onClick={() => setShowOverflowMenu(true)} title={t("Menu")} aria-label={t("Menu")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
                </svg>
              </button>
              <button
                className="header-icon-btn header-lang-btn header-icon-btn--desktop"
                onClick={() => changeLang(en ? "da" : "en")}
                title={en ? "Skift til dansk" : "Switch to English"}
                aria-label={en ? "Skift til dansk" : "Switch to English"}
              >
                {en ? "EN" : "DA"}
              </button>
              <button className="header-icon-btn header-icon-btn--desktop" onClick={() => setDarkMode(d => !d)} title={darkMode ? t("Lys tilstand") : t("Mørk tilstand")}>
                {darkMode ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                )}
              </button>
              <button className="header-icon-btn header-icon-btn--desktop" onClick={openSettings} title={t("Indstillinger")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {setupComplete && (
          <div className="local-store-badge" onClick={() => setShowStorePicker(true)} role="button" tabIndex={0} title={t("Administrer butikker")}>
            <span className="local-store-label">
              {localStores && localStores.length > 1
                ? <><strong>{localStores.length} {en ? "stores" : "butikker"}</strong> {en ? "selected" : "valgt"}</>
                : <><strong>{storeHeaderLabel(localStores)}</strong></>
              }
            </span>
            <button className="skift-btn" onClick={e => { e.stopPropagation(); setShowStorePicker(true); }}>{t("Skift")}</button>
          </div>
        )}
      </div>

      {/* ── Guided setup flow (new/no-store users) ──────────────── */}
      {!selectedRecipe && !setupComplete && (
        <>
          {/* Step progress bar */}
          <div className="setup-flow-progress">
            <span className={`sfp-step${selectedChains.size > 0 ? " sfp-step--done" : " sfp-step--active"}`}>
              {selectedChains.size > 0 ? "✓" : "1"} {t("Vælg butikker")}
            </span>
            <span className="sfp-sep">→</span>
            <span className={`sfp-step${selectedChains.size > 0 ? " sfp-step--active" : ""}`}>
              2 {t("Tilpas")}
            </span>
            <span className="sfp-sep">→</span>
            <span className={`sfp-step${selectedChains.size > 0 ? " sfp-step--active" : ""}`}>
              3 {t("Find opskrifter")}
            </span>
          </div>

          {/* Step 1: inline store picker */}
          <div className="setup-invite-card">
            <h2 className="setup-invite-title">{t("Hvilke butikker handler du i?")}</h2>
            <p className="setup-invite-sub">{t("Vælg dine kæder — vi finder de bedste opskrifter baseret på netop dine tilbud denne uge")}</p>
            <div className="ob-chain-grid setup-chain-grid">
              {CHAIN_ORDER.map(chain => {
                const sel = selectedChains.has(chain);
                return (
                  <button
                    key={chain}
                    className={`ob-chain-card${sel ? " selected" : ""}`}
                    onClick={() => toggleLocalChain(chain)}
                  >
                    <span className="chain-badge ob-chain-badge" style={getChainColor(chain) ? { '--chain-color': getChainColor(chain) } : undefined}></span>
                    <span className="ob-chain-name">{chain}</span>
                    <span className={`ob-chain-check${sel ? " checked" : ""}`}>✓</span>
                  </button>
                );
              })}
            </div>
            <RecipeCounter chains={selectedChains} />
          </div>
        </>
      )}

      {/* ── Search (always visible in browse mode) ──────────────── */}
      {!selectedRecipe && (
        <div className={`search-wrap${searchHidden ? " search-hidden" : ""}`}>
          <input
            className="search-input"
            type="text"
            placeholder={t("Søg opskrifter, ingredienser...")}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="search-clear" onClick={() => setSearch("")}>×</button>}
        </div>
      )}

      {/* Detail view */}
      {selectedRecipe ? (
        <div className="recipe-detail-sheet">
          <button className="back-btn" onClick={() => setSelectedRecipe(null)}>
            {t("← Tilbage til opskrifter")}
          </button>

          <div className="recipe-card">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h2 className="recipe-title" style={{ margin: 0 }}>{tr(selectedRecipe.title)}</h2>
                {selectedRecipe.subtitle && <p className="recipe-subtitle">{tr(selectedRecipe.subtitle)}</p>}
              </div>
              <div className="detail-actions detail-actions--inline" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {detailActionButtons}
              </div>
            </div>

            <div className="recipe-meta-bar">
              <span>{timeText(selectedRecipe.time)}</span>
              {selectedRecipe.cuisine && <span className="cuisine-badge-detail">{cuisineText(selectedRecipe.cuisine)}</span>}
              {selectedRecipe.difficulty && (
                <span className={`difficulty-badge difficulty-${selectedRecipe.difficulty === "Nem" ? "nem" : selectedRecipe.difficulty === "Avanceret" ? "avanceret" : "mellem"}`}>
                  {difficultyLabel(selectedRecipe.difficulty)}
                </span>
              )}
              {selectedRecipe.calories && <span className="calories-meta">{selectedRecipe.calories} kcal</span>}
              <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <button className="btn-round" onClick={() => setServings(s => Math.max(1, s - 1))}>−</button>
                {servings} {en ? (servings !== 1 ? "people" : "person") : "personer"}
                <button className="btn-round" onClick={() => setServings(s => Math.min(10, s + 1))}>+</button>
              </span>
            </div>
            {(() => {
              const pp = calcPricePerPerson(selectedRecipe);
              if (pp == null) return null;
              return (
                <div className="recipe-detail-price">
                  {en ? "approx." : "ca."} {pp * servings} kr. {en ? "total" : "i alt"}
                  <span className="recipe-detail-price-pp"> · {pp} kr. {en ? "per person" : "pr. person"}</span>
                </div>
              );
            })()}

            {selectedRecipe.description && (
              <p className="recipe-description">{tr(selectedRecipe.description)}</p>
            )}

            <div className="section-label">{t("Ingredienser")}</div>
            <ul className="ingredient-grid">
              {(selectedRecipe.ingredients || []).map((ing, i) => {
                const scaled = scaleIngredient(tr(ing.text || ing), selectedRecipe.servings_count || 4, servings);
                // Anything that isn't a pantry staple is shoppable (added to the
                // list + counted in the price). Only items with a store are an
                // actual weekly deal and get the chain tag.
                const isShoppable = !ing.isPantry;
                const isDeal = isShoppable && !!(ing.store);
                // Match normalized so the "+" flips to "✓" whether the item was
                // added via this button (stores the scaled/translated text) or via
                // the bulk "Til indkøb" button (stores the raw ingredient text).
                const scaledNorm = normCartText(scaled);
                const rawNorm = normCartText(ing.text || ing);
                const inList = shoppingList.some(it => {
                  const n = normCartText(it.text);
                  return n === scaledNorm || n === rawNorm;
                });
                return (
                  <li key={i} className={`ingredient-item${isShoppable ? " ingredient-deal" : " ingredient-pantry"}`}>
                    {isShoppable ? (
                      <button
                        className="ingredient-add-btn"
                        onClick={() => addToShoppingList(scaled, ing.store || null)}
                        disabled={inList}
                        style={{ background: inList ? "#d4ead4" : "#4a7050", color: inList ? "#3a6040" : "white" }}
                      >
                        {inList ? "✓" : "+"}
                      </button>
                    ) : (
                      <span className="ingredient-pantry-dot" />
                    )}
                    <span className={isShoppable ? "ingredient-deal-text" : "ingredient-pantry-text"}>
                      {scaled}{ing.price ? ` · ${ing.price}` : ""}
                    </span>
                    {isDeal && (
                      <span className="deal-chain-tag">{ing.store}</span>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="ingredient-legend">
              <span><span className="legend-dot deal" />{t("Købes · klik + for indkøbsliste (butiksmærke = på tilbud)")}</span>
              <span><span className="legend-dot pantry" />{t("Basisvare · salt, olie, krydderier m.m. du har hjemme")}</span>
            </div>

            <button className="section-label section-label-toggle" onClick={() => setStepsOpen(v => !v)} aria-expanded={stepsOpen}>
              <span>{t("Fremgangsmåde")}</span>
              <span className="section-label-count">{selectedRecipe.steps.length} {en ? "steps" : "trin"}</span>
              <svg className={`section-chevron${stepsOpen ? " open" : ""}`} width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 6 L8 10 L12 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {stepsOpen && (
              <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {selectedRecipe.steps.map((step, i) => (
                  <li key={i} className="step-item">
                    <span className="step-number">{i + 1}</span>
                    {tr(step)}
                  </li>
                ))}
              </ol>
            )}

            {(selectedRecipe.tips || selectedRecipe.tip) && (
              <div className="recipe-tips-block">
                <div className="recipe-tips-label">{t("Tips")}</div>
                {selectedRecipe.tips
                  ? selectedRecipe.tips.map((tp, i) => <p key={i} className="recipe-tip-item">{tr(tp)}</p>)
                  : <p className="recipe-tip-item">{tr(selectedRecipe.tip)}</p>
                }
              </div>
            )}
          </div>

          {/* Shopping list */}
          {shoppingList.length > 0 && (
            <div className="shopping-list-card">
              <div className="shopping-list-header">
                <div className="section-label" style={{ margin: 0 }}>
                  {shoppingList.length} {en ? (shoppingList.length === 1 ? "item" : "items") : (shoppingList.length === 1 ? "vare" : "varer")}
                  {cartCheckedCount > 0 && <span className="cart-progress"> · {cartCheckedCount} {en ? "done" : "klaret"}</span>}
                </div>
              </div>
              <div className="cart-groups">
                {renderCartGroups()}
              </div>
              {renderCartActions()}
            </div>
          )}
        </div>
      ) : (
        /* Browse view — only shown after at least one store is selected */
        setupComplete ? (
          <div className="recipes-section">

            {/* ── Mobile: condensed filter row (replaces quick-strip on small screens) ── */}
            <div className="mobile-filter-row">
              <button className="mfr-btn" onClick={() => setShowStorePicker(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <span>{[...new Set((localStores || []).map(s => s.chain))].length} {en ? "stores" : "butikker"}</span>
              </button>
              <button
                className={`mfr-btn mfr-filter-btn${showMobileFilters ? " open" : ""}`}
                onClick={() => setShowMobileFilters(v => !v)}
                aria-expanded={showMobileFilters}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/>
                </svg>
                <span>{en ? "Filters" : "Filtre"}</span>
                {activeFilterCount > 0 && <span className="mfr-filter-count">{activeFilterCount}</span>}
                <svg className={`mfr-chevron${showMobileFilters ? " open" : ""}`} width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M4 6 L8 10 L12 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* ── Quick diet + sort strip ─────────────────── */}
            <div className={`quick-strip-wrap${showMobileFilters ? " mobile-open" : ""}`}>
              <div className="quick-strip">
                <span className="quick-strip-sep">{t("Kost")}</span>
                {[
                  { val: "Alle", label: dietLabel("Alle") },
                  { val: "Vegetar", label: dietLabel("Vegetar") },
                  { val: "Veganer", label: dietLabel("Veganer") },
                  { val: "Glutenfri", label: dietLabel("Glutenfri") },
                  { val: "Mælkefri", label: dietLabel("Mælkefri") },
                ].map(f => (
                  <button
                    key={f.val}
                    className={`qs-pill${diet === f.val ? " active" : ""}`}
                    onClick={() => changeDiet(f.val)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              {Object.keys(popularityMap).length > 0 && (
                <div className="quick-strip quick-strip-more">
                  <button
                    className={`qs-pill qs-popular-pill${popularOnly ? " active" : ""}`}
                    onClick={() => setPopularOnly(v => !v)}
                    aria-pressed={popularOnly}
                  >
                    <span aria-hidden="true">★</span> {t("Populær")}
                  </button>
                </div>
              )}
              <div className="quick-strip quick-strip-sort">
                <span className="quick-strip-sep">{t("Sorter")}</span>
                {[
                  { id: "anbefalet", label: sortLabel("anbefalet", "Anbefalet") },
                  { id: "pris-asc",  label: sortLabel("pris-asc", "Billigst") },
                  { id: "hurtigst", label: sortLabel("hurtigst", "Hurtigst") },
                ].map(s => (
                  <button
                    key={s.id}
                    className={`qs-pill qs-sort-pill${sortOrder === s.id ? " active" : ""}`}
                    onClick={() => setSortOrder(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {/* Tid / Køkken inline pills — formerly only in the filter sheet. */}
              <div className="quick-strip quick-strip-more">
                <span className="quick-strip-sep">{t("Tid")}</span>
                {timeFilters.map(f => (
                  <button
                    key={f}
                    className={`qs-pill${timeFilter === f ? " active" : ""}`}
                    onClick={() => setTimeFilter(f)}
                  >
                    {timeLabel(f)}
                  </button>
                ))}
              </div>
              {CUISINE_ORDER.length > 2 && (
                <div className="quick-strip quick-strip-more">
                  <span className="quick-strip-sep">{t("Køkken")}</span>
                  {CUISINE_ORDER.map(c => (
                    <button
                      key={c}
                      className={`qs-pill${cuisineFilter === c ? " active" : ""}`}
                      onClick={() => setCuisineFilter(c)}
                    >
                      {cuisineText(c)}
                    </button>
                  ))}
                </div>
              )}
              {/* Butik toggle + rich controls (Pris / Køleskab) as dropdown pills.
                  Not a .quick-strip: its overflow must stay visible so the
                  dropdown panels aren't clipped by scroll/mask. */}
              <div className="quick-strip-more-row">
                <span className="quick-strip-sep">{t("Pris")}</span>
                {maxRecipePrice > 0 && (
                  <div className="qs-price-inline">
                    <span className={`price-range-display${priceFiltered ? " active" : ""}`}>
                      {priceMin}–{priceMax ?? maxRecipePrice} kr.
                      {priceFiltered && (
                        <button className="price-range-reset" onClick={() => { setPriceMin(0); setPriceMax(null); }}>×</button>
                      )}
                    </span>
                    <div className="price-range-track-wrap qs-price-track">
                      <div className="price-range-track-bg" />
                      <div className="price-range-fill" style={{ left: `${(priceMin / maxRecipePrice) * 100}%`, right: `${100 - ((priceMax ?? maxRecipePrice) / maxRecipePrice) * 100}%` }} />
                      <input type="range" className="price-range-input" min={0} max={maxRecipePrice} step={5} value={priceMin}
                        onChange={e => { const val = Math.min(Number(e.target.value), (priceMax ?? maxRecipePrice) - 10); setPriceMin(Math.max(0, val)); }} />
                      <input type="range" className="price-range-input" min={0} max={maxRecipePrice} step={5} value={priceMax ?? maxRecipePrice}
                        onChange={e => { const val = Math.max(Number(e.target.value), priceMin + 10); setPriceMax(val >= maxRecipePrice ? null : val); }} />
                    </div>
                  </div>
                )}
                {activeFilterCount > 0 && (
                  <button className="qs-clear-btn" onClick={clearAllFilters}>{t("Ryd filtre")}</button>
                )}
              </div>
              {/* Mobile-only: close the dropdown after choosing filters. */}
              <div className="qs-mobile-apply">
                <button className="qs-apply-btn" onClick={() => setShowMobileFilters(false)}>
                  {(() => {
                    const n = filteredRecommended.length + filteredOthers.length;
                    return en ? `Show ${n} recipe${n === 1 ? "" : "s"}` : `Vis ${n} opskrift${n === 1 ? "" : "er"}`;
                  })()}
                </button>
              </div>
            </div>

            <div className="recipe-browse-section">
              <div className="section-header-row">
                <button
                  className="section-toggle-btn"
                  onClick={() => toggleSection("recommended")}
                  aria-expanded={!collapsedSections.recommended}
                >
                  <span className="section-toggle-label">{search.trim() ? t("Søgeresultater") : t("Ugens opskrifter")}</span>
                  <span className="section-count-badge">{filteredRecommended.length} {en ? "recipes" : "opskrifter"}</span>
                  <svg
                    className={`section-chevron${collapsedSections.recommended ? "" : " open"}`}
                    width="16" height="16" viewBox="0 0 16 16" fill="none"
                    aria-hidden="true"
                  >
                    <path d="M4 6 L8 10 L12 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <div className={`section-body-wrap${collapsedSections.recommended ? " collapsed" : ""}`}>
                <div className="section-body-inner">
                  {filteredRecommended.length > 0 ? (
                    <>
                      <div className="recipe-browse-grid section-body-grid">
                        {renderRecipeGrid(filteredRecommended, "recommended")}
                      </div>
                      {filteredRecommended.length > visibleCounts.recommended && (
                        <button
                          className="show-more-btn"
                          onClick={() => setVisibleCounts(c => ({ ...c, recommended: c.recommended + PAGE_SIZE }))}
                        >
                          {en ? "Show more" : "Vis flere"} ({filteredRecommended.length - visibleCounts.recommended})
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="section-empty-state">
                      {(search || activeFilterCount > 0) ? (
                        <>
                          <span className="empty-state-label">{t("Ingen opskrifter matcher.")}</span>
                          <span className="empty-state-hint">
                            {search
                              ? t("Prøv et kortere søgeord eller nulstil filtrene")
                              : t("Dine filtre er for snævre lige nu")}
                          </span>
                          {activeFilterCount > 0 && (
                            <button className="empty-state-reset" onClick={clearAllFilters}>{t("Ryd filtre")}</button>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="empty-state-label">{t("Ingen opskrifter denne uge.")}</span>
                          <span className="empty-state-hint">{t("Tilføj en ekstra butik under filtre")}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="recipe-browse-section">
              <div className="section-header-row">
                <button
                  className="section-toggle-btn"
                  onClick={() => toggleSection("others")}
                  aria-expanded={!collapsedSections.others}
                >
                  <span className="section-toggle-label">{t("Andre butikker")}</span>
                  <span className="section-count-badge">{filteredOthers.length} {en ? "recipes" : "opskrifter"}</span>
                  <svg
                    className={`section-chevron${collapsedSections.others ? "" : " open"}`}
                    width="16" height="16" viewBox="0 0 16 16" fill="none"
                    aria-hidden="true"
                  >
                    <path d="M4 6 L8 10 L12 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <div className={`section-body-wrap${collapsedSections.others ? " collapsed" : ""}`}>
                <div className="section-body-inner">
                  {filteredOthers.length > 0 ? (
                    <>
                      <div className="recipe-browse-grid section-body-grid">
                        {renderRecipeGrid(filteredOthers, "others")}
                      </div>
                      {filteredOthers.length > visibleCounts.others && (
                        <button
                          className="show-more-btn"
                          onClick={() => setVisibleCounts(c => ({ ...c, others: c.others + PAGE_SIZE }))}
                        >
                          {en ? "Show more" : "Vis flere"} ({filteredOthers.length - visibleCounts.others})
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="section-empty-state">
                      <span className="empty-state-label">{t("Alle opskrifter er fra dine butikker.")}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null
      )}


    </div>

  {/* Mobile docked recipe-detail action bar.
      Portaled to <body> so position:fixed is relative to the viewport and the
      bar stays pinned to the bottom while the recipe sheet scrolls. Hidden on
      desktop via CSS (the inline .detail-actions--inline bar is used there). */}
  {selectedRecipe && createPortal(
    <div className="detail-actions detail-actions--dock">{detailActionButtons}</div>,
    document.body
  )}

  {/* Mobile meal plan bottom sheet */}
  {showMealPlanPanel && (
    <div className="mp-sheet-overlay" onClick={() => setShowMealPlanPanel(false)}>
      <div className="mp-sheet" onClick={e => e.stopPropagation()}>
        <div className="mp-sheet-drag-handle" />
        <div className="mp-sheet-header">
          <div className="mp-sheet-title">{t("Madplan")}</div>
          <button className="mp-sheet-close" onClick={() => setShowMealPlanPanel(false)}>×</button>
        </div>
        <div className="mp-days-list">
          {mealPlan.map((entry, i) => (
            <div key={i} className={`mp-sheet-day${entry ? " filled" : " empty"}`}>
              <div className="mp-sheet-day-name">{DAY_FULL[i]}</div>
              {entry ? (
                <div className="mp-sheet-day-content">
                  <RecipeMonogram recipe={entry.recipe} className="mp-sheet-emoji" />
                  <div className="mp-sheet-recipe-info">
                    <div className="mp-sheet-recipe-title">{tr(entry.recipe.title)}</div>
                    <div className="mp-sheet-recipe-meta">⏱ {timeText(entry.recipe.time)} · {entry.servings} {en ? "ppl" : "pers."}</div>
                  </div>
                  <button className="mp-sheet-remove" onClick={() => removeFromPlan(i)}>×</button>
                </div>
              ) : (
                <div className="mp-sheet-empty">{t("Ingen opskrift planlagt")}</div>
              )}
            </div>
          ))}
        </div>
        {planCount > 0 && (
          <div className="mp-sheet-actions">
            <button className={`share-plan-btn${planCopied ? " copied" : ""}`} onClick={shareMealPlan}>
              {planCopied ? t("✓ Kopieret!") : t("Del madplan")}
            </button>
            <button className="combined-list-btn" onClick={() => setShowCombinedList(v => !v)}>
              {showCombinedList ? t("Skjul indkøbsliste") : t("Vis indkøbsliste")}
            </button>
          </div>
        )}
        {confirmClearPlan ? (
          <div className="mp-clear-confirm">
            <span>{t("Ryd hele madplanen?")}</span>
            <div className="mp-clear-confirm-btns">
              <button className="mp-clear-yes" onClick={clearMealPlan}>{t("Ja, ryd")}</button>
              <button className="mp-clear-no" onClick={() => setConfirmClearPlan(false)}>{t("Annuller")}</button>
            </div>
          </div>
        ) : (
          <button className="mp-clear-btn" onClick={() => setConfirmClearPlan(true)} style={{ marginTop: 8 }}>{t("Ryd madplan")}</button>
        )}
        {showCombinedList && planCount > 0 && (
          <div className="combined-list">
            {combinedList.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>{t("Ingen tilbudsvarer i madplanen.")}</p>
            ) : (
              combinedList.map(group => (
                <div key={group.store} className="combined-list-store">
                  <div className="combined-list-store-label">
                    <span className="chain-badge" style={getChainColor(group.store) ? { '--chain-color': getChainColor(group.store) } : undefined}></span>
                    {group.store}
                  </div>
                  <ul className="combined-list-items">
                    {group.items.map(it => (
                      <li key={it.dealItem} className="combined-list-item">
                        <span className="shopping-item-dot" />
                        {it.merged}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )}

    {/* Mobile FAB */}
    {planCount > 0 && (
      <button className="meal-plan-fab" onClick={() => setShowMealPlanPanel(true)} aria-label={t("Vis madplan")}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span className="mp-fab-badge">{planCount}</span>
      </button>
    )}

    {/* Desktop sidebar — collapsed to an edge tab when hidden */}
    {planCount > 0 && mpSidebarHidden && (
      <button className="mp-sidebar-reveal" onClick={toggleMpSidebar} title={t("Vis madplan")} aria-label={t("Vis madplan")}>
        <span className="mp-sidebar-reveal-chevron">‹</span>
        <span className="mp-sidebar-reveal-label">{t("Madplan")}</span>
        <span className="mp-sidebar-reveal-count">{planCount}</span>
      </button>
    )}
    {planCount > 0 && !mpSidebarHidden && <aside className="meal-plan-sidebar">
      <div className="mp-sidebar-header">
        <button className="mp-sidebar-hide" onClick={toggleMpSidebar} title={t("Skjul madplan")} aria-label={t("Skjul madplan")}>›</button>
        <div className="mp-sidebar-title">{t("Madplan")}</div>
        {planCount > 0 && <span className="mp-sidebar-count">{planCount}/7</span>}
      </div>
      <div className="mp-sidebar-days">
        {mealPlan.map((entry, i) => (
          <div key={i}
            className={`mp-sidebar-day${entry ? " filled" : " empty"}${dragFromDay === i ? " dragging" : ""}`}
            draggable={!!entry}
            onDragStart={() => setDragFromDay(i)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDayDrop(i)}
            onDragEnd={() => setDragFromDay(null)}
          >
            <div className="mp-sidebar-day-name">{DAY_SHORT[i]}</div>
            {entry ? (
              <div className="mp-sidebar-day-content">
                <RecipeMonogram recipe={entry.recipe} className="mp-sidebar-emoji" />
                <div className="mp-sidebar-recipe-info">
                  <div className="mp-sidebar-recipe-title">{tr(entry.recipe.title)}</div>
                  <div className="mp-sidebar-servings">
                    <button className="plan-sv-btn" onClick={() => setPlanServings(i, Math.max(1, entry.servings - 1))}>−</button>
                    <span>{entry.servings}p</span>
                    <button className="plan-sv-btn" onClick={() => setPlanServings(i, Math.min(10, entry.servings + 1))}>+</button>
                  </div>
                </div>
                <button className="mp-sidebar-remove" onClick={() => removeFromPlan(i)} title={t("Fjern")}>×</button>
              </div>
            ) : (
              <div className="mp-sidebar-empty">
                <span className="mp-sidebar-plus">+</span>
                <span className="mp-sidebar-empty-text">{t("Ledig")}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mp-sidebar-footer">
        <button className={`share-plan-btn${planCopied ? " copied" : ""}`} onClick={shareMealPlan} style={{ width: "100%" }}>
          {planCopied ? t("✓ Kopieret!") : t("Del madplan")}
        </button>
        <button className="combined-list-btn" onClick={() => setShowCombinedList(v => !v)} style={{ width: "100%" }}>
          {showCombinedList ? t("Skjul indkøbsliste") : t("Vis indkøbsliste")}
        </button>
        {confirmClearPlan ? (
          <div className="mp-clear-confirm">
            <span>{t("Ryd hele madplanen?")}</span>
            <div className="mp-clear-confirm-btns">
              <button className="mp-clear-yes" onClick={clearMealPlan}>{t("Ja, ryd")}</button>
              <button className="mp-clear-no" onClick={() => setConfirmClearPlan(false)}>{t("Annuller")}</button>
            </div>
          </div>
        ) : (
          <button className="mp-clear-btn" onClick={() => setConfirmClearPlan(true)}>{t("Ryd madplan")}</button>
        )}
      </div>
      {showCombinedList && planCount > 0 && (
        <div className="combined-list" style={{ marginTop: 12 }}>
          {combinedList.length === 0 ? (
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>{t("Ingen tilbudsvarer i madplanen.")}</p>
          ) : (
            combinedList.map(group => (
              <div key={group.store} className="combined-list-store">
                <div className="combined-list-store-label">
                  <span className="chain-badge" style={getChainColor(group.store) ? { '--chain-color': getChainColor(group.store) } : undefined}></span>
                  {group.store}
                </div>
                <ul className="combined-list-items">
                  {group.items.map(it => (
                    <li key={it.dealItem} className="combined-list-item">
                      <span className="shopping-item-dot" />
                      {it.merged}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
    </aside>}

  {/* Shopping cart FAB — hidden whenever meal plan is active (sidebar or panel)
      or any sheet/modal is open (so it can't overlap sheet content). */}
  {shoppingList.length > 0 && planCount === 0 && !anyModalOpen && (
    <button className="shopping-cart-fab" onClick={() => setShowShoppingSheet(true)} aria-label={t("Indkøbsliste")}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      <span className="cart-fab-badge">{shoppingList.length}</span>
    </button>
  )}

  {/* Saved recipes panel */}
  {showSavedPanel && (
    <div className="mp-sheet-overlay" onClick={() => setShowSavedPanel(false)}>
      <div className="saved-sheet" ref={setSavedPanelEl} onClick={e => e.stopPropagation()}>
        <div className="mp-sheet-drag-handle" />
        <div className="shopping-sheet-header">
          <div className="shopping-sheet-title">{t("Gemte opskrifter")}</div>
          <button className="mp-sheet-close" onClick={() => setShowSavedPanel(false)}>×</button>
        </div>
        {savedRecipes.length === 0 ? (
          <div className="saved-sheet-empty">
            {t("Du har ikke gemt nogen opskrifter endnu — tryk på bogmærke-ikonet på en opskrift for at gemme den")}
          </div>
        ) : (
          <>
            <div className="saved-sheet-list">
              {savedRecipes.map(r => (
                <div
                  key={r.savedAt}
                  className="saved-sheet-card"
                  onClick={() => { setShowSavedPanel(false); selectRecipe(r); }}
                >
                  <div className="saved-sheet-card-info">
                    <div className="saved-sheet-card-title"><RecipeMonogram recipe={r} className="saved-sheet-mono" /><span className="saved-sheet-title-text">{tr(r.title)}</span></div>
                    <div className="saved-sheet-card-meta">{timeText(r.time)} · {r.savedServings || r.servings_count || 4} {en ? "ppl" : "pers."}</div>
                  </div>
                  <button
                    className="saved-sheet-unsave"
                    onClick={e => { e.stopPropagation(); deleteSavedRecipe(r.savedAt); }}
                    title={t("Fjern fra gemte")}
                  >×</button>
                </div>
              ))}
            </div>
            <div className="saved-sheet-footer">
              <button
                className="saved-shoplist-btn"
                onClick={() => {
                  const added = addAllSavedToShoppingList();
                  if (added > 0) {
                    setShowSavedPanel(false);
                    setShowShoppingSheet(true);
                  }
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                {t("Tilføj alle til indkøbsliste")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )}

  {/* Køleskab (pantry) bottom sheet — a first-class nav destination like the cart
      and meal plan, not a filter. Adding ingredients re-ranks the recipe list so
      recipes you can cook now float to the top. */}
  {showPantryPanel && (
    <div className="mp-sheet-overlay" onClick={() => setShowPantryPanel(false)}>
      <div className="shopping-sheet" onClick={e => e.stopPropagation()}>
        <div className="mp-sheet-drag-handle" />
        <div className="shopping-sheet-header">
          <div className="shopping-sheet-title">
            {t("Køleskab")}
            <span className="shopping-sheet-sub">
              {pantryItems.size > 0
                ? (en ? `${pantryMatchTotal} recipes match — shown first` : `${pantryMatchTotal} opskrifter matcher — vist øverst`)
                : t("Tilføj ingredienser du har — vi rykker opskrifter du kan lave nu øverst")}
            </span>
          </div>
          <button className="mp-sheet-close" onClick={() => setShowPantryPanel(false)} aria-label={t("Luk")}>×</button>
        </div>
        <div className="pantry-sheet-body">
          {renderPantryBody()}
        </div>
      </div>
    </div>
  )}

  {/* Shopping list bottom sheet */}
  {showShoppingSheet && (
    <div className="mp-sheet-overlay" onClick={() => setShowShoppingSheet(false)}>
      <div className="shopping-sheet" ref={setShoppingSheetEl} onClick={e => e.stopPropagation()}>
        <div className="mp-sheet-drag-handle" />
        <div className="shopping-sheet-header">
          <div className="shopping-sheet-title">
            {t("Indkøbsliste")}
            {shoppingList.length > 0 && (
              <span className="shopping-sheet-sub">
                {shoppingList.length} {en ? (shoppingList.length === 1 ? "item" : "items") : (shoppingList.length === 1 ? "vare" : "varer")}
                {cartCheckedCount > 0 && ` · ${cartCheckedCount} ${en ? "done" : "klaret"}`}
              </span>
            )}
          </div>
          <button className="mp-sheet-close" onClick={() => setShowShoppingSheet(false)}>×</button>
        </div>
        {shoppingList.length === 0 ? (
          <div className="saved-sheet-empty">
            {t("Din indkøbsliste er tom endnu — åbn en opskrift og tryk “Til indkøb” for at samle ingredienserne her.")}
          </div>
        ) : (
          <>
            <div className="cart-groups shopping-sheet-groups">
              {renderCartGroups()}
            </div>
            {renderCartActions()}
          </>
        )}
      </div>
    </div>
  )}

  {/* ── Mobile bottom navigation ─────────────────────────────────── */}
  {setupComplete && onboardingStep === null && (
    <nav className="mobile-bottom-nav" aria-label={t("Navigation")}>
      {[
        {
          id: "opskrifter",
          label: t("Opskrifter"),
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M3 12h18M3 18h11"/>
            </svg>
          ),
          active: !showMealPlanPanel && !showSavedPanel && !showShoppingSheet && !showPantryPanel,
          badge: null,
          onClick: () => { setShowMealPlanPanel(false); setShowSavedPanel(false); setShowShoppingSheet(false); setShowPantryPanel(false); window.scrollTo({ top: 0, behavior: "smooth" }); },
        },
        {
          id: "koleskab",
          label: t("Køleskab"),
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          ),
          active: showPantryPanel,
          badge: pantryItems.size > 0 ? pantryItems.size : null,
          onClick: () => { setShowMealPlanPanel(false); setShowSavedPanel(false); setShowShoppingSheet(false); setShowPantryPanel(v => !v); },
        },
        {
          id: "madplan",
          label: t("Ugen"),
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          ),
          active: showMealPlanPanel,
          badge: planCount > 0 ? planCount : null,
          onClick: () => { setShowSavedPanel(false); setShowShoppingSheet(false); setShowPantryPanel(false); setShowMealPlanPanel(v => !v); },
        },
        {
          id: "gemt",
          label: t("Gemt"),
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          ),
          active: showSavedPanel,
          badge: savedRecipes.length > 0 ? savedRecipes.length : null,
          onClick: () => { setShowMealPlanPanel(false); setShowShoppingSheet(false); setShowPantryPanel(false); setShowSavedPanel(v => !v); },
        },
        {
          id: "indkob",
          label: t("Kurv"),
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          ),
          active: showShoppingSheet,
          badge: shoppingList.length > 0 ? shoppingList.length : null,
          onClick: () => { setShowMealPlanPanel(false); setShowSavedPanel(false); setShowPantryPanel(false); setShowShoppingSheet(v => !v); },
        },
      ].map(tab => (
        <button key={tab.id} className={`bnav-item${tab.active ? " active" : ""}`} onClick={tab.onClick} aria-label={tab.label}>
          <span className="bnav-icon">
            {tab.icon}
            {tab.badge != null && <span className="bnav-badge">{tab.badge}</span>}
          </span>
          <span className="bnav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )}

  {/* ── Feedback button ───────────────────────────────────────────────
      Hidden while any sheet/modal is open so it can never render on top of
      (and steal clicks from) an open sheet — this is what made "Start forfra"
      appear to open the feedback survey (QA bug #7). Raised above the cart FAB
      when both are visible so the cart badge stays clear (QA bug #2). */}
  {!anyModalOpen && (
  <button
    className={`fb-fab${(shoppingList.length > 0 && planCount === 0) ? " fb-fab--raised" : ""}`}
    onClick={openFeedback}
    aria-label={t("Giv feedback")}
    title={t("Giv feedback")}
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <span className="fb-fab-label">{t("Feedback")}</span>
  </button>
  )}

  {/* ── Feedback panel ────────────────────────────────────────────── */}
  {showFeedbackPanel && (
    <div className="fb-overlay" onClick={() => setShowFeedbackPanel(false)}>
      <div className="fb-panel" onClick={e => e.stopPropagation()}>
        <div className="fb-panel-drag-handle" />
        <div className="fb-panel-header">
          <span className="fb-panel-title">{t("Din mening tæller")}</span>
          <button className="fb-panel-close" onClick={() => setShowFeedbackPanel(false)} aria-label={t("Luk")}>×</button>
        </div>

        {feedbackSubmitted ? (
          <div className="fb-submitted">
            <div className="fb-submitted-icon">✓</div>
            <div className="fb-submitted-text">{t("Tak for din feedback!")}</div>
          </div>
        ) : (
          <div className="fb-form">
            {/* ─ Ratings ─ */}
            <div className="fb-field">
              <label className="fb-label">{t("Hvor let var det at finde en opskrift?")}</label>
              <StarRating value={feedbackForm.findRecipe} onChange={v => setFeedbackForm(f => ({...f, findRecipe: v}))} />
            </div>
            <div className="fb-field">
              <label className="fb-label">{t("Hvordan vil du vurdere det overordnede design?")}</label>
              <StarRating value={feedbackForm.design} onChange={v => setFeedbackForm(f => ({...f, design: v}))} />
            </div>
            <div className="fb-field">
              <label className="fb-label">{t("Hvor sandsynligt er det at du bruger appen til din ugentlige indkøbstur?")}</label>
              <StarRating value={feedbackForm.likelihood} onChange={v => setFeedbackForm(f => ({...f, likelihood: v}))} />
            </div>

            {/* ─ Bug toggle ─ */}
            <div className="fb-field fb-field-row">
              <label className="fb-label">{t("Stødte du på fejl eller forvirrende øjeblikke?")}</label>
              <div className="fb-toggle-row">
                {["Ja", "Nej"].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    className={`fb-toggle-btn${feedbackForm.hadBugs === (opt === "Ja") ? " active" : ""}`}
                    onClick={() => setFeedbackForm(f => ({...f, hadBugs: opt === "Ja"}))}
                  >{t(opt)}</button>
                ))}
              </div>
            </div>

            <div className="fb-divider" />

            {/* ─ Usage questions ─ */}
            <div className="fb-field">
              <label className="fb-label">{t("Hvornår ville du oftest bruge appen?")}</label>
              <div className="fb-chips">
                {["Inden indkøb", "Ugentlig madplan", "Inspiration", "Andet"].map(opt => (
                  <button key={opt} type="button"
                    className={`fb-chip${feedbackForm.when === opt ? " active" : ""}`}
                    onClick={() => setFeedbackForm(f => ({...f, when: f.when === opt ? "" : opt}))}
                  >{t(opt)}</button>
                ))}
              </div>
            </div>

            <div className="fb-field">
              <label className="fb-label">{t("Hvilken butik handler du normalt i?")}</label>
              <div className="fb-chips">
                {["Rema 1000", "Netto", "Coop 365", "En blanding", "Andet"].map(opt => (
                  <button key={opt} type="button"
                    className={`fb-chip${feedbackForm.store === opt ? " active" : ""}`}
                    onClick={() => setFeedbackForm(f => ({...f, store: f.store === opt ? "" : opt}))}
                  >{t(opt)}</button>
                ))}
              </div>
            </div>

            <div className="fb-field">
              <label className="fb-label">{t("Ville du bruge denne i stedet for — eller sideløbende med — din normale metode?")}</label>
              <div className="fb-chips">
                {["I stedet for", "Sideløbende", "Ville nok ikke bruge den"].map(opt => (
                  <button key={opt} type="button"
                    className={`fb-chip${feedbackForm.replace === opt ? " active" : ""}`}
                    onClick={() => setFeedbackForm(f => ({...f, replace: f.replace === opt ? "" : opt}))}
                  >{t(opt)}</button>
                ))}
              </div>
            </div>

            <div className="fb-field">
              <label className="fb-label">{t("Hvor tit tror du, du ville bruge appen?")}</label>
              <div className="fb-chips">
                {["Dagligt", "Ugentligt", "Et par gange om måneden", "Sjældent"].map(opt => (
                  <button key={opt} type="button"
                    className={`fb-chip${feedbackForm.frequency === opt ? " active" : ""}`}
                    onClick={() => setFeedbackForm(f => ({...f, frequency: f.frequency === opt ? "" : opt}))}
                  >{t(opt)}</button>
                ))}
              </div>
            </div>

            <div className="fb-field">
              <label className="fb-label">{t("Hvilke af disse lagde du mærke til eller brugte?")} <span className="fb-label-sub">{t("(vælg alle der passer)")}</span></label>
              <div className="fb-chips">
                {["Butikfiltrering", "Pris per person", "Indkøbsliste", "Gemte opskrifter", "Ingen af disse"].map(opt => {
                  const checked = feedbackForm.noticed.includes(opt);
                  return (
                    <button key={opt} type="button"
                      className={`fb-chip${checked ? " active" : ""}`}
                      onClick={() => setFeedbackForm(f => ({
                        ...f,
                        noticed: checked
                          ? f.noticed.filter(x => x !== opt)
                          : [...f.noticed, opt],
                      }))}
                    >{t(opt)}</button>
                  );
                })}
              </div>
            </div>

            <div className="fb-divider" />

            {/* ─ Open text ─ */}
            <div className="fb-field">
              <label className="fb-label">{t("Hvad mangler der for at du ville bruge den regelmæssigt?")}</label>
              <textarea
                className="fb-textarea"
                rows={2}
                placeholder={t("Fx en funktion, integration, noget der mangler…")}
                value={feedbackForm.whatsMissing}
                onChange={e => setFeedbackForm(f => ({...f, whatsMissing: e.target.value}))}
              />
            </div>

            <div className="fb-field">
              <label className="fb-label">{t("Kommentarer eller fejl du stødte på")}</label>
              <textarea
                className="fb-textarea"
                rows={2}
                placeholder={t("Beskriv hvad der skete og hvornår…")}
                value={feedbackForm.comments}
                onChange={e => setFeedbackForm(f => ({...f, comments: e.target.value}))}
              />
            </div>

            <button
              className="fb-submit-btn"
              onClick={submitFeedback}
              disabled={!feedbackForm.findRecipe && !feedbackForm.design && !feedbackForm.likelihood}
            >
              {t("Send feedback")}
            </button>
            <p className="fb-anon-note">{t("Anonym — ingen persondata gemmes")}</p>
          </div>
        )}
      </div>
    </div>
  )}

  {/* ── Overflow menu bottom sheet (mobile) ─────────────────────── */}
  {showOverflowMenu && (
    <div className="mp-sheet-overlay" onClick={() => setShowOverflowMenu(false)}>
      <div className="overflow-menu-sheet" onClick={e => e.stopPropagation()}>
        <div className="mp-sheet-drag-handle" />
        <div className="overflow-menu-lang">
          <span className="overflow-menu-lang-label">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            {t("Sprog")}
          </span>
          <div className="overflow-menu-lang-toggle" role="group" aria-label={t("Sprog")}>
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                type="button"
                className={`ovm-lang-btn${lang === l.code ? " active" : ""}`}
                aria-pressed={lang === l.code}
                onClick={() => changeLang(l.code)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <button className="overflow-menu-item" onClick={() => { setDarkMode(d => !d); setShowOverflowMenu(false); }}>
          {darkMode ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
          <span>{darkMode ? t("Lys tilstand") : t("Mørk tilstand")}</span>
        </button>
        <button className="overflow-menu-item" onClick={() => { openSettings(); setShowOverflowMenu(false); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <span>{t("Indstillinger")}</span>
        </button>
      </div>
    </div>
  )}


  {showInstallBanner && (
    <div className="install-banner">
      <div className="install-banner-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2v13M7 11l5 5 5-5"/><rect x="3" y="18" width="18" height="3" rx="1.5"/>
        </svg>
      </div>
      <div className="install-banner-text">
        <strong>{t("Tilføj til hjemmeskærm")}</strong>
        <span>{t("Åbn Tilbudskokken som en app")}</span>
      </div>
      <button className="install-banner-cta" onClick={triggerInstall}>{t("Tilføj")}</button>
      <button className="install-banner-dismiss" onClick={dismissInstall} aria-label={t("Luk")}>×</button>
    </div>
  )}

    </>
  );
}
