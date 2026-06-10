import { useState, useEffect, useMemo } from "react";
import "./App.css";
import { recipeBank } from "./recipes";
import LogoIcon from "./LogoIcon";
import LogoFull from "./LogoFull";

const CHAIN_COLORS = {
  "Netto": "#e6a800",
  "Føtex": "#0055a5",
  "Bilka": "#c0141b",
  "Rema 1000": "#e63329",
  "Coop 365": "#0066cc",
};

const CHAIN_ORDER = ["Rema 1000", "Netto", "Coop 365", "Føtex", "Bilka"];
const SALLING_BRANDS = new Set(["Netto", "Føtex", "Bilka"]);

// Maps keywords in Salling food-waste product descriptions → our recipe dealItem names
const FOODWASTE_KEYWORDS = {
  "kyllingebryst": "Kyllingefilet 600g",
  "kyllingefilet": "Kyllingefilet 600g",
  "kylling":       "Kyllingefilet 600g",
  "laks":          "Laks filet 400g",
  "hakket oksekød":"Hakket oksekød 500g",
  "oksekød":       "Hakket oksekød 500g",
  "mozzarella":    "Mozzarella 125g",
  "spinat":        "Spinat frisk 200g",
  "parmesan":      "Parmesan revet 80g",
  "gulerødder":    "Gulerødder 1kg",
  "gulerod":       "Gulerødder 1kg",
  "kartofler":     "Kartofler 2kg",
  "kartoffel":     "Kartofler 2kg",
  "fløde":         "Fløde 38% 0.5L",
  "spaghetti":     "Spaghetti 500g",
  "pasta":         "Pasta penne 500g",
  "penne":         "Pasta penne 500g",
  "ris":           "Ris 1kg",
  "æg":            "Æg 10 stk.",
  "basilikum":     "Basilikum",
  "dåsetomat":     "Dåsetomater 400g",
  "tomat":         "Dåsetomater 400g",
};

const STORE_BRANCHES = [
  // Rema 1000
  { name: "Rema 1000 Nørrebro",    chain: "Rema 1000", city: "Nørrebro",     zip: "2200" },
  { name: "Rema 1000 Østerbro",    chain: "Rema 1000", city: "Østerbro",     zip: "2100" },
  { name: "Rema 1000 Frederiksberg",chain:"Rema 1000", city: "Frederiksberg", zip: "2000" },
  { name: "Rema 1000 Vesterbro",   chain: "Rema 1000", city: "Vesterbro",    zip: "1620" },
  { name: "Rema 1000 Vanløse",     chain: "Rema 1000", city: "Vanløse",      zip: "2720" },
  { name: "Rema 1000 Aarhus C",    chain: "Rema 1000", city: "Aarhus",       zip: "8000" },
  { name: "Rema 1000 Odense C",    chain: "Rema 1000", city: "Odense",       zip: "5000" },
  { name: "Rema 1000 Aalborg",     chain: "Rema 1000", city: "Aalborg",      zip: "9000" },
  { name: "Rema 1000 Esbjerg",     chain: "Rema 1000", city: "Esbjerg",      zip: "6700" },
  { name: "Rema 1000 Horsens",     chain: "Rema 1000", city: "Horsens",      zip: "8700" },
  // Netto
  { name: "Netto Østerbro",        chain: "Netto", city: "Østerbro",         zip: "2100" },
  { name: "Netto Frederiksberg",   chain: "Netto", city: "Frederiksberg",    zip: "2000" },
  { name: "Netto Nørrebro",        chain: "Netto", city: "Nørrebro",         zip: "2200" },
  { name: "Netto Vesterbro",       chain: "Netto", city: "Vesterbro",        zip: "1620" },
  { name: "Netto Amager",          chain: "Netto", city: "Amager",           zip: "2300" },
  { name: "Netto Hellerup",        chain: "Netto", city: "Hellerup",         zip: "2900" },
  { name: "Netto Aarhus C",        chain: "Netto", city: "Aarhus",           zip: "8000" },
  { name: "Netto Odense C",        chain: "Netto", city: "Odense",           zip: "5000" },
  { name: "Netto Aalborg",         chain: "Netto", city: "Aalborg",          zip: "9000" },
  { name: "Netto Esbjerg",         chain: "Netto", city: "Esbjerg",          zip: "6700" },
  // Coop 365
  { name: "Coop 365 Lyngby",       chain: "Coop 365", city: "Lyngby",        zip: "2800" },
  { name: "Coop 365 Gentofte",     chain: "Coop 365", city: "Gentofte",      zip: "2820" },
  { name: "Coop 365 Gladsaxe",     chain: "Coop 365", city: "Gladsaxe",      zip: "2860" },
  { name: "Coop 365 Herlev",       chain: "Coop 365", city: "Herlev",        zip: "2730" },
  { name: "Coop 365 Taastrup",     chain: "Coop 365", city: "Taastrup",      zip: "2630" },
  { name: "Coop 365 Aarhus",       chain: "Coop 365", city: "Aarhus",        zip: "8000" },
  { name: "Coop 365 Odense",       chain: "Coop 365", city: "Odense",        zip: "5000" },
  { name: "Coop 365 Aalborg",      chain: "Coop 365", city: "Aalborg",       zip: "9000" },
  { name: "Coop 365 Randers",      chain: "Coop 365", city: "Randers",       zip: "8900" },
  { name: "Coop 365 Silkeborg",    chain: "Coop 365", city: "Silkeborg",     zip: "8600" },
  // Føtex
  { name: "Føtex Lyngby",          chain: "Føtex", city: "Lyngby",           zip: "2800" },
  { name: "Føtex Glostrup",        chain: "Føtex", city: "Glostrup",         zip: "2600" },
  { name: "Føtex Valby",           chain: "Føtex", city: "Valby",            zip: "2500" },
  { name: "Føtex Rødovre",         chain: "Føtex", city: "Rødovre",          zip: "2610" },
  { name: "Føtex Hvidovre",        chain: "Føtex", city: "Hvidovre",         zip: "2650" },
  { name: "Føtex Ballerup",        chain: "Føtex", city: "Ballerup",         zip: "2750" },
  { name: "Føtex Aarhus",          chain: "Føtex", city: "Aarhus",           zip: "8000" },
  { name: "Føtex Odense",          chain: "Føtex", city: "Odense",           zip: "5000" },
  { name: "Føtex Aalborg",         chain: "Føtex", city: "Aalborg",          zip: "9000" },
  { name: "Føtex Vejle",           chain: "Føtex", city: "Vejle",            zip: "7100" },
  // Bilka
  { name: "Bilka Hundige",         chain: "Bilka", city: "Hundige",          zip: "2670" },
  { name: "Bilka Ishøj",           chain: "Bilka", city: "Ishøj",            zip: "2635" },
  { name: "Bilka Roskildevej",     chain: "Bilka", city: "Brøndby",          zip: "2620" },
  { name: "Bilka Aarhus",          chain: "Bilka", city: "Aarhus",           zip: "8210" },
  { name: "Bilka Odense",          chain: "Bilka", city: "Odense",           zip: "5220" },
  { name: "Bilka Aalborg",         chain: "Bilka", city: "Aalborg",          zip: "9200" },
  { name: "Bilka Esbjerg",         chain: "Bilka", city: "Esbjerg",          zip: "6710" },
  { name: "Bilka Vejle",           chain: "Bilka", city: "Vejle",            zip: "7100" },
  { name: "Bilka Fredericia",      chain: "Bilka", city: "Fredericia",       zip: "7000" },
  { name: "Bilka Næstved",         chain: "Bilka", city: "Næstved",          zip: "4700" },
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

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return { week: Math.ceil(((d - yearStart) / 86400000 + 1) / 7), year: d.getUTCFullYear() };
}

