import { useState } from "react";
import "./App.css";
import { recipeBank } from "./recipes";

const CHAIN_COLORS = {
  "Netto": "#e6a800",
  "Føtex": "#0055a5",
  "Bilka": "#c0141b",
  "Rema 1000": "#e63329",
  "Coop 365": "#0066cc",
};

const CHAIN_ORDER = ["Rema 1000", "Netto", "Coop 365", "Føtex", "Bilka"];

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
  const [pendingStores, setPendingStores] = useState(new Set()); // used during onboarding
  const [showStorePicker, setShowStorePicker] = useState(false);
  const [storeSearch, setStoreSearch] = useState("");

  const [activeStores, setActiveStores] = useState(new Set([0, 1, 2]));
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [servings, setServings] = useState(4);
  const [shoppingList, setShoppingList] = useState([]);
  const [diet, setDiet] = useState("Alle");
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

  const dietFilters = ["Alle", "Vegetar", "Veganer", "Glutenfri", "Mælkefri"];

  // ── Matching ────────────────────────────────────────────────────
  function getAvailableItemNames(storeSet) {
    return new Set(
      stores.filter((_, i) => storeSet.has(i)).flatMap(s => s.items.map(it => it.name))
    );
  }

  function getScoredRecipes(storeSet, dietFilter) {
    const available = getAvailableItemNames(storeSet);
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

  const scoredRecipes = getScoredRecipes(activeStores, diet);
  const recommended = scoredRecipes.filter(r => r.fullyMatched).sort((a, b) => b.dealItems.length - a.dealItems.length);
  const others = scoredRecipes.filter(r => !r.fullyMatched);

  // ── Recipe selection ────────────────────────────────────────────
  function selectRecipe(r) {
    setSelectedRecipe(r);
    setServings(r.servings_count || 4);
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

  // toggle during onboarding (pending, not saved yet)
  function togglePending(store) {
    setPendingStores(prev => {
      const next = new Set(prev);
      next.has(store.name) ? next.delete(store.name) : next.add(store.name);
      return next;
    });
  }

  // confirm onboarding selection
  function confirmOnboarding() {
    const selected = STORE_BRANCHES.filter(s => pendingStores.has(s.name));
    setLocalStores(selected);
    localStorage.setItem("localStores", JSON.stringify(selected));
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

  // ── Onboarding (first visit, no stores chosen yet) ───────────────
  if (!localStores) {
    return (
      <div className="app">
        <header className="app-header">
          <div className="app-header-deco-1" />
          <div className="app-header-deco-2" />
          <div className="week-badge">{weekBadge}</div>
          <h1 className="app-title">Tilbudskokken</h1>
          <p className="app-subtitle">Opskrifter baseret på ugens tilbud – lige fra dine butikker</p>
        </header>
        <div className="store-picker-onboarding">
          <h2 className="sp-title">Vælg dine lokale butikker</h2>
          <p className="sp-desc">Vælg én eller flere butikker du handler i. Du kan altid ændre det senere.</p>
          <StorePickerContent
            search={storeSearch}
            onSearch={setStoreSearch}
            selected={pendingStores}
            onToggle={togglePending}
          />
          <button
            className="sp-confirm-btn"
            disabled={pendingStores.size === 0}
            onClick={confirmOnboarding}
          >
            Fortsæt med {pendingStores.size > 0 ? `${pendingStores.size} butik${pendingStores.size !== 1 ? "ker" : ""}` : "valgte butikker"} →
          </button>
        </div>
      </div>
    );
  }

  // ── Recipe card (browse) ────────────────────────────────────────
  function RecipeCard({ r }) {
    const inPlan = mealPlan.some(e => e?.recipe?.id === r.id);
    return (
      <div
        className={`recipe-browse-card${r.fullyMatched ? " featured" : ""}`}
        onClick={() => selectRecipe(r)}
      >
        <div className="recipe-category-tag">{r.emoji} {r.category}</div>
        <div className="recipe-browse-title">{r.title}</div>
        <div className="recipe-browse-meta">
          <span>⏱ {r.time}</span>
          <span>🥘 {r.ingredients.length} ing.</span>
        </div>
        <div className="recipe-deal-tags">
          {r.dealItems.map(di => {
            const available = getAvailableItemNames(activeStores).has(di.name);
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

      {/* Header */}
      <header className="app-header">
        <div className="app-header-deco-1" />
        <div className="app-header-deco-2" />
        <div className="week-badge">{weekBadge}</div>
        <h1 className="app-title">Tilbudskokken</h1>
        <p className="app-subtitle">50 opskrifter bygget på ugens tilbud</p>
        <div className="local-store-badge">
          <span className="local-store-dots">
            {[...new Set((localStores || []).map(s => s.chain))].map(ch => (
              <span key={ch} className="chain-dot" style={{ background: CHAIN_COLORS[ch] }} />
            ))}
          </span>
          <span>{localStores && localStores.length > 1 ? "Dine butikker:" : "Din butik:"} <strong>{storeHeaderLabel(localStores)}</strong></span>
          <button className="skift-btn" onClick={() => { setShowStorePicker(true); setStoreSearch(""); }}>skift</button>
        </div>
      </header>

      {/* Store selector */}
      <div className="store-selector">
        {stores.map((store, si) => (
          <button
            key={si}
            className={`store-toggle${activeStores.has(si) ? " active" : ""}`}
            onClick={() => {
              const next = new Set(activeStores);
              next.has(si) ? next.delete(si) : next.add(si);
              setActiveStores(next);
            }}
          >
            <span className="store-dot" style={{ background: store.color }} />
            {store.name}
          </button>
        ))}
      </div>

      {/* Diet filters */}
      <div className="diet-filters">
        {dietFilters.map(f => (
          <button
            key={f}
            onClick={() => setDiet(f)}
            className={`diet-btn${diet === f ? " active" : ""}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Detail view */}
      {selectedRecipe ? (
        <>
          <button className="back-btn" onClick={() => { setSelectedRecipe(null); setShoppingList([]); }}>
            ← Tilbage til opskrifter
          </button>

          <div className="recipe-card">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
              <h2 className="recipe-title" style={{ margin: 0 }}>{selectedRecipe.title}</h2>
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

            <div className="recipe-meta-bar">
              <span>⏱ {selectedRecipe.time}</span>
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

            {selectedRecipe.tip && (
              <div className="recipe-tip"><strong>Tips:</strong> {selectedRecipe.tip}</div>
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
        </>
      ) : (
        /* Browse view */
        <>
          {recommended.length > 0 && (
            <div className="recipe-browse-section">
              <h2 className="section-title">⭐ Denne uges anbefalinger · {recommended.length}</h2>
              <div className="recipe-browse-grid">
                {recommended.map(r => <RecipeCard key={r.id} r={r} />)}
              </div>
            </div>
          )}

          {others.length > 0 && (
            <div className="recipe-browse-section">
              <h2 className="section-title">Kræver andre butikker · {others.length}</h2>
              <div className="recipe-browse-grid">
                {others.map(r => <RecipeCard key={r.id} r={r} />)}
              </div>
            </div>
          )}

          {scoredRecipes.length === 0 && (
            <div className="empty-state">Ingen opskrifter matcher det valgte filter</div>
          )}
        </>
      )}

      {/* Meal plan */}
      {planCount > 0 && (
        <div className="meal-plan-card">
          <div className="meal-plan-header">
            <div className="section-label" style={{ margin: 0 }}>📅 Madplan · {planCount} {planCount === 1 ? "dag" : "dage"}</div>
            <button
              className="combined-list-btn"
              onClick={() => setShowCombinedList(v => !v)}
            >
              {showCombinedList ? "Skjul indkøbsliste" : "Samlet indkøbsliste"}
            </button>
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
