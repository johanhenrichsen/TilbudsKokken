import { useState, useEffect, useRef, useMemo } from "react";
import "./App.css";
import { recipeBank as staticRecipes } from "./recipes";
import weeklyRecipesJson from "./data/weeklyRecipes.json";
const recipeBank = weeklyRecipesJson.length > 0 ? weeklyRecipesJson : staticRecipes;
const recipeIndexMap = new Map(recipeBank.map((r, i) => [r.id, i]));
import LogoIcon from "./LogoIcon";
import LogoFull from "./LogoFull";

const CHAIN_COLORS = {
  // Salling Group
  "Netto":                    "#FFD700",
  "Føtex":                    "#0052A5",
  "Bilka":                    "#E30613",
  // Rema
  "Rema 1000":                "#CC0000",
  // Coop
  "Coop 365":                 "#00853F",
  "Coop 365discount":         "#00853F",
  "SuperBrugsen / Kvickly":   "#FF6B00",
  "Dagli'Brugsen / Brugsen":  "#8B1A1A",
  // Independent
  "Meny":                     "#1A1A2E",
  "Spar":                     "#E8A000",
  "Eurospar":                 "#006400",
  // International discounters
  "Lidl":                     "#0050AA",
  "Aldi":                     "#004B9B",
  // Legacy / closed (kept for data compatibility)
  "Fakta":                    "#D40000",
  "Irma":                     "#9B1B30",
};

// Normalized lookup so "Coop 365discount" and "coop 365discount" both resolve.
const _CHAIN_COLORS_NORM = new Map(
  Object.entries(CHAIN_COLORS).map(([k, v]) => [k.toLowerCase().trim(), v])
);
const _LIGHT_CHAINS = new Set(["netto", "spar"]);
function getChainColor(store) {
  return store ? (_CHAIN_COLORS_NORM.get(store.toLowerCase().trim()) ?? "#888") : "#888";
}
function chainIsLight(store) {
  return store ? _LIGHT_CHAINS.has(store.toLowerCase().trim()) : false;
}

const CHAIN_ORDER = [
  // Salling Group
  "Netto", "Føtex", "Bilka",
  // Rema
  "Rema 1000",
  // Coop
  "Coop 365", "SuperBrugsen / Kvickly", "Dagli'Brugsen / Brugsen",
  // Independent
  "Meny", "Spar", "Eurospar",
  // International discounters
  "Lidl", "Aldi",
  // Legacy
  "Fakta", "Irma",
];

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