function StorePickerContent({ search, onSearch, selected, onToggle }) {
  const q = search.toLowerCase();
  const filtered = STORE_BRANCHES.filter(s =>
    !q || s.name.toLowerCase().includes(q) || s.zip.includes(q) || s.city.toLowerCase().includes(q)
  );
  const grouped = CHAIN_ORDER
    .map(chain => ({ chain, stores: filtered.filter(s => s.chain === chain) }))
    .filter(g => g.stores.length > 0);

  return (
    <>
      <div className="store-search-wrap">
        <input
          className="store-search-input"
          type="text"
          placeholder="Søg by eller postnummer..."
          value={search}
          onChange={e => onSearch(e.target.value)}
          autoFocus
        />
      </div>
      <div className="store-branch-list">
        {grouped.map(g => (
          <div key={g.chain} className="chain-group">
            <div className="chain-group-label">
              <span className="chain-dot" style={{ background: CHAIN_COLORS[g.chain] }} />
              {g.chain}
            </div>
            {g.stores.map(s => {
              const checked = selected.has(s.name);
              return (
                <button
                  key={s.name}
                  className={`store-branch-item${checked ? " selected" : ""}`}
                  onClick={() => onToggle(s)}
                >
                  <div>
                    <span className="store-branch-name">{s.name}</span>
                    <span className="store-branch-city">{s.city}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="store-branch-zip">{s.zip}</span>
                    <span className={`store-check${checked ? " checked" : ""}`}>✓</span>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
        {grouped.length === 0 && (
          <p className="store-picker-empty">Ingen butikker fundet</p>
        )}
      </div>
    </>
  );
}

const stores = [
  {
    name: "Rema 1000", color: "#e63329",
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

const dietExcludeItems = {
  Alle: new Set(),
  Vegetar: new Set(["Hakket oksekød 500g", "Kyllingefilet 600g", "Laks filet 400g"]),
  Veganer: new Set(["Hakket oksekød 500g", "Kyllingefilet 600g", "Laks filet 400g", "Fløde 38% 0.5L", "Mozzarella 125g", "Parmesan revet 80g", "Æg 10 stk."]),
  Glutenfri: new Set(["Spaghetti 500g", "Pasta penne 500g"]),
  Mælkefri: new Set(["Fløde 38% 0.5L", "Mozzarella 125g", "Parmesan revet 80g"]),
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

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

export default function App() {
  const [localStores, setLocalStores] = useState(() => {
    try {
      const v = localStorage.getItem("localStores");
      if (v) return JSON.parse(v);
      // migrate from old single-store key
      const old = localStorage.getItem("localStore");
      if (old) { const s = JSON.parse(old); return s ? [s] : null; }
      return null;
    } catch { return null; }
  });
  const [showStorePicker, setShowStorePicker] = useState(false);
  const [storeSearch, setStoreSearch] = useState("");

  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [servings, setServings] = useState(4);
  const [shoppingList, setShoppingList] = useState([]);
  const [diet, setDiet] = useState(() => {
    try { return localStorage.getItem("defaultDiet") || "Alle"; } catch { return "Alle"; }
  });
  const [copied, setCopied] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("savedRecipes") || "[]"); }
    catch { return []; }
  });
  const [expandedSaved, setExpandedSaved] = useState(new Set());

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
  const [planCopied, setPlanCopied] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState(() => {
    try {
      const saved = localStorage.getItem("collapsedSections");
      if (saved) return JSON.parse(saved);
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

  // ── Live deals (Salling food-waste API) ─────────────────────────
  const [dealsData, setDealsData] = useState(null);
  const [dealsLoading, setDealsLoading] = useState(false);

  // ── Pantry ──────────────────────────────────────────────────────
  const [pantryItems, setPantryItems] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("pantryItems") || "null");
      return stored ? new Set(stored) : new Set();
    } catch { return new Set(); }
  });
  const [showPantry, setShowPantry] = useState(false);
  const [onlyMakeable, setOnlyMakeable] = useState(() => {
    try { return localStorage.getItem("onlyMakeable") === "true"; } catch { return false; }
  });

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

  // ── Fetch live food-waste deals from Salling API ─────────────────
  const localStoresKey = (localStores || []).map(s => s.name).join(",");
  useEffect(() => {
    const sallingStores = (localStores || []).filter(s => SALLING_BRANDS.has(s.chain));
    if (sallingStores.length === 0 || onboardingStep !== null) {
      setDealsData(null);
      return;
    }
    setDealsLoading(true);
    const zips = [...new Set(sallingStores.map(s => s.zip))].slice(0, 3);
    fetch(`/api/deals?zip=${zips.join(",")}`)
      .then(r => r.ok ? r.json() : [])
      .catch(() => [])
      .then(data => { setDealsData(Array.isArray(data) ? data : []); })
      .finally(() => setDealsLoading(false));
  }, [localStoresKey, onboardingStep]);

  // ── Matching ────────────────────────────────────────────────────
  function getAvailableItemNames() {
    const selectedChains = new Set((localStores || []).map(s => s.chain));
    return new Set(
      stores.filter(s => selectedChains.has(s.name)).flatMap(s => s.items.map(it => it.name))
    );
  }

  function getScoredRecipes(dietFilter) {
    const available = getAvailableItemNames();
    const excluded = dietExcludeItems[dietFilter];
    return recipeBank
      .filter(r => !r.dealItems.some(di => excluded.has(di.name)))
      .map(r => {
        const matched = r.dealItems.filter(di => available.has(di.name));
        return {
          ...r,
          matchCount: matched.length,
          fullyMatched: matched.length === r.dealItems.length,
        };
      });
  }

  const scoredRecipes = getScoredRecipes(diet);
  const recommended = scoredRecipes.filter(r => r.fullyMatched).sort((a, b) => b.dealItems.length - a.dealItems.length);
  const others = scoredRecipes.filter(r => !r.fullyMatched);

  function parseMinutes(timeStr) {
    const h = timeStr.match(/(\d+)\s*t/);
    const m = timeStr.match(/(\d+)\s*min/);
    return (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0);
  }
  const searchQ = search.toLowerCase();
  function matchRecipe(r) {
    if (onlyMakeable && !canMakeNow(r)) return false;
    if (cuisineFilter !== "Alle" && r.cuisine !== cuisineFilter) return false;
    if (search) {
      const cuisineFromKeyword = Object.entries(CUISINE_SEARCH_MAP).find(([kw]) => searchQ.includes(kw))?.[1];
      if (cuisineFromKeyword) {
        if (r.cuisine !== cuisineFromKeyword) return false;
      } else if (
        !r.title.toLowerCase().includes(searchQ) &&
        !(r.cuisine || "").toLowerCase().includes(searchQ) &&
        !r.ingredients.some(ing => (ing.text || ing).toLowerCase().includes(searchQ))
      ) {
        return false;
      }
    }
    const mins = parseMinutes(r.time);
    if (timeFilter === "Under 20 min" && mins >= 20) return false;
    if (timeFilter === "Under 45 min" && mins >= 45) return false;
    if (timeFilter === "Over 45 min" && mins < 45) return false;
    return true;
  }

  function sortByPantry(recipes) {
    if (pantryItems.size === 0) return recipes;
    return [...recipes].sort((a, b) => pantryScore(b) - pantryScore(a));
  }
  const filteredRecommended = sortByPantry(recommended.filter(matchRecipe));
  const filteredOthers = sortByPantry(others.filter(matchRecipe));
  const noResults = (search || timeFilter !== "Alle tider" || cuisineFilter !== "Alle" || onlyMakeable) && filteredRecommended.length === 0 && filteredOthers.length === 0;

  // ── Madspild helpers ────────────────────────────────────────────
  function matchDealToIngredient(deal) {
    const desc = (deal.description || "").toLowerCase();
    // Check multi-word keys first (longer → more specific)
    for (const [kw, ing] of Object.entries(FOODWASTE_KEYWORDS).sort((a, b) => b[0].length - a[0].length)) {
      if (desc.includes(kw)) return ing;
    }
    return null;
  }

  function isExpiringSoon(endTime) {
    if (!endTime) return false;
    const hours = (new Date(endTime) - Date.now()) / 3_600_000;
    return hours > 0 && hours <= 24;
  }

  const sallingStores = (localStores || []).filter(s => SALLING_BRANDS.has(s.chain));
  const hasSallingStores = sallingStores.length > 0;

  const madspildRecipes = useMemo(() => {
    if (!dealsData || dealsData.length === 0) return [];
    const ingredientDeals = new Map(); // dealItem name → best deal object
    for (const deal of dealsData) {
      const ing = matchDealToIngredient(deal);
      if (ing && !ingredientDeals.has(ing)) ingredientDeals.set(ing, deal);
    }
    return recipeBank
      .filter(r => r.dealItems.some(di => ingredientDeals.has(di.name)))
      .map(r => ({
        ...r,
        madspildDeals: r.dealItems
          .filter(di => ingredientDeals.has(di.name))
          .map(di => ({ name: di.name, deal: ingredientDeals.get(di.name) })),
      }))
      .sort((a, b) => b.madspildDeals.length - a.madspildDeals.length)
      .slice(0, 8);
  }, [dealsData]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setShoppingList([]);
  }

  // ── Shopping list ───────────────────────────────────────────────
  function addToShoppingList(text) {
    setShoppingList(prev => prev.includes(text) ? prev : [...prev, text]);
  }
  function removeFromShoppingList(i) {
    setShoppingList(prev => prev.filter((_, idx) => idx !== i));
  }
  function clearShoppingList() { setShoppingList([]); }

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
  function toggleExpanded(savedAt) {
    setExpandedSaved(prev => {
      const next = new Set(prev);
      next.has(savedAt) ? next.delete(savedAt) : next.add(savedAt);
      return next;
    });
  }

  // ── Share ───────────────────────────────────────────────────────
  async function shareRecipe(r) {
    const ingredientLines = r.ingredients.map(ing => ing.text || ing).join("\n");
    const text = `${r.title}\n\nIngredienser:\n${ingredientLines}\n\nFremgangsmåde:\n${r.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}${r.tip ? `\n\nTip: ${r.tip}` : ""}`;
    if (navigator.share) {
      await navigator.share({ title: r.title, text });
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // ── Scale ───────────────────────────────────────────────────────
  function scaleIngredient(text, baseServings, currentServings) {
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
      for (const ing of recipe.ingredients) {
        if (!ing.dealItem) continue;
        const di = recipe.dealItems.find(d => d.name === ing.dealItem);
        if (!di) continue;
        const store = di.store;
        const scaled = scaleIngredient(ing.text, recipe.servings_count || 4, sv);
        if (!byStore[store]) byStore[store] = {};
        if (!byStore[store][ing.dealItem]) byStore[store][ing.dealItem] = [];
        byStore[store][ing.dealItem].push(scaled);
      }
    }
    return Object.entries(byStore).map(([store, items]) => ({
      store,
      color: storeColorMap[store] || "#888",
      items: Object.entries(items).map(([dealItem, texts]) => ({
        dealItem,
        merged: mergeIngredientTexts(texts),
      })),
    }));
  }
  const combinedList = showCombinedList ? buildCombinedList() : [];
  const planCount = mealPlan.filter(Boolean).length;

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

  function toggleOnlyMakeable() {
    setOnlyMakeable(v => {
      const next = !v;
      try { localStorage.setItem("onlyMakeable", String(next)); } catch {}
      return next;
    });
  }

  function isIngCovered(ingText) {
    const lower = ingText.toLowerCase();
    if ([...ALWAYS_AVAILABLE].some(s => lower.includes(s))) return true;
    return [...pantryItems].some(p => lower.includes(p.toLowerCase()));
  }

  function canMakeNow(r) {
    if (pantryItems.size === 0) return false;
    return r.ingredients
      .filter(ing => !ing.dealItem)
      .every(ing => isIngCovered(ing.text || ing));
  }

  function pantryScore(r) {
    if (pantryItems.size === 0) return 0;
    return r.ingredients
      .filter(ing => !ing.dealItem)
      .filter(ing => isIngCovered(ing.text || ing))
      .length;
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
        .map(ch => STORE_BRANCHES.find(b => b.chain === ch))
        .filter(Boolean);
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

  // toggle in the modal — saves immediately
  function toggleStore(store) {
    setLocalStores(prev => {
      const names = new Set((prev || []).map(s => s.name));
      names.has(store.name) ? names.delete(store.name) : names.add(store.name);
      const next = STORE_BRANCHES.filter(s => names.has(s.name));
      localStorage.setItem("localStores", JSON.stringify(next));
      return next;
    });
  }

  const selectedNames = new Set((localStores || []).map(s => s.name));

  function storeHeaderLabel(list) {
    if (!list || list.length === 0) return "Ingen butik valgt";
    if (list.length === 1) return list[0].name;
    if (list.length === 2) return `${list[0].name} og ${list[1].name}`;
    return `${list[0].name} og ${list.length - 1} andre`;
  }

  const isRecipeSaved = selectedRecipe && savedRecipes.some(r => r.title === selectedRecipe.title);
  const weekBadge = `UGE ${getWeekNumber(new Date())} · ${new Date().getFullYear()}`;

  // ── Madspild card ────────────────────────────────────────────────
  function MadspildCard({ r }) {
    const inPlan = mealPlan.some(e => e?.recipe?.id === r.id);
    return (
      <div className="recipe-browse-card madspild-card" onClick={() => selectRecipe(r)}>
        <div className="card-badges">
          <span className="madspild-badge">🌱 Madspild</span>
        </div>
        <div className="recipe-category-tag">{r.emoji} {r.category}</div>
        {r.cuisine && <div className="cuisine-badge">{r.cuisine}</div>}
        <div className="recipe-browse-title">{r.title}</div>
        <div className="recipe-browse-meta">
          <span>⏱ {r.time}</span>
          <span>🥘 {r.ingredients.length} ing.</span>
        </div>
        <div className="madspild-deals-list">
          {r.madspildDeals.map(({ name, deal }) => (
            <div key={name} className="madspild-deal-row">
              <span className="madspild-deal-desc">{deal.description || name.replace(/ \d+.*$/, "")}</span>
              <span className="madspild-deal-pricing">
                {deal.originalPrice != null && (
                  <span className="madspild-original">{deal.originalPrice.toFixed(0)} kr</span>
                )}
                {deal.price != null && (
                  <span className="madspild-price">{deal.price.toFixed(0)} kr</span>
                )}
                {deal.discount != null && (
                  <span className="madspild-pct">-{deal.discount}%</span>
                )}
              </span>
              {isExpiringSoon(deal.endTime) && (
                <span className="madspild-expiry-pill">⚠ Udløber snart</span>
              )}
            </div>
          ))}
        </div>
        <button
          className={`add-to-plan-btn${inPlan ? " in-plan" : ""}`}
          onClick={e => { e.stopPropagation(); if (!inPlan) setAddingToPlan(r); }}
        >
          {inPlan ? "📅 I madplan" : "📅 Tilføj til madplan"}
        </button>
      </div>
    );
  }

  // ── Recipe card (browse) ────────────────────────────────────────
  function RecipeCard({ r }) {
    const inPlan = mealPlan.some(e => e?.recipe?.id === r.id);
    const isPopular = popularRecipes.slice(0, 3).some(p => p.id === r.id);
    const makeable = canMakeNow(r);
    return (
      <div
        className={`recipe-browse-card${r.fullyMatched ? " featured" : ""}`}
        onClick={() => selectRecipe(r)}
      >
        {(isPopular || makeable) && (
          <div className="card-badges">
            {isPopular && <span className="popular-badge-pill">🔥 Populær</span>}
            {makeable && <span className="makeable-badge">✓ Kan laves nu</span>}
          </div>
        )}
        <div className="recipe-category-tag">{r.emoji} {r.category}</div>
        {r.cuisine && <div className="cuisine-badge">{r.cuisine}</div>}
        <div className="recipe-browse-title">{r.title}</div>
        <div className="recipe-browse-meta">
          <span>⏱ {r.time}</span>
          <span>🥘 {r.ingredients.length} ing.</span>
        </div>
        <div className="recipe-deal-tags">
          {r.dealItems.map(di => {
            const available = getAvailableItemNames().has(di.name);
            return (
              <span
                key={di.name}
                className={`deal-item-tag${available ? " available" : " unavailable"}`}
              >
                <span className="deal-store-dot" style={{ background: storeColorMap[di.store] }} />
                {di.name.replace(/ \d+.*$/, "")}
              </span>
            );
          })}
        </div>
        <button
          className={`add-to-plan-btn${inPlan ? " in-plan" : ""}`}
          onClick={e => { e.stopPropagation(); if (!inPlan) setAddingToPlan(r); }}
          title={inPlan ? "Allerede i madplan" : "Tilføj til madplan"}
        >
          {inPlan ? "📅 I madplan" : "📅 Tilføj til madplan"}
        </button>
      </div>
    );
  }

  return (
    <div className="app">

      {/* ── Splash screen ──────────────────────────────────────── */}
      {showSplash && (
        <div className={`splash-screen${splashExiting ? " exiting" : ""}`}>
          <div className="splash-glow" />
          <div className="splash-ring" />
          <div className="splash-ring splash-ring-2" />
          <div className="splash-content">
            <div className="splash-icon">
              <LogoIcon size={100} />
            </div>
            <h1 className="splash-title">TilbudsKokken</h1>
            <p className="splash-tagline">BEDRE TILBUD. BEDRE MAD.</p>
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
                <LogoFull size="lg" className="ob-welcome-logo" />
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
                </div>
              )}

              {/* Step 2 — Dietary preference */}
              {onboardingStep === 2 && (
                <div className="ob-content" key="s2">
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
                <div className="ob-content" key="s3">
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
              <h2 className="sp-title">Dine butikker</h2>
              <button className="sp-close-btn" onClick={() => { setShowStorePicker(false); setStoreSearch(""); }}>×</button>
            </div>
            <p className="sp-desc" style={{ margin: "0 0 1rem" }}>Klik for at tilføje eller fjerne butikker.</p>
            <StorePickerContent
              search={storeSearch}
              onSearch={setStoreSearch}
              selected={selectedNames}
              onToggle={toggleStore}
            />
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

      {/* Pantry modal */}
      {showPantry && (
        <div className="pantry-overlay" onClick={e => e.target === e.currentTarget && setShowPantry(false)}>
          <div className="pantry-sheet">
            <div className="pantry-sheet-header">
              <h2 className="pantry-sheet-title">🧺 Hvad har jeg derhjemme?</h2>
              <button className="sp-close-btn" onClick={() => setShowPantry(false)}>×</button>
            </div>

            <div className="pantry-controls">
              <div className="pantry-makeable-row">
                <span className="pantry-makeable-label">Vis kun opskrifter jeg kan lave nu</span>
                <div
                  className={`pantry-toggle-switch${onlyMakeable ? " on" : ""}`}
                  onClick={toggleOnlyMakeable}
                  role="switch"
                  aria-checked={onlyMakeable}
                >
                  <div className="pantry-toggle-track" />
                  <div className="pantry-toggle-thumb" />
                </div>
              </div>
              {pantryItems.size > 0 && (
                <button className="pantry-clear-btn" onClick={clearPantry}>
                  Ryd ({pantryItems.size})
                </button>
              )}
            </div>

            <div className="pantry-body">
              {PANTRY_CATEGORIES.map(cat => (
                <div key={cat.id} className="pantry-category">
                  <div className="pantry-cat-label">{cat.label}</div>
                  <div className="pantry-chips">
                    {cat.items.map(item => {
                      const selected = pantryItems.has(item);
                      return (
                        <button
                          key={item}
                          className={`pantry-chip${selected ? " selected" : ""}`}
                          onClick={() => togglePantryItem(item)}
                        >
                          {selected && <span className="pantry-chip-check">✓</span>}
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hero banner */}
      <div className="app-hero">
        <div className="app-header-deco-1" />
        <div className="app-header-deco-2" />

        {/* Top bar: small brand left + controls right */}
        <div className="hero-topbar">
          <div className="hero-brand">
            <LogoIcon size={28} />
            <span className="hero-brand-name">TilbudsKokken</span>
          </div>
          <div className="header-actions">
            <button className="header-icon-btn" onClick={openSettings} title="Indstillinger">⚙</button>
          </div>
        </div>

        {/* Logo hero — centered, full logo with wordmark + tagline */}
        <div className="hero-center">
          <LogoFull size="lg" />
          <div className="week-badge">{weekBadge}</div>
        </div>

        <div className="local-store-badge">
          <span className="local-store-dots">
            {[...new Set((localStores || []).map(s => s.chain))].map(ch => (
              <span key={ch} className="chain-dot" style={{ background: CHAIN_COLORS[ch] }} />
            ))}
          </span>
          <span>{localStores && localStores.length > 1 ? "Dine butikker:" : "Din butik:"} <strong>{storeHeaderLabel(localStores)}</strong></span>
          <button className="skift-btn" onClick={() => { setShowStorePicker(true); setStoreSearch(""); }}>skift</button>
        </div>
      </div>

      {/* Search */}
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

      {/* Diet filters */}
      <div className="diet-filters">
        {dietFilters.map(f => (
          <button key={f} onClick={() => setDiet(f)} className={`diet-btn${diet === f ? " active" : ""}`}>{f}</button>
        ))}
      </div>

      {/* Time filters */}
      <div className="diet-filters time-filters">
        {timeFilters.map(f => (
          <button key={f} onClick={() => setTimeFilter(f)} className={`diet-btn${timeFilter === f ? " active" : ""}`}>{f}</button>
        ))}
      </div>

      {/* Cuisine filters */}
      {CUISINE_ORDER.length > 2 && (
        <div className="cuisine-filters">
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
      )}

      {/* Pantry trigger */}
      <button
        className={`pantry-trigger-btn${pantryItems.size > 0 ? " has-items" : ""}`}
        onClick={() => setShowPantry(true)}
      >
        <span>🧺 Hvad har jeg derhjemme?</span>
        {pantryItems.size > 0 ? (
          <span className="pantry-count-badge">{pantryItems.size} varer</span>
        ) : (
          <span className="pantry-trigger-meta">Tilpas opskrifter til dit køleskab</span>
        )}
      </button>

      {/* Detail view */}
      {selectedRecipe ? (
        <div className="recipe-detail-sheet">
          <button className="back-btn" onClick={() => { setSelectedRecipe(null); setShoppingList([]); }}>
            ← Tilbage til opskrifter
          </button>

          <div className="recipe-card">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
              <div>
                <h2 className="recipe-title" style={{ margin: 0 }}>{selectedRecipe.title}</h2>
                {selectedRecipe.subtitle && <p className="recipe-subtitle">{selectedRecipe.subtitle}</p>}
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button
                  className="share-btn"
                  onClick={() => shareRecipe(selectedRecipe)}
                  title="Del opskrift"
                >
                  {copied ? "✓" : "↗"} <span>{copied ? "Kopieret!" : "Del"}</span>
                </button>
                <button
                  className={`save-btn${isRecipeSaved ? " saved" : ""}`}
                  onClick={() => !isRecipeSaved && saveRecipe(selectedRecipe)}
                  title={isRecipeSaved ? "Gemt" : "Gem opskrift"}
                >
                  🔖 <span>{isRecipeSaved ? "Gemt" : "Gem"}</span>
                </button>
                {(() => {
                  const inPlan = mealPlan.some(e => e?.recipe?.id === selectedRecipe.id);
                  return (
                    <button
                      className={`add-to-plan-btn detail${inPlan ? " in-plan" : ""}`}
                      onClick={() => !inPlan && setAddingToPlan(selectedRecipe)}
                    >
                      📅 <span>{inPlan ? "I madplan" : "Madplan"}</span>
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* Deal items used */}
            <div className="recipe-deal-tags" style={{ marginBottom: 12 }}>
              {selectedRecipe.dealItems.map(di => (
                <span key={di.name} className="deal-item-tag available">
                  <span className="deal-store-dot" style={{ background: storeColorMap[di.store] }} />
                  {di.name} · {di.store}
                </span>
              ))}
            </div>

            {/* Live madspild pricing banner */}
            {selectedRecipe.madspildDeals && selectedRecipe.madspildDeals.length > 0 && (
              <div className="madspild-detail-banner">
                <div className="madspild-detail-banner-title">🌱 Madspild — aktuelle priser</div>
                {selectedRecipe.madspildDeals.map(({ name, deal }) => (
                  <div key={name} className="madspild-detail-row">
                    <span className="madspild-detail-desc">{deal.description || name}</span>
                    <span className="madspild-detail-pricing">
                      {deal.originalPrice != null && <s className="madspild-detail-original">{deal.originalPrice.toFixed(2)} kr</s>}
                      {deal.price != null && <strong className="madspild-detail-price">{deal.price.toFixed(2)} kr</strong>}
                      {deal.discount != null && <span className="madspild-detail-pct">-{deal.discount}%</span>}
                    </span>
                    {isExpiringSoon(deal.endTime) && (
                      <span className="madspild-expiry-pill">⚠ Udløber snart</span>
                    )}
                    {deal.store && <span className="madspild-detail-store">{deal.store}</span>}
                  </div>
                ))}
              </div>
            )}

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

            <div className="section-label">Ingredienser</div>
            <ul className="ingredient-grid">
              {selectedRecipe.ingredients.map((ing, i) => {
                const scaled = scaleIngredient(ing.text || ing, selectedRecipe.servings_count || 4, servings);
                const isDeal = !!(ing.dealItem);
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
                      {scaled}
                    </span>
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
                <button className="btn-outline" onClick={clearShoppingList}>Ryd liste</button>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {shoppingList.map((item, i) => (
                  <li key={i} className="shopping-item">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="shopping-item-dot" />
                      {item}
                    </div>
                    <button className="shopping-item-remove" onClick={() => removeFromShoppingList(i)}>×</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        /* Browse view */
        <>
          {/* ── Madspild section ──────────────────────────────── */}
          {hasSallingStores ? (
            <div className="madspild-section">
              <div className="madspild-section-header">
                <div className="madspild-icon">🌱</div>
                <div>
                  <h2 className="madspild-title">Madspild</h2>
                  <p className="madspild-tagline">Lav mad på varer der skal bruges nu — spar penge og reducer madspild</p>
                </div>
              </div>

              {dealsLoading ? (
                <div className="madspild-loading">
                  <div className="madspild-dots"><span /><span /><span /></div>
                  <p>Henter aktuelle madspildstilbud…</p>
                </div>
              ) : madspildRecipes.length > 0 ? (
                <div className="recipe-browse-grid">
                  {madspildRecipes.map(r => <MadspildCard key={r.id} r={r} />)}
                </div>
              ) : dealsData !== null ? (
                <p className="madspild-empty">Ingen madspildstilbud fundet i dine butikker lige nu — tjek igen senere.</p>
              ) : null}
            </div>
          ) : (
            <div className="madspild-cta">
              <span className="madspild-cta-icon">🌱</span>
              <span className="madspild-cta-text">Tilføj Netto eller Føtex for at se madspildstilbud</span>
              <button className="madspild-cta-btn" onClick={() => { setShowStorePicker(true); setStoreSearch(""); }}>
                Tilføj butik
              </button>
            </div>
          )}

          {filteredRecommended.length > 0 && (
            <div className="recipe-browse-section">
              <button
                className="section-toggle-btn"
                onClick={() => toggleSection("recommended")}
                aria-expanded={!collapsedSections.recommended}
              >
                <span className="section-toggle-label">⭐ Denne uges anbefalinger</span>
                <span className="section-count-badge">{filteredRecommended.length} opskrifter</span>
                <svg
                  className={`section-chevron${collapsedSections.recommended ? "" : " open"}`}
                  width="16" height="16" viewBox="0 0 16 16" fill="none"
                  aria-hidden="true"
                >
                  <path d="M4 6 L8 10 L12 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className={`section-body-wrap${collapsedSections.recommended ? " collapsed" : ""}`}>
                <div className="section-body-inner">
                  <div className="recipe-browse-grid section-body-grid">
                    {filteredRecommended.map(r => <RecipeCard key={r.id} r={r} />)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {filteredOthers.length > 0 && (
            <div className="recipe-browse-section">
              <button
                className="section-toggle-btn"
                onClick={() => toggleSection("others")}
                aria-expanded={!collapsedSections.others}
              >
                <span className="section-toggle-label">Kræver andre butikker</span>
                <span className="section-count-badge">{filteredOthers.length} opskrifter</span>
                <svg
                  className={`section-chevron${collapsedSections.others ? "" : " open"}`}
                  width="16" height="16" viewBox="0 0 16 16" fill="none"
                  aria-hidden="true"
                >
                  <path d="M4 6 L8 10 L12 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className={`section-body-wrap${collapsedSections.others ? " collapsed" : ""}`}>
                <div className="section-body-inner">
                  <div className="recipe-browse-grid section-body-grid">
                    {filteredOthers.map(r => <RecipeCard key={r.id} r={r} />)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {noResults && (
            <div className="empty-state">Ingen opskrifter fundet</div>
          )}
          {!noResults && scoredRecipes.length === 0 && (
            <div className="empty-state">Ingen opskrifter matcher det valgte filter</div>
          )}
        </>
      )}

      {/* Meal plan */}
      {planCount > 0 && (
        <div className="meal-plan-card">
          <div className="meal-plan-header">
            <div className="section-label" style={{ margin: 0 }}>📅 Madplan · {planCount} {planCount === 1 ? "dag" : "dage"}</div>
            <div className="meal-plan-header-btns">
              <button
                className={`share-plan-btn${planCopied ? " copied" : ""}`}
                onClick={shareMealPlan}
              >
                {planCopied ? "✓ Kopieret!" : "Del madplan"}
              </button>
              <button
                className="combined-list-btn"
                onClick={() => setShowCombinedList(v => !v)}
              >
                {showCombinedList ? "Skjul" : "Indkøbsliste"}
              </button>
            </div>
          </div>

          <div className="meal-plan-grid">
            {mealPlan.map((entry, i) => (
              <div
                key={i}
                className={`meal-plan-day${entry ? " filled" : " empty"}${dragFromDay === i ? " dragging" : ""}`}
                draggable={!!entry}
                onDragStart={() => setDragFromDay(i)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDayDrop(i)}
                onDragEnd={() => setDragFromDay(null)}
              >
                <div className="meal-plan-day-name">{DAY_SHORT[i]}</div>
                {entry ? (
                  <>
                    <div className="meal-plan-emoji">{entry.recipe.emoji}</div>
                    <div className="meal-plan-recipe-title">{entry.recipe.title}</div>
                    <div className="meal-plan-recipe-meta">⏱ {entry.recipe.time}</div>
                    <div className="meal-plan-servings">
                      <button className="plan-sv-btn" onClick={() => setPlanServings(i, Math.max(1, entry.servings - 1))}>−</button>
                      <span>{entry.servings}</span>
                      <button className="plan-sv-btn" onClick={() => setPlanServings(i, Math.min(10, entry.servings + 1))}>+</button>
                    </div>
                    <button className="meal-plan-remove" onClick={() => removeFromPlan(i)} title="Fjern">×</button>
                  </>
                ) : (
                  <div className="meal-plan-empty-label">Ledig</div>
                )}
              </div>
            ))}
          </div>

          {showCombinedList && (
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
      )}

      {/* Saved recipes */}
      {savedRecipes.length > 0 && (
        <div className="saved-recipes-card">
          <div className="section-label" style={{ margin: "0 0 12px" }}>
            🔖 Gemte opskrifter · {savedRecipes.length}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {savedRecipes.map(r => {
              const open = expandedSaved.has(r.savedAt);
              return (
                <div key={r.savedAt} className="saved-recipe-row">
                  <div className="saved-recipe-header" onClick={() => toggleExpanded(r.savedAt)}>
                    <div>
                      <div className="saved-recipe-title">{r.title}</div>
                      <div className="saved-recipe-meta">⏱ {r.time} · 👥 {r.servings_count || 4} personer</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="saved-recipe-chevron">{open ? "▲" : "▼"}</span>
                      <button className="saved-recipe-delete" onClick={e => { e.stopPropagation(); deleteSavedRecipe(r.savedAt); }}>×</button>
                    </div>
                  </div>
                  {open && (
                    <div className="saved-recipe-body">
                      <div className="section-label" style={{ margin: "0 0 8px" }}>Ingredienser</div>
                      <ul className="ingredient-grid" style={{ marginBottom: "1rem" }}>
                        {r.ingredients.map((ing, i) => (
                          <li key={i} className="ingredient-item" style={{ gap: 6 }}>
                            <span style={{ width: 5, height: 5, background: ing.dealItem ? "#4a7050" : "#c0c0c0", borderRadius: "50%", flexShrink: 0, display: "inline-block" }} />
                            {ing.text || ing}
                          </li>
                        ))}
                      </ul>
                      <div className="section-label" style={{ margin: "0 0 8px" }}>Fremgangsmåde</div>
                      <ol style={{ listStyle: "none", padding: 0, margin: "0 0 1rem" }}>
                        {r.steps.map((step, i) => (
                          <li key={i} className="step-item">
                            <span className="step-number">{i + 1}</span>{step}
                          </li>
                        ))}
                      </ol>
                      {r.tip && <div className="recipe-tip"><strong>Tips:</strong> {r.tip}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
