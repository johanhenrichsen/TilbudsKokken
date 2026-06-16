import { useState, useEffect, useMemo } from "react";
import "./App.css";
import { recipeBank } from "./recipes";
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
  "SuperBrugsen / Kvickly":   "#00853F",
  "Dagli'Brugsen / Brugsen":  "#00853F",
  // Independent / wholesale
  "Meny":                     "#00853F",
  "Spar":                     "#00853F",
  // International discounters
  "Lidl":                     "#0050AA",
};

const CHAIN_ORDER = [
  // Salling Group
  "Netto", "Føtex", "Bilka",
  // Rema
  "Rema 1000",
  // Coop
  "Coop 365", "SuperBrugsen / Kvickly", "Dagli'Brugsen / Brugsen",
  // Independent / wholesale
  "Meny", "Spar",
  // International discounters
  "Lidl",
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

function calcRecipePrice(recipe, forServings) {
  const base = recipe.dealItems.reduce((sum, di) => sum + (itemPriceMap[di.name] ?? 0), 0);
  if (base === 0) return null;
  return base * (forServings / (recipe.servings_count || 4));
}

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


export default function App() {
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
  const [checkedItems, setCheckedItems] = useState(new Set());
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
      setCheckedItems(c => { const s = new Set(c); s.delete(removed); return s; });
      try { localStorage.setItem("shoppingList", JSON.stringify(next)); } catch {}
      return next;
    });
  }
  function clearShoppingList() {
    setShoppingList([]);
    setCheckedItems(new Set());
    try { localStorage.removeItem("shoppingList"); } catch {}
  }
  function toggleCheckedItem(item) {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item); else next.add(item);
      return next;
    });
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

  useEffect(() => {
    document.body.classList.toggle("has-mp-sidebar", planCount > 0);
  }, [planCount]);

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

  const selectedChains = new Set((localStores || []).map(s => s.chain));

  function storeHeaderLabel(list) {
    if (!list || list.length === 0) return "Ingen butik valgt";
    if (list.length === 1) return list[0].chain;
    if (list.length === 2) return `${list[0].chain} og ${list[1].chain}`;
    return `${list[0].chain} og ${list.length - 1} andre`;
  }

  const isRecipeSaved = selectedRecipe && savedRecipes.some(r => r.title === selectedRecipe.title);
  const weekBadge = `UGE ${getISOWeek(new Date()).week} · ${new Date().getFullYear()}`;

  // ── Recipe card (browse) ────────────────────────────────────────
  function RecipeCard({ r }) {
    const inPlan = mealPlan.some(e => e?.recipe?.id === r.id);
    const isSaved = savedRecipes.some(s => s.title === r.title);
    const isPopular = popularRecipes.slice(0, 3).some(p => p.id === r.id);
    const makeable = canMakeNow(r);
    const cardPrice = calcRecipePrice(r, r.servings_count || 4);
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
        {cardPrice != null && (
          <div className="recipe-card-price">
            ca. {Math.round(cardPrice)} kr.
            <span className="recipe-card-price-pp"> · {Math.round(cardPrice / (r.servings_count || 4))} kr. pr. person</span>
          </div>
        )}
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
        <div className="card-action-row">
          <button
            className={`add-to-plan-btn${inPlan ? " in-plan" : ""}`}
            onClick={e => { e.stopPropagation(); if (!inPlan) setAddingToPlan(r); }}
            title={inPlan ? "Allerede i madplan" : "Tilføj til madplan"}
          >
            {inPlan ? "📅 I madplan" : "📅 Tilføj til madplan"}
          </button>
          <button
            className={`card-save-btn${isSaved ? " saved" : ""}`}
            onClick={e => { e.stopPropagation(); toggleSaveRecipe(r); }}
            title={isSaved ? "Fjern fra gemte" : "Gem opskrift"}
          >🔖</button>
        </div>
      </div>
    );
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
              <LogoFull size="4xl" />
            </div>
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
              <h2 className="sp-title">Dine butikker</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {selectedChains.size < CHAIN_ORDER.length && (
                  <button className="sp-clear-btn" onClick={selectAllStores}>Vælg alle</button>
                )}
                {selectedChains.size > 0 && (
                  <button className="sp-clear-btn" onClick={clearStores}>Ryd</button>
                )}
                <button className="sp-close-btn" onClick={() => setShowStorePicker(false)}>×</button>
              </div>
            </div>
            <p className="sp-desc" style={{ margin: "0 0 1rem" }}>Vælg de kæder du handler i.</p>
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

      {/* Slim app header */}
      <div className="app-hero">
        <div className="hero-topbar">
          <div className="hero-brand">
            <LogoIcon size={30} />
            <span className="hero-brand-name">Spotkøkken</span>
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

        <div className="local-store-badge">
          <span className="local-store-dots">
            {[...new Set((localStores || []).map(s => s.chain))].map(ch => (
              <span key={ch} className="chain-dot" style={{ background: CHAIN_COLORS[ch] }} />
            ))}
          </span>
          <span>{localStores && localStores.length > 1 ? "Dine butikker:" : "Din butik:"} <strong>{storeHeaderLabel(localStores)}</strong></span>
          <button className="skift-btn" onClick={() => setShowStorePicker(true)}>skift</button>
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
                  className="share-btn"
                  onClick={() => shareRecipe(selectedRecipe)}
                  title="Del opskrift"
                >
                  {copied ? "✓" : "↗"} <span>{copied ? "Kopieret!" : "Del"}</span>
                </button>
                <button
                  className={`save-btn${isRecipeSaved ? " saved" : ""}`}
                  onClick={() => toggleSaveRecipe(selectedRecipe)}
                  title={isRecipeSaved ? "Fjern fra gemte" : "Gem opskrift"}
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
              const price = calcRecipePrice(selectedRecipe, servings);
              if (price == null) return null;
              return (
                <div className="recipe-detail-price">
                  ca. {Math.round(price)} kr.
                  <span className="recipe-detail-price-pp"> · {Math.round(price / servings)} kr. pr. person</span>
                </div>
              );
            })()}

            {selectedRecipe.description && (
              <p className="recipe-description">{selectedRecipe.description}</p>
            )}

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
      <div className="saved-sheet" onClick={e => e.stopPropagation()}>
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
        )}
      </div>
    </div>
  )}

  {/* Shopping list bottom sheet */}
  {showShoppingSheet && (
    <div className="mp-sheet-overlay" onClick={() => setShowShoppingSheet(false)}>
      <div className="shopping-sheet" onClick={e => e.stopPropagation()}>
        <div className="mp-sheet-drag-handle" />
        <div className="shopping-sheet-header">
          <div className="shopping-sheet-title">🛒 Indkøbsliste</div>
          <button className="mp-sheet-close" onClick={() => setShowShoppingSheet(false)}>×</button>
        </div>
        <ul className="shopping-sheet-list">
          {shoppingList.map((item, i) => {
            const checked = checkedItems.has(item);
            return (
              <li key={i} className={`shopping-sheet-item${checked ? " checked" : ""}`}>
                <button className="shopping-check-btn" onClick={() => toggleCheckedItem(item)} aria-label={checked ? "Fjern hak" : "Sæt hak"}>
                  {checked ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2,7 6,11 12,3"/>
                    </svg>
                  ) : null}
                </button>
                <span className="shopping-sheet-text">{item}</span>
                <button className="shopping-item-remove" onClick={() => removeFromShoppingList(i)}>×</button>
              </li>
            );
          })}
        </ul>
        <div className="shopping-sheet-footer">
          <button className="mp-clear-btn" onClick={clearShoppingList}>Ryd liste</button>
        </div>
      </div>
    </div>
  )}
    </>
  );
}