const PANTRY_CATEGORIES = [
  {
    id: "koed", label: "🥩 Kød & fisk",
    items: ["Hakket oksekød", "Kyllingefilet", "Kylling", "Laks", "Rejer", "Tun", "Æg", "Bacon"],
  },
  {
    id: "groent", label: "🥦 Grøntsager",
    items: ["Løg", "Hvidløg", "Gulerødder", "Kartofler", "Tomater", "Peberfrugt", "Spinat", "Broccoli", "Squash", "Champignon", "Selleri", "Porrer"],
  },
  {
    id: "mejeri", label: "🧀 Mejeri",
    items: ["Smør", "Mælk", "Fløde", "Ost", "Mozzarella", "Yoghurt", "Creme fraiche", "Parmesan"],
  },
  {
    id: "toervarer", label: "🍝 Tørvarer",
    items: ["Pasta", "Ris", "Mel", "Dåsetomater", "Bouillon", "Olivenolie", "Sojasauce", "Kokosmælk", "Brødkrummer", "Linser"],
  },
  {
    id: "krydderier", label: "🫙 Krydderier",
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
  // Strip leading quantity from deal ingredient text for autocomplete
  for (const r of recipeBank) {
    for (const ing of (r.ingredients || [])) {
      if (!ing.isPantry && ing.store) {
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
  for (const di of (recipe.dealItems || [])) {
    const m = String(di.price || '').match(/(\d+(?:[.,]\d+)?)/);
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

const CARD_SV_OPTIONS = [2, 4, 6];

function RecipeCard({ r, inPlan, isSaved, isPopular, availableNames, onSelect, onAddToPlan, onToggleSave }) {
  const [photoUrl, setPhotoUrl] = useState(() => localStorage.getItem(`photo_${r.id}`) || null);
  const [photoLoading, setPhotoLoading] = useState(() => {
    return !localStorage.getItem(`photo_${r.id}`) && !localStorage.getItem(`photo_fail_${r.id}`);
  });
  const [cardServings, setCardServings] = useState(() => {
    const saved = parseInt(localStorage.getItem('defaultServings')) || r.servings_count || 4;
    return CARD_SV_OPTIONS.reduce((a, b) => Math.abs(b - saved) < Math.abs(a - saved) ? b : a);
  });

  useEffect(() => {
    if (localStorage.getItem(`photo_fail_${r.id}`)) { setPhotoLoading(false); return; }
    const cached = localStorage.getItem(`photo_${r.id}`);
    if (cached) { setPhotoUrl(cached); setPhotoLoading(false); return; }
    setPhotoLoading(true);
    fetch(`/api/pexels?query=${encodeURIComponent(r.title + ' food dish')}`)
      .then(res => res.json())
      .then(data => {
        const url = data?.url;
        if (url) {
          localStorage.setItem(`photo_${r.id}`, url);
          setPhotoUrl(url);
        } else {
          localStorage.setItem(`photo_fail_${r.id}`, '1');
        }
        setPhotoLoading(false);
      })
      .catch(() => {
        localStorage.setItem(`photo_fail_${r.id}`, '1');
        setPhotoLoading(false);
      });
  }, [r.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const basePp = calcPricePerPerson(r);
  const totalPrice = basePp != null ? Math.round(basePp * cardServings) : null;

  return (
    <div
      className={`recipe-browse-card${r.fullyMatched ? " featured" : ""}`}
      onClick={() => onSelect(r)}
    >
      <div className="card-photo-wrap">
        {photoLoading
          ? <div className="card-photo-skeleton" />
          : photoUrl
            ? <img className="card-photo" src={photoUrl} alt="" loading="lazy"
                onError={() => { setPhotoUrl(null); localStorage.removeItem(`photo_${r.id}`); }} />
            : <div className="card-photo-placeholder"><span>{r.emoji}</span></div>
        }
        <div className="card-photo-gradient" />
        <div className="recipe-category-tag card-photo-tag">{r.emoji} {r.category}</div>
        {isPopular && (
          <div className="card-photo-badge">
            <span className="popular-badge-pill">🔥 Populær</span>
          </div>
        )}
      </div>
      <div className="card-body">
        <div className="recipe-browse-title">{r.title}</div>
        <div className="recipe-browse-meta">
          <span>⏱ {r.time}</span>
          <span>🥘 {(r.ingredients || []).length} ing.</span>
        </div>

        {/* Serving selector + price */}
        <div className="card-servings-row" onClick={e => e.stopPropagation()}>
          <span className="card-sv-label">👥</span>
          {CARD_SV_OPTIONS.map(n => (
            <button
              key={n}
              className={`card-sv-btn${cardServings === n ? ' active' : ''}`}
              onClick={e => { e.stopPropagation(); setCardServings(n); }}
            >
              {n}
            </button>
          ))}
          {totalPrice != null && (
            <span className="card-sv-price">≈ {totalPrice} kr.</span>
          )}
        </div>

        <div className="recipe-deal-tags">
          {(r.dealItems || []).slice(0, 3).map(di => {
            const available = availableNames.has(di.name);
            return (
              <span
                key={di.name}
                className={`deal-item-tag${available ? " available" : " unavailable"}`}
              >
                <span className="deal-store-dot" style={{ background: getChainColor(di.store) }} />
                {di.name.replace(/ \d+.*$/, "")}
              </span>
            );
          })}
          {(r.dealItems || []).length > 3 && (
            <span className="deal-item-overflow">og {(r.dealItems || []).length - 3} mere</span>
          )}
        </div>
        <div className="card-action-row">
          <button
            className={`add-to-plan-btn${inPlan ? " in-plan" : ""}`}
            onClick={e => { e.stopPropagation(); if (!inPlan) onAddToPlan(r); }}
            title={inPlan ? "Allerede på ugeplanen" : "Sæt på ugeplanen"}
          >
            {inPlan ? "📅 På ugeplanen" : "📅 Sæt på ugeplanen"}
          </button>
          <button
            className={`card-save-btn${isSaved ? " saved" : ""}`}
            onClick={e => { e.stopPropagation(); onToggleSave(r); }}
            title={isSaved ? "Fjern fra gemte" : "Gem til senere"}
          >🔖</button>
        </div>
      </div>
    </div>
  );
}

function countRecipesForChains(chains) {
  if (chains.size === 0) return 0;
  return recipeBank.filter(r =>
    (r.dealItems || []).length > 0 &&
    (r.dealItems || []).every(di => chains.has(di.store))
  ).length;
}

function RecipeCounter({ chains }) {
  const count = countRecipesForChains(chains);
  const total = recipeBank.length;
  const allSelected = chains.size >= CHAIN_ORDER.length;

  if (chains.size === 0) {
    return (
      <div className="chain-recipe-counter chain-recipe-counter--zero">
        Vælg butikker for at se opskrifter
      </div>
    );
  }
  if (allSelected) {
    return (
      <div className="chain-recipe-counter chain-recipe-counter--all">
        Du har adgang til alle <span className="chain-recipe-count" key={total}>{total}</span> opskrifter 🎉
      </div>
    );
  }
  return (
    <div className="chain-recipe-counter">
      Med disse butikker kan du lave{" "}
      <span className="chain-recipe-count" key={count}>{count}</span>{" "}
      opskrift{count !== 1 ? "er" : ""} denne uge
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
          aria-label={`${n} stjerne${n !== 1 ? "r" : ""}`}
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
    document.body.style.background = document.documentElement.classList.contains("dark") ? "#0d1a0c" : "#f4f2ed";
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
    if (!window.confirm("Slet alle svar?")) return;
    localStorage.removeItem("feedbackResponses");
    setResponses([]);
  }

  return (
    <div className="fb-results-page">
      <div className="fb-results-header">
        <h1 className="fb-results-title">Feedback — Tilbudskokken</h1>
        <div className="fb-results-actions">
          <span className="fb-results-count">{responses.length} svar</span>
          <button className="fb-results-export-btn" onClick={exportCSV} disabled={responses.length === 0}>
            Eksporter CSV
          </button>
          <button className="fb-results-clear-btn" onClick={clearAll} disabled={responses.length === 0}>
            Ryd alle
          </button>
          <a className="fb-results-back" href="/">← Tilbage</a>
        </div>
      </div>
      {responses.length === 0 ? (
        <div className="fb-results-empty">Ingen svar endnu.</div>
      ) : (
        <div className="fb-results-table-wrap">
          <table className="fb-results-table">
            <thead>
              <tr>
                <th>#</th><th>Tid</th>
                <th>Find opskrift</th><th>Design</th><th>Brug sandsynlighed</th>
                <th>Fejl?</th><th>Hvornår</th><th>Butik</th>
                <th>Erstatter</th><th>Hyppighed</th>
                <th>Brugte</th><th>Hvad mangler</th><th>Kommentarer</th>
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
                  <td className="fb-td-center">{r.hadBugs === true ? "Ja" : r.hadBugs === false ? "Nej" : "—"}</td>
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

  const [localStores, setLocalStores] = useState(() => {
    try {
      const v = localStorage.getItem("localStores");
      if (v) {
        const parsed = JSON.parse(v);
        if (!Array.isArray(parsed)) return null;
        // migrate from old branch-level format to chain-level format
        if (parsed.length > 0 && parsed[0].chain) {
          const seen = new Set();
          return parsed
            .filter(s => s.chain && !seen.has(s.chain) && seen.add(s.chain))
            .map(s => ({ chain: s.chain }));
        }
        return parsed;
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
    try { return JSON.parse(localStorage.getItem("shoppingList") || "[]"); } catch { return []; }
  });
  const [checkedItems, setCheckedItems] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("checkedItems") || "[]");
      return new Set(Array.isArray(saved) ? saved : []);
    } catch { return new Set(); }
  });
  const [showShoppingSheet, setShowShoppingSheet] = useState(false);
  const [diet, setDiet] = useState(() => {
    try { return localStorage.getItem("defaultDiet") || "Alle"; } catch { return "Alle"; }
  });
  const [copied, setCopied] = useState(false);
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
  const [showPantry, setShowPantry] = useState(false);
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
  const [pendingChains, setPendingChains] = useState(new Set());
  const [pendingDiet, setPendingDiet] = useState("Alle");
  const [pendingServings, setPendingServings] = useState(4);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState("anbefalet");
  const [quickFilters, setQuickFilters] = useState(new Set());

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

  const dietFilters = ["Alle", "Vegetar", "Veganer", "Glutenfri", "Mælkefri"];
  const timeFilters = ["Alle tider", "Under 20 min", "Under 45 min", "Over 45 min"];

  useEffect(() => {
    if (!showSplash) return;
    sessionStorage.setItem("splashShown", "true");
    const t1 = setTimeout(() => setSplashExiting(true), 2000);
    const t2 = setTimeout(() => setShowSplash(false), 2650);
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
  const selectedChains = new Set((localStores || []).map(s => s.chain));
  const setupComplete = selectedChains.size > 0;

  function getAvailableItemNames() {
    return new Set(
      stores.filter(s => selectedChains.has(s.name)).flatMap(s => s.items.map(it => it.name))
    );
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
      .map(r => ({
        ...r,
        matchCount: (r.dealItems || []).length,
        fullyMatched: selectedChains.size === 0
          || (r.dealItems || []).every(di => selectedChains.has(di.store)),
      }));
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
  const popScores = Object.values(popularityMap).sort((a, b) => b - a);
  const popThreshold = popScores.length > 0
    ? (popScores[Math.max(0, Math.floor(popScores.length * 0.2) - 1)] ?? 1)
    : Infinity;

  const searchQ = search.toLowerCase();
  function matchRecipe(r) {
    // Chain split is handled by fullyMatched in getScoredRecipes;
    // matchRecipe only applies search / time / cuisine / pantry / price.
    if (pantryItems.size > 0) {
      const allCovered = [...pantryItems].every(p =>
        (r.ingredients || []).some(ing => pantryMatchIngredient(ing.text || ing, p))
      );
      if (!allCovered) return false;
    }
    if (cuisineFilter !== "Alle" && r.cuisine !== cuisineFilter) return false;
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
    if (quickFilters.has("under20kr")) {
      const pp = calcPricePerPerson(r);
      if (pp === null || pp > 20) return false;
    }
    if (quickFilters.has("under20min") && parseMinutes(r.time) >= 20) return false;
    if (quickFilters.has("populaere") && (popularityMap[r.id] || 0) < popThreshold) return false;
    if (quickFilters.has("enbutik")) {
      const storeSet = new Set((r.dealItems || []).map(di => di.store));
      if (storeSet.size > 1) return false;
    }
    return true;
  }

  function applySort(recipes) {
    if (sortOrder === "anbefalet") return recipes;
    const arr = [...recipes];
    if (sortOrder === "pris-asc") {
      return arr.sort((a, b) => (calcPricePerPerson(a) ?? Infinity) - (calcPricePerPerson(b) ?? Infinity));
    }
    if (sortOrder === "pris-desc") {
      return arr.sort((a, b) => (calcPricePerPerson(b) ?? -Infinity) - (calcPricePerPerson(a) ?? -Infinity));
    }
    if (sortOrder === "hurtigst") {
      return arr.sort((a, b) => parseMinutes(a.time) - parseMinutes(b.time));
    }
    if (sortOrder === "populaer") {
      return arr.sort((a, b) => (popularityMap[b.id] || 0) - (popularityMap[a.id] || 0));
    }
    if (sortOrder === "nyeste") {
      return arr.sort((a, b) => (recipeIndexMap.get(b.id) ?? 0) - (recipeIndexMap.get(a.id) ?? 0));
    }
    return recipes;
  }

  const filteredRecommended = applySort(recommended.filter(matchRecipe));
  const filteredOthers = applySort(others.filter(matchRecipe));
  const priceFiltered = priceMin > 0 || priceMax !== null;
  const noResults = (search || timeFilter !== "Alle tider" || cuisineFilter !== "Alle" || pantryItems.size > 0 || priceFiltered) && filteredRecommended.length === 0 && filteredOthers.length === 0;

  const popularRecipes = Object.keys(popularityMap).length > 0
    ? [...recipeBank]
        .filter(r => popularityMap[r.id])
        .sort((a, b) => (popularityMap[b.id] || 0) - (popularityMap[a.id] || 0))
        .slice(0, 5)
    : [];

  // ── Recipe selection ────────────────────────────────────────────
  function selectRecipe(r) {
    setSelectedRecipe(r);
    trackRecipeInteraction(r.id, 1);
    const ds = parseInt(localStorage.getItem("defaultServings"));
    setServings(ds || r.servings_count || 4);
  }

  // ── Shopping list ───────────────────────────────────────────────
  function addToShoppingList(text) {
    setShoppingList(prev => {
      if (prev.includes(text)) return prev;
      const next = [...prev, text];
      try { localStorage.setItem("shoppingList", JSON.stringify(next)); } catch {}
      return next;
    });
  }
  function removeFromShoppingList(i) {
    setShoppingList(prev => {
      const removed = prev[i];
      const next = prev.filter((_, idx) => idx !== i);
      setCheckedItems(c => {
        const s = new Set(c);
        s.delete(removed);
        try { localStorage.setItem("checkedItems", JSON.stringify([...s])); } catch {}
        return s;
      });
      try { localStorage.setItem("shoppingList", JSON.stringify(next)); } catch {}
      return next;
    });
  }
  function clearShoppingList() {
    setShoppingList([]);
    setCheckedItems(new Set());
    try { localStorage.removeItem("shoppingList"); } catch {}
    try { localStorage.removeItem("checkedItems"); } catch {}
  }
  function toggleCheckedItem(item) {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item); else next.add(item);
      try { localStorage.setItem("checkedItems", JSON.stringify([...next])); } catch {}
      return next;
    });
  }
  function clearCheckedItems() {
    setShoppingList(prev => {
      const next = prev.filter(item => !checkedItems.has(item));
      try { localStorage.setItem("shoppingList", JSON.stringify(next)); } catch {}
      return next;
    });
    setCheckedItems(new Set());
    try { localStorage.removeItem("checkedItems"); } catch {}
  }

  // ── Feedback ─────────────────────────────────────────────────────
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
  function saveRecipe(r) {
    const entry = { ...r, savedAt: Date.now() };
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
  function toggleSaveRecipe(r) {
    const existing = savedRecipes.find(s => s.title === r.title);
    if (existing) deleteSavedRecipe(existing.savedAt);
    else saveRecipe(r);
  }

  function addAllSavedToShoppingList(recipes) {
    const targetRecipes = recipes || savedRecipes;
    const existingNorm = new Set(shoppingList.map(s =>
      s.toLowerCase().replace(/^\s*\d+[\d.,]*\s*(?:g|kg|l|dl|cl|ml|stk\.?|pk\.?|pose|karton|dåse|potte|bakke)?\.?\s*/i, '').trim()
    ));
    const toAdd = [];
    for (const r of targetRecipes) {
      for (const ing of (r.ingredients || [])) {
        if (ing.isPantry || !ing.store) continue;
        const text = ing.text || '';
        const norm = text.toLowerCase().replace(/^\s*\d+[\d.,]*\s*(?:g|kg|l|dl|cl|ml|stk\.?|pk\.?|pose|karton|dåse|potte|bakke)?\.?\s*/i, '').trim();
        if (norm && !existingNorm.has(norm)) {
          existingNorm.add(norm);
          toAdd.push(text);
        }
      }
    }
    if (toAdd.length === 0) return 0;
    setShoppingList(prev => {
      const next = [...prev, ...toAdd];
      try { localStorage.setItem('shoppingList', JSON.stringify(next)); } catch {}
      return next;
    });
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
        if (ing.isPantry || !ing.store) continue;
        const store  = ing.store;
        const scaled = scaleIngredient(ing.text, recipe.servings_count || 4, sv);
        if (!byStore[store]) byStore[store] = {};
        if (!byStore[store][ing.text]) byStore[store][ing.text] = [];
        byStore[store][ing.text].push(scaled);
      }
    }
    return Object.entries(byStore).map(([store, items]) => ({
      store,
      color: getChainColor(store),
      items: Object.entries(items).map(([key, texts]) => ({
        dealItem: key,
        merged: mergeIngredientTexts(texts),
      })),
    }));
  }
  const combinedList = showCombinedList ? buildCombinedList() : [];
  const planCount = mealPlan.filter(Boolean).length;

  useEffect(() => {
    document.body.classList.toggle("has-mp-sidebar", planCount > 0);
  }, [planCount]);

  function toggleQuickFilter(id) {
    setQuickFilters(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
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
  }, [pantryInput, showPantry]);

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
      setOnboardingStep(null);
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
    if (!list || list.length === 0) return "Ingen butik valgt";
    if (list.length === 1) return list[0].chain;
    if (list.length === 2) return `${list[0].chain} og ${list[1].chain}`;
    return `${list[0].chain} og ${list.length - 1} andre`;
  }

  const isRecipeSaved = selectedRecipe && savedRecipes.some(r => r.title === selectedRecipe.title);
  const weekBadge = `UGE ${getISOWeek(new Date()).week} · ${new Date().getFullYear()}`;

  // ── Render a grid of recipe cards ──────────────────────────────
  function renderRecipeGrid(recipes) {
    const availableNames = getAvailableItemNames();
    const top3Ids = new Set(popularRecipes.slice(0, 3).map(p => p.id));
    return recipes.map(r => (
      <RecipeCard
        key={r.id}
        r={r}
        inPlan={mealPlan.some(e => e?.recipe?.id === r.id)}
        isSaved={savedRecipes.some(s => s.title === r.title)}
        isPopular={top3Ids.has(r.id)}
        availableNames={availableNames}
        onSelect={selectRecipe}
        onAddToPlan={setAddingToPlan}
        onToggleSave={toggleSaveRecipe}
      />
    ));
  }

  return (
    <>
    <div className="app">

      {/* ── Splash screen ──────────────────────────────────────── */}
      {showSplash && (
        <div className={`splash-screen${splashExiting ? " exiting" : ""}`}>
          <div className="splash-glow" />
          <div className="splash-ring" />
          <div className="splash-ring splash-ring-2" />
          <div className="splash-content">
            <div className="splash-logo">
              <LogoIcon size={56} />
            </div>
            <p className="splash-tagline">Bedre tilbud. Bedre mad.</p>
          </div>
        </div>
      )}

      {/* ── Onboarding overlay ─────────────────────────────────── */}
      {onboardingStep !== null && (
        <div className="ob-overlay">

          {/* Welcome screen */}
          {onboardingStep === 0 && (
            <div className="ob-welcome">
              <div className="ob-welcome-deco-1" />
              <div className="ob-welcome-deco-2" />
              <div className="ob-welcome-content">
                <LogoIcon size={200} className="ob-welcome-logo" />
                <p className="ob-welcome-desc">Få opskrifter der er bygget præcis på hvad der er på tilbud i dine butikker denne uge. Spar penge og spis godt.</p>
                <button className="ob-cta-btn" onClick={() => setOnboardingStep(1)}>
                  Kom i gang →
                </button>
              </div>
            </div>
          )}

          {/* Step screens 1-3 */}
          {onboardingStep > 0 && (
            <div className="ob-step-layout">
              <div className="ob-topbar">
                <button className="ob-back-btn" onClick={() => setOnboardingStep(s => s - 1)}>
                  ← Tilbage
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
                <div className="ob-content" key="s1">
                  <h2 className="ob-title">Vælg dine butikker</h2>
                  <p className="ob-desc">Vælg de kæder du handler i — vi finder de bedste tilbudsmiddag til dig.</p>
                  <button
                    className="ob-select-all-btn"
                    onClick={() => pendingChains.size === CHAIN_ORDER.length
                      ? setPendingChains(new Set())
                      : setPendingChains(new Set(CHAIN_ORDER))
                    }
                  >
                    {pendingChains.size === CHAIN_ORDER.length ? "Fravælg alle" : "Vælg alle"}
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
                          <span className="ob-chain-color" style={{ background: CHAIN_COLORS[chain] }} />
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
                <div className="ob-content" key="s3">
                  <h2 className="ob-title">Kostpræferencer</h2>
                  <p className="ob-desc">Vælg din kostpræference — vi tilpasser opskrifterne.</p>
                  <div className="ob-diet-grid">
                    {[
                      { label: "Ingen", val: "Alle",      icon: "🍽️" },
                      { label: "Vegetar",  val: "Vegetar",  icon: "🥦" },
                      { label: "Veganer",  val: "Veganer",  icon: "🌱" },
                      { label: "Glutenfri",val: "Glutenfri",icon: "🌾" },
                      { label: "Mælkefri", val: "Mælkefri", icon: "🥛" },
                    ].map(({ label, val, icon }) => {
                      const sel = pendingDiet === val;
                      return (
                        <button
                          key={val}
                          className={`ob-diet-chip${sel ? " selected" : ""}`}
                          onClick={() => setPendingDiet(val)}
                        >
                          <span className="ob-diet-icon">{icon}</span>
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
                <div className="ob-content" key="s4">
                  <h2 className="ob-title">Hvor mange personer?</h2>
                  <p className="ob-desc">Vi tilpasser portionsstørrelserne til dit husstand.</p>
                  <div className="ob-servings-picker">
                    <button className="ob-sv-btn" onClick={() => setPendingServings(s => Math.max(1, s - 1))}>−</button>
                    <div className="ob-sv-display">
                      <span className="ob-sv-number">{pendingServings}</span>
                      <span className="ob-sv-label">person{pendingServings !== 1 ? "er" : ""}</span>
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
                {onboardingStep === 3 ? "Gå til opskrifter →" : "Fortsæt →"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Store picker modal (skift / administrer) */}
      {showStorePicker && (
        <div className="store-picker-overlay" onClick={e => e.target === e.currentTarget && setShowStorePicker(false)}>
          <div className="store-picker-card">
            <div className="sp-modal-header">
              <div>
                <h2 className="sp-title">Dine butikker</h2>
                <div className="sp-chain-count-row">
                  <span className="sp-chain-count-badge">{selectedChains.size}/{CHAIN_ORDER.length} valgt</span>
                  {selectedChains.size < CHAIN_ORDER.length && (
                    <button className="sp-select-all-btn" onClick={selectAllStores}>+ Vælg alle</button>
                  )}
                  {selectedChains.size > 0 && (
                    <button className="sp-clear-btn" onClick={clearStores}>Ryd</button>
                  )}
                </div>
              </div>
              <button className="sp-close-btn" onClick={() => setShowStorePicker(false)}>×</button>
            </div>
            <p className="sp-desc" style={{ margin: "0 0 1rem" }}>Tryk på en kæde for at vælge eller fravælge den.</p>
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
                      <span className="ob-chain-color" style={{ background: CHAIN_COLORS[chain] }} />
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
                <h2 className="sp-title">Vælg dag</h2>
                <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>{addingToPlan.emoji} {addingToPlan.title}</p>
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
                    {occupied && <span className="day-picker-recipe">{occupied.recipe.emoji} {occupied.recipe.title}</span>}
                    {!occupied && <span className="day-picker-empty-label">Ledig</span>}
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
              <span className="hero-brand-slogan">Bedre tilbud. Bedre mad.</span>
            </div>
          </div>
          <div className="hero-topbar-right">
            <div className="week-badge">{weekBadge}</div>
            <div className="header-actions">
              <button className="header-icon-btn header-icon-btn--bookmark" onClick={() => setShowSavedPanel(true)} title="Gemte opskrifter">
                🔖
                {savedRecipes.length > 0 && (
                  <span className="header-badge">{savedRecipes.length}</span>
                )}
              </button>
              <button className="header-icon-btn" onClick={() => setDarkMode(d => !d)} title={darkMode ? "Lys tilstand" : "Mørk tilstand"}>
                {darkMode ? "☀️" : "🌙"}
              </button>
              <button className="header-icon-btn" onClick={openSettings} title="Indstillinger">⚙</button>
            </div>
          </div>
        </div>

        {setupComplete && (
          <div className="local-store-badge" onClick={() => setShowStorePicker(true)} role="button" tabIndex={0} title="Administrer butikker">
            <span className="local-store-dots">
              {[...new Set((localStores || []).map(s => s.chain))].map(ch => (
                <span key={ch} className="chain-dot" style={{ background: CHAIN_COLORS[ch] }} />
              ))}
            </span>
            <span className="local-store-label">
              {localStores && localStores.length > 1
                ? <><strong>{localStores.length} butikker</strong> valgt</>
                : <><strong>{storeHeaderLabel(localStores)}</strong></>
              }
            </span>
            <button className="skift-btn" onClick={e => { e.stopPropagation(); setShowStorePicker(true); }}>Skift</button>
          </div>
        )}
      </div>

      {/* ── Guided setup flow (new/no-store users) ──────────────── */}
      {!selectedRecipe && !setupComplete && (
        <>
          {/* Step progress bar */}
          <div className="setup-flow-progress">
            <span className={`sfp-step${selectedChains.size > 0 ? " sfp-step--done" : " sfp-step--active"}`}>
              {selectedChains.size > 0 ? "✓" : "1"} Vælg butikker
            </span>
            <span className="sfp-sep">→</span>
            <span className={`sfp-step${selectedChains.size > 0 ? " sfp-step--active" : ""}`}>
              2 Tilpas
            </span>
            <span className="sfp-sep">→</span>
            <span className={`sfp-step${selectedChains.size > 0 ? " sfp-step--active" : ""}`}>
              3 Find opskrifter
            </span>
          </div>

          {/* Step 1: inline store picker */}
          <div className="setup-invite-card">
            <h2 className="setup-invite-title">Hvilke butikker handler du i?</h2>
            <p className="setup-invite-sub">Vælg dine kæder — vi finder de bedste opskrifter baseret på netop dine tilbud denne uge</p>
            <div className="ob-chain-grid setup-chain-grid">
              {CHAIN_ORDER.map(chain => {
                const sel = selectedChains.has(chain);
                return (
                  <button
                    key={chain}
                    className={`ob-chain-card${sel ? " selected" : ""}`}
                    onClick={() => toggleLocalChain(chain)}
                  >
                    <span className="ob-chain-color" style={{ background: CHAIN_COLORS[chain] }} />
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
        <div className="search-wrap">
          <input
            className="search-input"
            type="text"
            placeholder="Søg opskrifter, ingredienser..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="search-clear" onClick={() => setSearch("")}>×</button>}
        </div>
      )}

      {/* ── Step 2: Collapsible preferences ─────────────────────── */}
      {!selectedRecipe && (
        <>
          <div className={`prefs-section${prefsOpen ? " open" : ""}${activeFilterCount > 0 ? " has-active" : ""}`}>
            <button className="prefs-trigger" onClick={() => setPrefsOpen(v => !v)}>
              <span className="prefs-trigger-icon">⚙</span>
              <span className="prefs-trigger-text">
                <span className="prefs-trigger-title">Tilpas dine opskrifter</span>
                <span className="prefs-trigger-sub">
                  {activeFilterCount > 0
                    ? `${activeFilterCount} filter${activeFilterCount !== 1 ? "re" : ""} aktivt — tryk for at justere`
                    : "Tilpas kostpræferencer, tid og budget"}
                </span>
              </span>
              {activeFilterCount > 0 && (
                <span className="prefs-active-badge">{activeFilterCount}</span>
              )}
              <svg className={`pantry-chevron${prefsOpen ? " open" : ""}`} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 6 L8 10 L12 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {prefsOpen && (
              <div className="prefs-body">
                {/* Quick filters */}
                <div className="prefs-group-label">Hurtigfiltre</div>
                <div className="quick-filters prefs-filter-row">
                  {[
                    { id: "under20kr",  label: "🔥 Under 20 kr." },
                    { id: "under20min", label: "⚡ Under 20 min" },
                    { id: "populaere",  label: "⭐ Populære" },
                    { id: "enbutik",    label: "🛒 Én butik" },
                  ].map(f => (
                    <button
                      key={f.id}
                      className={`diet-btn${quickFilters.has(f.id) ? " active" : ""}`}
                      onClick={() => toggleQuickFilter(f.id)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Diet */}
                <div className="prefs-group-label">Kost</div>
                <div className="diet-filters prefs-filter-row">
                  {dietFilters.map(f => (
                    <button key={f} onClick={() => setDiet(f)} className={`diet-btn${diet === f ? " active" : ""}`}>{f}</button>
                  ))}
                </div>

                {/* Time */}
                <div className="prefs-group-label">Tid</div>
                <div className="diet-filters time-filters prefs-filter-row">
                  {timeFilters.map(f => (
                    <button key={f} onClick={() => setTimeFilter(f)} className={`diet-btn${timeFilter === f ? " active" : ""}`}>{f}</button>
                  ))}
                </div>

                {/* Cuisine */}
                {CUISINE_ORDER.length > 2 && (
                  <>
                    <div className="prefs-group-label">Køkken</div>
                    <div className="cuisine-filters prefs-filter-row">
                      {CUISINE_ORDER.map(c => (
                        <button
                          key={c}
                          onClick={() => setCuisineFilter(c)}
                          className={`diet-btn${cuisineFilter === c ? " active" : ""}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Price */}
                {maxRecipePrice > 0 && (
                  <>
                    <div className="prefs-group-label">Pris pr. person</div>
                    <div className="price-range-wrap prefs-price-wrap">
                      <div className="price-range-header">
                        <span className={`price-range-display${priceFiltered ? " active" : ""}`}>
                          {priceMin} kr. — {priceMax ?? maxRecipePrice} kr.
                          {priceFiltered && (
                            <button className="price-range-reset" onClick={() => { setPriceMin(0); setPriceMax(null); }}>×</button>
                          )}
                        </span>
                      </div>
                      <div className="price-range-track-wrap">
                        <div className="price-range-track-bg" />
                        <div
                          className="price-range-fill"
                          style={{
                            left: `${(priceMin / maxRecipePrice) * 100}%`,
                            right: `${100 - ((priceMax ?? maxRecipePrice) / maxRecipePrice) * 100}%`,
                          }}
                        />
                        <input type="range" className="price-range-input" min={0} max={maxRecipePrice} step={5} value={priceMin}
                          onChange={e => { const val = Math.min(Number(e.target.value), (priceMax ?? maxRecipePrice) - 10); setPriceMin(Math.max(0, val)); }}
                        />
                        <input type="range" className="price-range-input" min={0} max={maxRecipePrice} step={5} value={priceMax ?? maxRecipePrice}
                          onChange={e => { const val = Math.max(Number(e.target.value), priceMin + 10); setPriceMax(val >= maxRecipePrice ? null : val); }}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Pantry */}
                <div className="prefs-group-label">Køleskab</div>
                <div className={`pantry-inline${showPantry ? " open" : ""}${pantryItems.size > 0 ? " has-items" : ""} prefs-pantry`}>
                  <button className="pantry-trigger-btn" onClick={() => setShowPantry(v => !v)}>
                    <span className="pantry-trigger-icon">🧺</span>
                    <span className="pantry-trigger-text">
                      <span className="pantry-trigger-title">Hvad har du derhjemme?</span>
                      <span className="pantry-trigger-sub">
                        {pantryItems.size > 0
                          ? `${filteredRecommended.length + filteredOthers.length} af ${scoredRecipes.length} opskrifter passer til dit køleskab`
                          : "Tilføj ingredienser — vi finder opskrifter du allerede kan lave"}
                      </span>
                    </span>
                    {pantryItems.size > 0 && (
                      <span className="pantry-count-badge">{pantryItems.size}</span>
                    )}
                    <svg className={`pantry-chevron${showPantry ? " open" : ""}`} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M4 6 L8 10 L12 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {showPantry && (
                    <div className="pantry-body-inline">
                      {(() => {
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
                          <div className="pantry-input-wrap" ref={pantryInputWrapRef}>
                            <div className="pantry-input-row">
                              <input
                                className="pantry-text-input"
                                type="text"
                                placeholder={pantryItems.size === 0 ? "Hvad har du i køleskabet i dag?" : "Tilføj flere ingredienser..."}
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
                              {query && <button className="pantry-add-btn" onClick={() => addPantryFromInput()}>Tilføj</button>}
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
                                }) : <div className="pantry-dropdown-empty">Ingen forslag — tryk Enter for at tilføje alligevel</div>}
                              </div>
                            )}
                          </div>
                        );
                      })()}
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
                          <button className="pantry-clear-all" onClick={clearPantry}>Ryd alle</button>
                        </div>
                      )}
                      {pantryItems.size > 0 && (
                        <button className="pantry-find-btn" onClick={() => { setShowPantry(false); setPrefsOpen(false); }}>
                          Find opskrifter
                          <span className="pantry-find-count">{filteredRecommended.length + filteredOthers.length}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Active filter banners */}
          {pantryItems.size > 0 && !showPantry && (
            <div className="pantry-filter-banner">
              <span className="pantry-filter-banner-text">
                Filtreret efter dine ingredienser — <strong>{filteredRecommended.length + filteredOthers.length} opskrifter</strong> fundet
              </span>
              <button className="pantry-filter-banner-clear" onClick={clearPantry}>Ryd filter</button>
            </div>
          )}
        </>
      )}

      {/* Detail view */}
      {selectedRecipe ? (
        <div className="recipe-detail-sheet">
          <button className="back-btn" onClick={() => setSelectedRecipe(null)}>
            ← Tilbage til opskrifter
          </button>

          <div className="recipe-card">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h2 className="recipe-title" style={{ margin: 0 }}>{selectedRecipe.title}</h2>
                {selectedRecipe.subtitle && <p className="recipe-subtitle">{selectedRecipe.subtitle}</p>}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className={`share-btn${copied ? " copied" : ""}`}
                  onClick={() => shareRecipe(selectedRecipe)}
                  title="Del opskrift"
                >
                  {copied ? (
                    <>✓ <span>Kopieret!</span></>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                        <polyline points="16 6 12 2 8 6"/>
                        <line x1="12" y1="2" x2="12" y2="15"/>
                      </svg>
                      <span>Del</span>
                    </>
                  )}
                </button>
                <button
                  className={`save-btn${isRecipeSaved ? " saved" : ""}`}
                  onClick={() => toggleSaveRecipe(selectedRecipe)}
                  title={isRecipeSaved ? "Fjern fra gemte" : "Gem opskrift"}
                >
                  🔖 <span>{isRecipeSaved ? "Gemt" : "Gem opskrift"}</span>
                </button>
                {(() => {
                  const inPlan = mealPlan.some(e => e?.recipe?.id === selectedRecipe.id);
                  return (
                    <button
                      className={`add-to-plan-btn detail${inPlan ? " in-plan" : ""}`}
                      onClick={() => !inPlan && setAddingToPlan(selectedRecipe)}
                    >
                      📅 <span>{inPlan ? "I madplan" : "Tilføj til ugen"}</span>
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* Deal items used */}
            <div className="recipe-deal-tags" style={{ marginBottom: 12 }}>
              {(selectedRecipe.dealItems || []).map(di => (
                <span key={di.name} className="deal-item-tag available">
                  <span className="deal-store-dot" style={{ background: getChainColor(di.store) }} />
                  {di.name} · {di.store}
                </span>
              ))}
            </div>

            <div className="recipe-meta-bar">
              <span>⏱ {selectedRecipe.time}</span>
              {selectedRecipe.cuisine && <span className="cuisine-badge-detail">{selectedRecipe.cuisine}</span>}
              {selectedRecipe.difficulty && (
                <span className={`difficulty-badge difficulty-${selectedRecipe.difficulty === "Nem" ? "nem" : selectedRecipe.difficulty === "Avanceret" ? "avanceret" : "mellem"}`}>
                  {selectedRecipe.difficulty}
                </span>
              )}
              {selectedRecipe.calories && <span className="calories-meta">🔥 {selectedRecipe.calories} kcal</span>}
              <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                👥
                <button className="btn-round" onClick={() => setServings(s => Math.max(1, s - 1))}>−</button>
                {servings} personer
                <button className="btn-round" onClick={() => setServings(s => Math.min(10, s + 1))}>+</button>
              </span>
            </div>
            {(() => {
              const pp = calcPricePerPerson(selectedRecipe);
              if (pp == null) return null;
              return (
                <div className="recipe-detail-price">
                  ca. {pp * servings} kr. i alt
                  <span className="recipe-detail-price-pp"> · {pp} kr. pr. person</span>
                </div>
              );
            })()}

            {selectedRecipe.description && (
              <p className="recipe-description">{selectedRecipe.description}</p>
            )}

            <div className="section-label">Ingredienser</div>
            <ul className="ingredient-grid">
              {(selectedRecipe.ingredients || []).map((ing, i) => {
                const scaled = scaleIngredient(ing.text || ing, selectedRecipe.servings_count || 4, servings);
                const isDeal = !ing.isPantry && !!(ing.store);
                const inList = shoppingList.includes(scaled);
                return (
                  <li key={i} className={`ingredient-item${isDeal ? " ingredient-deal" : " ingredient-pantry"}`}>
                    {isDeal ? (
                      <button
                        className="ingredient-add-btn"
                        onClick={() => addToShoppingList(scaled)}
                        disabled={inList}
                        style={{ background: inList ? "#d4ead4" : "#4a7050", color: inList ? "#3a6040" : "white" }}
                      >
                        {inList ? "✓" : "+"}
                      </button>
                    ) : (
                      <span className="ingredient-pantry-dot" />
                    )}
                    <span className={isDeal ? "ingredient-deal-text" : "ingredient-pantry-text"}>
                      {scaled}{ing.price ? ` · ${ing.price}` : ""}
                    </span>
                    {isDeal && (
                      <span
                        className="store-badge-pill"
                        style={{
                          background: getChainColor(ing.store),
                          color: chainIsLight(ing.store) ? "#1a1a1a" : "#fff",
                        }}
                      >
                        {ing.store}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="ingredient-legend">
              <span><span className="legend-dot deal" />Tilbudsvare · klik + for indkøbsliste</span>
              <span><span className="legend-dot pantry" />Pantry-vare · du har det hjemme</span>
            </div>

            <div className="section-label">Fremgangsmåde</div>
            <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {selectedRecipe.steps.map((step, i) => (
                <li key={i} className="step-item">
                  <span className="step-number">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>

            {(selectedRecipe.tips || selectedRecipe.tip) && (
              <div className="recipe-tips-block">
                <div className="recipe-tips-label">💡 Tips</div>
                {selectedRecipe.tips
                  ? selectedRecipe.tips.map((t, i) => <p key={i} className="recipe-tip-item">{t}</p>)
                  : <p className="recipe-tip-item">{selectedRecipe.tip}</p>
                }
              </div>
            )}
          </div>

          {/* Shopping list */}
          {shoppingList.length > 0 && (
            <div className="shopping-list-card">
              <div className="shopping-list-header">
                <div className="section-label" style={{ margin: 0 }}>
                  Indkøbsliste · {shoppingList.length} {shoppingList.length === 1 ? "vare" : "varer"}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {checkedItems.size > 0 && (
                    <button className="btn-outline btn-outline--safe" onClick={clearCheckedItems}>Ryd afkrydsede</button>
                  )}
                  <button className="btn-outline" onClick={clearShoppingList}>Start forfra</button>
                </div>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {shoppingList.map((item, i) => {
                  const checked = checkedItems.has(item);
                  return (
                    <li key={i} className={`shopping-item${checked ? " checked" : ""}`}>
                      <button className="shopping-check-btn" onClick={() => toggleCheckedItem(item)} aria-label={checked ? "Fjern hak" : "Sæt hak"}>
                        {checked ? (
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="2,7 6,11 12,3"/>
                          </svg>
                        ) : null}
                      </button>
                      <span className="shopping-item-label">{item}</span>
                      <button className="shopping-item-remove" onClick={() => removeFromShoppingList(i)}>×</button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      ) : (
        /* Browse view — only shown after at least one store is selected */
        setupComplete ? (
          <div className="recipes-section">

            {/* ── Quick diet + sort strip ─────────────────── */}
            <div className="quick-strip-wrap">
              <div className="quick-strip">
                <span className="quick-strip-sep">Kost</span>
                {[
                  { val: "Alle", label: "Alle" },
                  { val: "Vegetar", label: "🥦 Vegetar" },
                  { val: "Veganer", label: "🌱 Veganer" },
                  { val: "Glutenfri", label: "🌾 Glutenfri" },
                  { val: "Mælkefri", label: "🥛 Mælkefri" },
                ].map(f => (
                  <button
                    key={f.val}
                    className={`qs-pill${diet === f.val ? " active" : ""}`}
                    onClick={() => setDiet(f.val)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="quick-strip quick-strip-sort">
                <span className="quick-strip-sep">Sorter</span>
                {[
                  { id: "anbefalet", label: "⭐ Anbefalet" },
                  { id: "pris-asc",  label: "💰 Billigst" },
                  { id: "hurtigst", label: "⚡ Hurtigst" },
                  { id: "populaer", label: "🔥 Populær" },
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
            </div>

            <div className="recipe-browse-section">
              <div className="section-header-row">
                <button
                  className="section-toggle-btn"
                  onClick={() => toggleSection("recommended")}
                  aria-expanded={!collapsedSections.recommended}
                >
                  <span className="section-toggle-label">🍽️ Ugens opskrifter</span>
                  <span className="section-count-badge">{filteredRecommended.length} opskrifter</span>
                  <svg
                    className={`section-chevron${collapsedSections.recommended ? "" : " open"}`}
                    width="16" height="16" viewBox="0 0 16 16" fill="none"
                    aria-hidden="true"
                  >
                    <path d="M4 6 L8 10 L12 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <select className="sort-select" value={sortOrder} onChange={e => setSortOrder(e.target.value)} aria-label="Sortering">
                  <option value="anbefalet">Anbefalet</option>
                  <option value="pris-asc">Pris: Lavest</option>
                  <option value="pris-desc">Pris: Højest</option>
                  <option value="hurtigst">Hurtigst</option>
                  <option value="populaer">Mest populær</option>
                  <option value="nyeste">Nyeste</option>
                </select>
              </div>
              {!collapsedSections.recommended && (
                <p className="section-intro">Bygget på denne uges bedste tilbud fra dine butikker</p>
              )}
              <div className={`section-body-wrap${collapsedSections.recommended ? " collapsed" : ""}`}>
                <div className="section-body-inner">
                  {filteredRecommended.length > 0 ? (
                    <div className="recipe-browse-grid section-body-grid">
                      {renderRecipeGrid(filteredRecommended)}
                    </div>
                  ) : (
                    <div className="section-empty-state">
                      {pantryItems.size > 0 && !search
                        ? "Vi fandt ingen match til dine ingredienser — prøv at fjerne én"
                        : search
                        ? "Ingen opskrifter matchede — prøv et andet ord eller juster filtrene lidt"
                        : "Ingen opskrifter fra disse butikker denne uge — prøv at tilføje en ekstra butik"}
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
                  <span className="section-toggle-label">🛒 Kræver andre butikker</span>
                  <span className="section-count-badge">{filteredOthers.length} opskrifter</span>
                  <svg
                    className={`section-chevron${collapsedSections.others ? "" : " open"}`}
                    width="16" height="16" viewBox="0 0 16 16" fill="none"
                    aria-hidden="true"
                  >
                    <path d="M4 6 L8 10 L12 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <select className="sort-select" value={sortOrder} onChange={e => setSortOrder(e.target.value)} aria-label="Sortering">
                  <option value="anbefalet">Anbefalet</option>
                  <option value="pris-asc">Pris: Lavest</option>
                  <option value="pris-desc">Pris: Højest</option>
                  <option value="hurtigst">Hurtigst</option>
                  <option value="populaer">Mest populær</option>
                  <option value="nyeste">Nyeste</option>
                </select>
              </div>
              {!collapsedSections.others && (
                <p className="section-intro">Udforsk mere — bare hent et ekstra tilbud fra en ny butik</p>
              )}
              <div className={`section-body-wrap${collapsedSections.others ? " collapsed" : ""}`}>
                <div className="section-body-inner">
                  {filteredOthers.length > 0 ? (
                    <div className="recipe-browse-grid section-body-grid">
                      {renderRecipeGrid(filteredOthers)}
                    </div>
                  ) : (
                    <div className="section-empty-state">
                      Super! Alle ugens opskrifter matcher allerede dine butikker 🎉
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null
      )}


    </div>

  {/* Mobile meal plan bottom sheet */}
  {showMealPlanPanel && (
    <div className="mp-sheet-overlay" onClick={() => setShowMealPlanPanel(false)}>
      <div className="mp-sheet" onClick={e => e.stopPropagation()}>
        <div className="mp-sheet-drag-handle" />
        <div className="mp-sheet-header">
          <div className="mp-sheet-title">📅 Madplan</div>
          <button className="mp-sheet-close" onClick={() => setShowMealPlanPanel(false)}>×</button>
        </div>
        <div className="mp-days-list">
          {mealPlan.map((entry, i) => (
            <div key={i} className={`mp-sheet-day${entry ? " filled" : " empty"}`}>
              <div className="mp-sheet-day-name">{DAY_FULL[i]}</div>
              {entry ? (
                <div className="mp-sheet-day-content">
                  <span className="mp-sheet-emoji">{entry.recipe.emoji}</span>
                  <div className="mp-sheet-recipe-info">
                    <div className="mp-sheet-recipe-title">{entry.recipe.title}</div>
                    <div className="mp-sheet-recipe-meta">⏱ {entry.recipe.time} · {entry.servings} pers.</div>
                  </div>
                  <button className="mp-sheet-remove" onClick={() => removeFromPlan(i)}>×</button>
                </div>
              ) : (
                <div className="mp-sheet-empty">Ingen opskrift planlagt</div>
              )}
            </div>
          ))}
        </div>
        {planCount > 0 && (
          <div className="mp-sheet-actions">
            <button className={`share-plan-btn${planCopied ? " copied" : ""}`} onClick={shareMealPlan}>
              {planCopied ? "✓ Kopieret!" : "Del madplan"}
            </button>
            <button className="combined-list-btn" onClick={() => setShowCombinedList(v => !v)}>
              {showCombinedList ? "Skjul indkøbsliste" : "Vis indkøbsliste"}
            </button>
          </div>
        )}
        {confirmClearPlan ? (
          <div className="mp-clear-confirm">
            <span>Ryd hele madplanen?</span>
            <div className="mp-clear-confirm-btns">
              <button className="mp-clear-yes" onClick={clearMealPlan}>Ja, ryd</button>
              <button className="mp-clear-no" onClick={() => setConfirmClearPlan(false)}>Annuller</button>
            </div>
          </div>
        ) : (
          <button className="mp-clear-btn" onClick={() => setConfirmClearPlan(true)} style={{ marginTop: 8 }}>Ryd madplan</button>
        )}
        {showCombinedList && planCount > 0 && (
          <div className="combined-list">
            {combinedList.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Ingen tilbudsvarer i madplanen.</p>
            ) : (
              combinedList.map(group => (
                <div key={group.store} className="combined-list-store">
                  <div className="combined-list-store-label">
                    <span className="deal-store-dot" style={{ background: group.color }} />
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
      <button className="meal-plan-fab" onClick={() => setShowMealPlanPanel(true)} aria-label="Vis madplan">
        📅<span className="mp-fab-badge">{planCount}</span>
      </button>
    )}

    {/* Desktop sidebar */}
    {planCount > 0 && <aside className="meal-plan-sidebar">
      <div className="mp-sidebar-header">
        <div className="mp-sidebar-title">📅 Madplan</div>
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
                <span className="mp-sidebar-emoji">{entry.recipe.emoji}</span>
                <div className="mp-sidebar-recipe-info">
                  <div className="mp-sidebar-recipe-title">{entry.recipe.title}</div>
                  <div className="mp-sidebar-servings">
                    <button className="plan-sv-btn" onClick={() => setPlanServings(i, Math.max(1, entry.servings - 1))}>−</button>
                    <span>{entry.servings}p</span>
                    <button className="plan-sv-btn" onClick={() => setPlanServings(i, Math.min(10, entry.servings + 1))}>+</button>
                  </div>
                </div>
                <button className="mp-sidebar-remove" onClick={() => removeFromPlan(i)} title="Fjern">×</button>
              </div>
            ) : (
              <div className="mp-sidebar-empty">
                <span className="mp-sidebar-plus">+</span>
                <span className="mp-sidebar-empty-text">Ledig</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mp-sidebar-footer">
        <button className={`share-plan-btn${planCopied ? " copied" : ""}`} onClick={shareMealPlan} style={{ width: "100%" }}>
          {planCopied ? "✓ Kopieret!" : "Del madplan"}
        </button>
        <button className="combined-list-btn" onClick={() => setShowCombinedList(v => !v)} style={{ width: "100%" }}>
          {showCombinedList ? "Skjul indkøbsliste" : "Vis indkøbsliste"}
        </button>
        {confirmClearPlan ? (
          <div className="mp-clear-confirm">
            <span>Ryd hele madplanen?</span>
            <div className="mp-clear-confirm-btns">
              <button className="mp-clear-yes" onClick={clearMealPlan}>Ja, ryd</button>
              <button className="mp-clear-no" onClick={() => setConfirmClearPlan(false)}>Annuller</button>
            </div>
          </div>
        ) : (
          <button className="mp-clear-btn" onClick={() => setConfirmClearPlan(true)}>Ryd madplan</button>
        )}
      </div>
      {showCombinedList && planCount > 0 && (
        <div className="combined-list" style={{ marginTop: 12 }}>
          {combinedList.length === 0 ? (
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Ingen tilbudsvarer i madplanen.</p>
          ) : (
            combinedList.map(group => (
              <div key={group.store} className="combined-list-store">
                <div className="combined-list-store-label">
                  <span className="deal-store-dot" style={{ background: group.color }} />
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

  {/* Shopping cart FAB — hidden whenever meal plan is active (sidebar or panel) */}
  {shoppingList.length > 0 && planCount === 0 && (
    <button className="shopping-cart-fab" onClick={() => setShowShoppingSheet(true)} aria-label="Indkøbsliste">
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
          <div className="shopping-sheet-title">🔖 Gemte opskrifter</div>
          <button className="mp-sheet-close" onClick={() => setShowSavedPanel(false)}>×</button>
        </div>
        {savedRecipes.length === 0 ? (
          <div className="saved-sheet-empty">
            Du har ikke gemt nogen opskrifter endnu — tryk på 🔖 på en opskrift for at gemme den
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
                    <div className="saved-sheet-card-title">{r.emoji} {r.title}</div>
                    <div className="saved-sheet-card-meta">⏱ {r.time} · 👥 {r.servings_count || 4} pers.</div>
                  </div>
                  <button
                    className="saved-sheet-unsave"
                    onClick={e => { e.stopPropagation(); deleteSavedRecipe(r.savedAt); }}
                    title="Fjern fra gemte"
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
                Tilføj alle til indkøbsliste
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )}

  {/* Shopping list bottom sheet */}
  {showShoppingSheet && (
    <div className="mp-sheet-overlay" onClick={() => setShowShoppingSheet(false)}>
      <div className="shopping-sheet" ref={setShoppingSheetEl} onClick={e => e.stopPropagation()}>
        <div className="mp-sheet-drag-handle" />
        <div className="shopping-sheet-header">
          <div className="shopping-sheet-title">🛒 Indkøbsliste</div>
          <button className="mp-sheet-close" onClick={() => setShowShoppingSheet(false)}>×</button>
        </div>
        <ul className="shopping-sheet-list">
          {shoppingList.map((item, i) => {
            const checked = checkedItems.has(item);
            return (
              <li key={i} className={`shopping-sheet-item${checked ? " checked" : ""}`} onClick={() => toggleCheckedItem(item)}>
                <button className="shopping-check-btn" onClick={e => e.stopPropagation()} aria-label={checked ? "Fjern hak" : "Sæt hak"} tabIndex={-1}>
                  {checked ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2,7 6,11 12,3"/>
                    </svg>
                  ) : null}
                </button>
                <span className="shopping-sheet-text">{item}</span>
                <button className="shopping-item-remove" onClick={e => { e.stopPropagation(); removeFromShoppingList(i); }}>×</button>
              </li>
            );
          })}
        </ul>
        <div className="shopping-sheet-footer">
          {checkedItems.size > 0 && (
            <button className="mp-clear-btn mp-clear-btn--safe" onClick={clearCheckedItems}>Ryd afkrydsede</button>
          )}
          <button className="mp-clear-btn" onClick={clearShoppingList}>Start forfra</button>
        </div>
      </div>
    </div>
  )}

  {/* ── Mobile bottom navigation ─────────────────────────────────── */}
  {setupComplete && onboardingStep === null && (
    <nav className="mobile-bottom-nav" aria-label="Navigation">
      {[
        {
          id: "opskrifter",
          label: "Opskrifter",
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M3 12h18M3 18h11"/>
            </svg>
          ),
          active: !showMealPlanPanel && !showSavedPanel && !showShoppingSheet,
          badge: null,
          onClick: () => { setShowMealPlanPanel(false); setShowSavedPanel(false); setShowShoppingSheet(false); window.scrollTo({ top: 0, behavior: "smooth" }); },
        },
        {
          id: "madplan",
          label: "Madplan",
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          ),
          active: showMealPlanPanel,
          badge: planCount > 0 ? planCount : null,
          onClick: () => { setShowSavedPanel(false); setShowShoppingSheet(false); setShowMealPlanPanel(v => !v); },
        },
        {
          id: "gemt",
          label: "Gemt",
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          ),
          active: showSavedPanel,
          badge: savedRecipes.length > 0 ? savedRecipes.length : null,
          onClick: () => { setShowMealPlanPanel(false); setShowShoppingSheet(false); setShowSavedPanel(v => !v); },
        },
        {
          id: "indkob",
          label: "Indkøb",
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          ),
          active: showShoppingSheet,
          badge: shoppingList.length > 0 ? shoppingList.length : null,
          onClick: () => { setShowMealPlanPanel(false); setShowSavedPanel(false); setShowShoppingSheet(v => !v); },
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

  {/* ── Feedback button ───────────────────────────────────────────── */}
  <button
    className="fb-fab"
    onClick={() => { setShowFeedbackPanel(true); setFeedbackSubmitted(false); setFeedbackForm(FEEDBACK_EMPTY); }}
    aria-label="Giv feedback"
    title="Giv feedback"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <span className="fb-fab-label">Feedback</span>
  </button>

  {/* ── Feedback panel ────────────────────────────────────────────── */}
  {showFeedbackPanel && (
    <div className="fb-overlay" onClick={() => setShowFeedbackPanel(false)}>
      <div className="fb-panel" onClick={e => e.stopPropagation()}>
        <div className="fb-panel-drag-handle" />
        <div className="fb-panel-header">
          <span className="fb-panel-title">Din mening tæller</span>
          <button className="fb-panel-close" onClick={() => setShowFeedbackPanel(false)} aria-label="Luk">×</button>
        </div>

        {feedbackSubmitted ? (
          <div className="fb-submitted">
            <div className="fb-submitted-icon">✓</div>
            <div className="fb-submitted-text">Tak for din feedback!</div>
          </div>
        ) : (
          <div className="fb-form">
            {/* ─ Ratings ─ */}
            <div className="fb-field">
              <label className="fb-label">Hvor let var det at finde en opskrift?</label>
              <StarRating value={feedbackForm.findRecipe} onChange={v => setFeedbackForm(f => ({...f, findRecipe: v}))} />
            </div>
            <div className="fb-field">
              <label className="fb-label">Hvordan vil du vurdere det overordnede design?</label>
              <StarRating value={feedbackForm.design} onChange={v => setFeedbackForm(f => ({...f, design: v}))} />
            </div>
            <div className="fb-field">
              <label className="fb-label">Hvor sandsynligt er det at du bruger appen til din ugentlige indkøbstur?</label>
              <StarRating value={feedbackForm.likelihood} onChange={v => setFeedbackForm(f => ({...f, likelihood: v}))} />
            </div>

            {/* ─ Bug toggle ─ */}
            <div className="fb-field fb-field-row">
              <label className="fb-label">Stødte du på fejl eller forvirrende øjeblikke?</label>
              <div className="fb-toggle-row">
                {["Ja", "Nej"].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    className={`fb-toggle-btn${feedbackForm.hadBugs === (opt === "Ja") ? " active" : ""}`}
                    onClick={() => setFeedbackForm(f => ({...f, hadBugs: opt === "Ja"}))}
                  >{opt}</button>
                ))}
              </div>
            </div>

            <div className="fb-divider" />

            {/* ─ Usage questions ─ */}
            <div className="fb-field">
              <label className="fb-label">Hvornår ville du oftest bruge appen?</label>
              <div className="fb-chips">
                {["Inden indkøb", "Ugentlig madplan", "Inspiration", "Andet"].map(opt => (
                  <button key={opt} type="button"
                    className={`fb-chip${feedbackForm.when === opt ? " active" : ""}`}
                    onClick={() => setFeedbackForm(f => ({...f, when: f.when === opt ? "" : opt}))}
                  >{opt}</button>
                ))}
              </div>
            </div>

            <div className="fb-field">
              <label className="fb-label">Hvilken butik handler du normalt i?</label>
              <div className="fb-chips">
                {["Rema 1000", "Netto", "Coop 365", "En blanding", "Andet"].map(opt => (
                  <button key={opt} type="button"
                    className={`fb-chip${feedbackForm.store === opt ? " active" : ""}`}
                    onClick={() => setFeedbackForm(f => ({...f, store: f.store === opt ? "" : opt}))}
                  >{opt}</button>
                ))}
              </div>
            </div>

            <div className="fb-field">
              <label className="fb-label">Ville du bruge denne i stedet for — eller sideløbende med — din normale metode?</label>
              <div className="fb-chips">
                {["I stedet for", "Sideløbende", "Ville nok ikke bruge den"].map(opt => (
                  <button key={opt} type="button"
                    className={`fb-chip${feedbackForm.replace === opt ? " active" : ""}`}
                    onClick={() => setFeedbackForm(f => ({...f, replace: f.replace === opt ? "" : opt}))}
                  >{opt}</button>
                ))}
              </div>
            </div>

            <div className="fb-field">
              <label className="fb-label">Hvor tit tror du, du ville bruge appen?</label>
              <div className="fb-chips">
                {["Dagligt", "Ugentligt", "Et par gange om måneden", "Sjældent"].map(opt => (
                  <button key={opt} type="button"
                    className={`fb-chip${feedbackForm.frequency === opt ? " active" : ""}`}
                    onClick={() => setFeedbackForm(f => ({...f, frequency: f.frequency === opt ? "" : opt}))}
                  >{opt}</button>
                ))}
              </div>
            </div>

            <div className="fb-field">
              <label className="fb-label">Hvilke af disse lagde du mærke til eller brugte? <span className="fb-label-sub">(vælg alle der passer)</span></label>
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
                    >{opt}</button>
                  );
                })}
              </div>
            </div>

            <div className="fb-divider" />

            {/* ─ Open text ─ */}
            <div className="fb-field">
              <label className="fb-label">Hvad mangler der for at du ville bruge den regelmæssigt?</label>
              <textarea
                className="fb-textarea"
                rows={2}
                placeholder="Fx en funktion, integration, noget der mangler…"
                value={feedbackForm.whatsMissing}
                onChange={e => setFeedbackForm(f => ({...f, whatsMissing: e.target.value}))}
              />
            </div>

            <div className="fb-field">
              <label className="fb-label">Kommentarer eller fejl du stødte på</label>
              <textarea
                className="fb-textarea"
                rows={2}
                placeholder="Beskriv hvad der skete og hvornår…"
                value={feedbackForm.comments}
                onChange={e => setFeedbackForm(f => ({...f, comments: e.target.value}))}
              />
            </div>

            <button
              className="fb-submit-btn"
              onClick={submitFeedback}
              disabled={!feedbackForm.findRecipe && !feedbackForm.design && !feedbackForm.likelihood}
            >
              Send feedback
            </button>
            <p className="fb-anon-note">Anonym — ingen persondata gemmes</p>
          </div>
        )}
      </div>
    </div>
  )}

    </>
  );
}
