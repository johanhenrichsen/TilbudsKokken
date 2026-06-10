import { useState } from "react";
import "./App.css";
import { recipeBank } from "./recipes";

const CHAIN_COLORS = { Netto: "#e6a800", Føtex: "#0055a5", Bilka: "#c0141b" };

const STORE_BRANCHES = [
  { name: "Netto Østerbro",     chain: "Netto", city: "Østerbro",     zip: "2100" },
  { name: "Netto Frederiksberg",chain: "Netto", city: "Frederiksberg", zip: "2000" },
  { name: "Netto Nørrebro",     chain: "Netto", city: "Nørrebro",     zip: "2200" },
  { name: "Netto Vesterbro",    chain: "Netto", city: "Vesterbro",    zip: "1620" },
  { name: "Netto Amager",       chain: "Netto", city: "Amager",       zip: "2300" },
  { name: "Netto Hellerup",     chain: "Netto", city: "Hellerup",     zip: "2900" },
  { name: "Netto Aarhus C",     chain: "Netto", city: "Aarhus",       zip: "8000" },
  { name: "Netto Odense C",     chain: "Netto", city: "Odense",       zip: "5000" },
  { name: "Netto Aalborg",      chain: "Netto", city: "Aalborg",      zip: "9000" },
  { name: "Netto Esbjerg",      chain: "Netto", city: "Esbjerg",      zip: "6700" },
  { name: "Føtex Lyngby",       chain: "Føtex", city: "Lyngby",       zip: "2800" },
  { name: "Føtex Glostrup",     chain: "Føtex", city: "Glostrup",     zip: "2600" },
  { name: "Føtex Valby",        chain: "Føtex", city: "Valby",        zip: "2500" },
  { name: "Føtex Rødovre",      chain: "Føtex", city: "Rødovre",      zip: "2610" },
  { name: "Føtex Hvidovre",     chain: "Føtex", city: "Hvidovre",     zip: "2650" },
  { name: "Føtex Ballerup",     chain: "Føtex", city: "Ballerup",     zip: "2750" },
  { name: "Føtex Aarhus",       chain: "Føtex", city: "Aarhus",       zip: "8000" },
  { name: "Føtex Odense",       chain: "Føtex", city: "Odense",       zip: "5000" },
  { name: "Føtex Aalborg",      chain: "Føtex", city: "Aalborg",      zip: "9000" },
  { name: "Føtex Vejle",        chain: "Føtex", city: "Vejle",        zip: "7100" },
  { name: "Bilka Hundige",      chain: "Bilka", city: "Hundige",      zip: "2670" },
  { name: "Bilka Ishøj",        chain: "Bilka", city: "Ishøj",        zip: "2635" },
  { name: "Bilka Roskildevej",  chain: "Bilka", city: "Brøndby",      zip: "2620" },
  { name: "Bilka Aarhus",       chain: "Bilka", city: "Aarhus",       zip: "8210" },
  { name: "Bilka Odense",       chain: "Bilka", city: "Odense",       zip: "5220" },
  { name: "Bilka Aalborg",      chain: "Bilka", city: "Aalborg",      zip: "9200" },
  { name: "Bilka Esbjerg",      chain: "Bilka", city: "Esbjerg",      zip: "6710" },
  { name: "Bilka Vejle",        chain: "Bilka", city: "Vejle",        zip: "7100" },
  { name: "Bilka Fredericia",   chain: "Bilka", city: "Fredericia",   zip: "7000" },
  { name: "Bilka Næstved",      chain: "Bilka", city: "Næstved",      zip: "4700" },
];

function StorePickerContent({ search, onSearch, onPick }) {
  const q = search.toLowerCase();
  const filtered = STORE_BRANCHES.filter(s =>
    !q || s.name.toLowerCase().includes(q) || s.zip.includes(q) || s.city.toLowerCase().includes(q)
  );
  const grouped = ["Netto", "Føtex", "Bilka"]
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
            {g.stores.map(s => (
              <button key={s.name} className="store-branch-item" onClick={() => onPick(s)}>
                <div>
                  <span className="store-branch-name">{s.name}</span>
                  <span className="store-branch-city">{s.city}</span>
                </div>
                <span className="store-branch-zip">{s.zip}</span>
              </button>
            ))}
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

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

export default function App() {
  const [localStore, setLocalStore] = useState(() => {
    try { return JSON.parse(localStorage.getItem("localStore") || "null"); }
    catch { return null; }
  });
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

  function pickStore(store) {
    setLocalStore(store);
    localStorage.setItem("localStore", JSON.stringify(store));
    setShowStorePicker(false);
    setStoreSearch("");
  }

  const isRecipeSaved = selectedRecipe && savedRecipes.some(r => r.title === selectedRecipe.title);
  const weekBadge = `UGE ${getWeekNumber(new Date())} · ${new Date().getFullYear()}`;

  // ── Onboarding (first visit, no local store chosen) ─────────────
  if (!localStore) {
    return (
      <div className="app">
        <header className="app-header">
          <div className="app-header-deco-1" />
          <div className="app-header-deco-2" />
          <div className="week-badge">{weekBadge}</div>
          <h1 className="app-title">Tilbudskokken</h1>
          <p className="app-subtitle">Opskrifter baseret på ugens tilbud – lige fra din butik</p>
        </header>
        <div className="store-picker-onboarding">
          <h2 className="sp-title">Vælg din lokale butik</h2>
          <p className="sp-desc">Tilbudskokken finder opskrifter der bruger tilbud fra netop din butik.</p>
          <StorePickerContent search={storeSearch} onSearch={setStoreSearch} onPick={pickStore} />
        </div>
      </div>
    );
  }

  // ── Recipe card (browse) ────────────────────────────────────────
  function RecipeCard({ r }) {
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
      </div>
    );
  }

  return (
    <div className="app">

      {/* Store picker modal (skift) */}
      {showStorePicker && (
        <div className="store-picker-overlay" onClick={e => e.target === e.currentTarget && setShowStorePicker(false)}>
          <div className="store-picker-card">
            <div className="sp-modal-header">
              <h2 className="sp-title">Skift butik</h2>
              <button className="sp-close-btn" onClick={() => { setShowStorePicker(false); setStoreSearch(""); }}>×</button>
            </div>
            <StorePickerContent search={storeSearch} onSearch={setStoreSearch} onPick={pickStore} />
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
          <span className="chain-dot" style={{ background: CHAIN_COLORS[localStore.chain] }} />
          Din butik: <strong>{localStore.name}</strong>
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
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
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
