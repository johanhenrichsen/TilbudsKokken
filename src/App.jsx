import { useState } from "react";
import "./App.css";

const stores = [
  {
    name: "Rema 1000",
    color: "#e63329",
    items: [
      { name: "Hakket oksekød 500g", price: 24.95, unit: "pr. pk." },
      { name: "Gulerødder 1kg", price: 7.95, unit: "pr. pose" },
      { name: "Æg 10 stk.", price: 18.50, unit: "pr. bakke" },
      { name: "Spaghetti 500g", price: 8.95, unit: "pr. pk." },
      { name: "Løg 1kg", price: 9.50, unit: "pr. pose" },
      { name: "Smør 200g", price: 16.95, unit: "pr. pk." },
    ],
  },
  {
    name: "Netto",
    color: "#e6a800",
    items: [
      { name: "Kyllingefilet 600g", price: 29.95, unit: "pr. pk." },
      { name: "Ris 1kg", price: 11.95, unit: "pr. pose" },
      { name: "Dåsetomater 400g", price: 5.95, unit: "pr. dåse" },
      { name: "Hvidløg 3 stk.", price: 6.50, unit: "pr. net" },
      { name: "Mozzarella 125g", price: 14.95, unit: "pr. pk." },
      { name: "Basilikum", price: 8.95, unit: "pr. potte" },
    ],
  },
  {
    name: "Coop 365",
    color: "#0066cc",
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

export default function App() {
  const [selected, setSelected] = useState(new Set());
  const [recipe, setRecipe] = useState(null);
  const [servings, setServings] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shoppingList, setShoppingList] = useState([]);
  const [diet, setDiet] = useState("Alle");
  const [savedRecipes, setSavedRecipes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("savedRecipes") || "[]"); }
    catch { return []; }
  });
  const [expandedSaved, setExpandedSaved] = useState(new Set());

  const dietFilters = ["Alle", "Vegetar", "Veganer", "Glutenfri", "Mælkefri"];

  const dietExcludes = {
    Alle: [],
    Vegetar: ["oksekød", "kylling", "laks"],
    Veganer: ["oksekød", "kylling", "laks", "smør", "fløde", "mozzarella", "parmesan", "æg"],
    Glutenfri: ["spaghetti", "pasta"],
    Mælkefri: ["smør", "fløde", "mozzarella", "parmesan"],
  };

  const dietInstructions = {
    Vegetar: "Opskriften skal være vegetarisk – uden kød og fisk.",
    Veganer: "Opskriften skal være vegansk – uden kød, fisk, æg og mejeriprodukter.",
    Glutenfri: "Opskriften må ikke indeholde gluten (ingen pasta, spaghetti eller hvedemel).",
    Mælkefri: "Opskriften må ikke indeholde mælkeprodukter (ingen smør, fløde, ost eller mælk).",
  };

  function toggle(key) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function changeDiet(f) {
    setDiet(f);
    const excluded = dietExcludes[f];
    setSelected(prev => {
      const next = new Set(prev);
      [...next].forEach(key => {
        const name = key.split("|")[1].toLowerCase();
        if (excluded.some(kw => name.includes(kw))) next.delete(key);
      });
      return next;
    });
  }

  function addToShoppingList(ingredient) {
    setShoppingList(prev => prev.includes(ingredient) ? prev : [...prev, ingredient]);
  }

  function removeFromShoppingList(index) {
    setShoppingList(prev => prev.filter((_, i) => i !== index));
  }

  function clearShoppingList() {
    setShoppingList([]);
  }

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

  const isRecipeSaved = recipe && savedRecipes.some(r => r.title === recipe.title && r.savedAt);

  function scaleIngredient(ingredient, baseServings, currentServings) {
    const ratio = currentServings / baseServings;
    return ingredient.replace(/(\d+([.,]\d+)?)/g, match => {
      const scaled = parseFloat(match.replace(",", ".")) * ratio;
      return Number.isInteger(scaled) ? scaled : scaled.toFixed(1).replace(".", ",");
    });
  }

  async function generateRecipe(retry = false) {
    if (selected.size === 0) return;
    setLoading(true);
    setRecipe(null);
    setError(null);

    const varer = [...selected].map(k => k.split("|")[1]);

    try {
      const response = await fetch("/api/recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_CLAUDE_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Du er en dansk kogebog-assistent. Lav en opskrift til ${servings} personer der bruger nogle eller alle af disse tilbudsvarer: ${varer.join(", ")}.${dietInstructions[diet] ? ` ${dietInstructions[diet]}` : ""}${retry ? " Lav en anderledes opskrift end sidst — vær kreativ med køkken og tilberedningsmetode." : ""} Svar KUN med et JSON-objekt uden markdown eller forklaringer: {"title": "navn", "time": "XX min", "servings": "${servings} personer", "servings_count": ${servings}, "ingredients": ["ingrediens 1"], "steps": ["trin 1"], "tip": "tip her"}`,
          }],
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "API fejl");
      }

      const data = await response.json();
      const text = data.content[0].text;
      const clean = text.replace(/```json|```/g, "").trim();
      setRecipe(JSON.parse(clean));
    } catch (err) {
      setError("Fejl: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const chips = [...selected].slice(0, 4).map(k => k.split("|")[1].split(" ").slice(0, 2).join(" "));
  const extraChips = selected.size > 4 ? selected.size - 4 : 0;
  const total = [...selected].reduce((sum, key) => {
    const [si, name] = key.split("|");
    const item = stores[+si]?.items.find(it => it.name === name);
    return sum + (item?.price || 0);
  }, 0);

  return (
    <div className="app">

      {/* Header */}
      <header className="app-header">
        <div className="app-header-deco-1" />
        <div className="app-header-deco-2" />
        <div className="week-badge">UGE 24 · 2026</div>
        <h1 className="app-title">Tilbudskokken</h1>
        <p className="app-subtitle">Vælg ugens tilbud og få en opskrift på sekunder</p>
      </header>

      {/* Diet filters */}
      <div className="diet-filters">
        {dietFilters.map(f => (
          <button
            key={f}
            onClick={() => changeDiet(f)}
            className={`diet-btn${diet === f ? " active" : ""}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Store grid */}
      <div className="store-grid">
        {stores.map((store, si) => (
          <div key={si} className="store-card">
            <div className="store-card-header">
              <div className="store-dot" style={{ background: store.color }} />
              <span className="store-name">{store.name}</span>
            </div>
            <div>
              {store.items
                .filter(item => !dietExcludes[diet].some(kw => item.name.toLowerCase().includes(kw)))
                .map((item, ii) => {
                  const key = `${si}|${item.name}`;
                  const isSel = selected.has(key);
                  return (
                    <div
                      key={ii}
                      onClick={() => toggle(key)}
                      className={`store-item${isSel ? " selected" : ""}`}
                    >
                      <span className="item-name">{item.name}</span>
                      <div>
                        <div className="item-price">{item.price.toFixed(2)} kr</div>
                        <div className="item-unit">{item.unit}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="bottom-bar">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="item-count">
              <strong>{selected.size} {selected.size === 1 ? "vare" : "varer"}</strong> valgt
            </span>
            {selected.size > 0 && (
              <span className="total-price">💰 {total.toFixed(2).replace(".", ",")} kr</span>
            )}
          </div>
          {chips.length > 0 && (
            <div className="item-chips">
              {chips.map((c, i) => <span key={i} className="item-chip">{c}</span>)}
              {extraChips > 0 && <span className="item-chip">+{extraChips} mere</span>}
            </div>
          )}
        </div>
        <div className="bottom-bar-controls">
          <span className="servings-control">
            👥
            <button className="btn-round" onClick={() => setServings(s => Math.max(1, s - 1))}>−</button>
            {servings} pers.
            <button className="btn-round" onClick={() => setServings(s => Math.min(10, s + 1))}>+</button>
          </span>
          <button
            className="btn-primary"
            onClick={() => generateRecipe()}
            disabled={loading || selected.size === 0}
          >
            {loading ? "Genererer…" : "Generér opskrift"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && <div className="error-box">{error}</div>}

      {/* Recipe card */}
      {recipe && (
        <div className="recipe-card">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
            <h2 className="recipe-title" style={{ margin: 0 }}>{recipe.title}</h2>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button
                className="retry-btn"
                onClick={() => generateRecipe(true)}
                disabled={loading}
                title="Prøv en anden opskrift"
              >
                🔄 <span>Prøv anden</span>
              </button>
              <button
                className={`save-btn${isRecipeSaved ? " saved" : ""}`}
                onClick={() => !isRecipeSaved && saveRecipe(recipe)}
                title={isRecipeSaved ? "Gemt" : "Gem opskrift"}
              >
                🔖 <span>{isRecipeSaved ? "Gemt" : "Gem"}</span>
              </button>
            </div>
          </div>
          <div className="recipe-meta-bar">
            <span>⏱ {recipe.time}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
              👥
              <button className="btn-round" onClick={() => setServings(s => Math.max(1, s - 1))}>−</button>
              {servings} personer
              <button className="btn-round" onClick={() => setServings(s => Math.min(10, s + 1))}>+</button>
            </span>
          </div>

          <div className="section-label">Ingredienser</div>
          <ul className="ingredient-grid">
            {recipe.ingredients.map((ing, i) => {
              const scaledIng = scaleIngredient(ing, recipe.servings_count || 4, servings);
              const inList = shoppingList.includes(scaledIng);
              return (
                <li key={i} className="ingredient-item">
                  <button
                    className="ingredient-add-btn"
                    onClick={() => addToShoppingList(scaledIng)}
                    title={inList ? "Allerede i indkøbsliste" : "Tilføj til indkøbsliste"}
                    disabled={inList}
                    style={{
                      background: inList ? "#d4ead4" : "#4a7050",
                      color: inList ? "#3a6040" : "white",
                    }}
                  >
                    {inList ? "✓" : "+"}
                  </button>
                  {scaledIng}
                </li>
              );
            })}
          </ul>

          <div className="section-label">Fremgangsmåde</div>
          <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {recipe.steps.map((step, i) => (
              <li key={i} className="step-item">
                <span className="step-number">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>

          <div className="recipe-tip">
            <strong>Tips:</strong> {recipe.tip}
          </div>
        </div>
      )}

      {/* Shopping list */}
      {shoppingList.length > 0 && (
        <div className="shopping-list-card">
          <div className="shopping-list-header">
            <div className="section-label" style={{ margin: 0 }}>
              Indkøbsliste · {shoppingList.length} {shoppingList.length === 1 ? "vare" : "varer"}
            </div>
            <button className="btn-outline" onClick={clearShoppingList}>
              Ryd liste
            </button>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {shoppingList.map((item, i) => (
              <li key={i} className="shopping-item">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="shopping-item-dot" />
                  {item}
                </div>
                <button
                  className="shopping-item-remove"
                  onClick={() => removeFromShoppingList(i)}
                  title="Fjern fra liste"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
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
                      <div className="saved-recipe-meta">⏱ {r.time} · 👥 {r.servings}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="saved-recipe-chevron">{open ? "▲" : "▼"}</span>
                      <button
                        className="saved-recipe-delete"
                        onClick={e => { e.stopPropagation(); deleteSavedRecipe(r.savedAt); }}
                        title="Slet opskrift"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  {open && (
                    <div className="saved-recipe-body">
                      <div className="section-label" style={{ margin: "0 0 8px" }}>Ingredienser</div>
                      <ul className="ingredient-grid" style={{ marginBottom: "1rem" }}>
                        {r.ingredients.map((ing, i) => (
                          <li key={i} className="ingredient-item" style={{ gap: 6 }}>
                            <span style={{ width: 5, height: 5, background: "#7a9e7a", borderRadius: "50%", flexShrink: 0, display: "inline-block" }} />
                            {ing}
                          </li>
                        ))}
                      </ul>
                      <div className="section-label" style={{ margin: "0 0 8px" }}>Fremgangsmåde</div>
                      <ol style={{ listStyle: "none", padding: 0, margin: "0 0 1rem" }}>
                        {r.steps.map((step, i) => (
                          <li key={i} className="step-item">
                            <span className="step-number">{i + 1}</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                      {r.tip && (
                        <div className="recipe-tip"><strong>Tips:</strong> {r.tip}</div>
                      )}
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
