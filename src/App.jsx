import { useState } from "react";
import "./App.css";
import { recipeBank } from "./recipes";

const stores = [
  {
    name: "Rema 1000", color: "#e63329",
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
    name: "Netto", color: "#e6a800",
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

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

export default function App() {
  const [activeStores, setActiveStores] = useState(new Set([0, 1, 2]));
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [adaptingRecipe, setAdaptingRecipe] = useState(false);
  const [servings, setServings] = useState(4);
  const [shoppingList, setShoppingList] = useState([]);
  const [diet, setDiet] = useState("Alle");
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
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

  // ── Matching ────────────────────────────────────────────────────
  function getDealItems(storeSet, dietFilter) {
    return stores
      .filter((_, i) => storeSet.has(i))
      .flatMap(s => s.items)
      .filter(it => !dietExcludes[dietFilter].some(kw => it.name.toLowerCase().includes(kw)));
  }

  function getScoredRecipes(storeSet, dietFilter) {
    const dealNames = getDealItems(storeSet, dietFilter).map(it => it.name.toLowerCase());
    const excluded = dietExcludes[dietFilter];
    return recipeBank
      .filter(r => !excluded.some(kw => r.keyIngredients.some(ki => ki.includes(kw))))
      .map(r => ({
        ...r,
        matchCount: r.keyIngredients.filter(ki => dealNames.some(dn => dn.includes(ki))).length,
      }));
  }

  const scoredRecipes = getScoredRecipes(activeStores, diet);
  const recommended = scoredRecipes.filter(r => r.matchCount >= 2).sort((a, b) => b.matchCount - a.matchCount);
  const others = scoredRecipes.filter(r => r.matchCount < 2);

  // ── Recipe selection (AI tailoring) ────────────────────────────
  async function selectRecipe(baseRecipe) {
    const dealItems = getDealItems(activeStores, diet);
    const dealList = dealItems.map(it => `${it.name} (${it.price.toFixed(2)} kr)`).join(", ");
    const dietInstruction = dietInstructions[diet] || "";

    setAdaptingRecipe(true);
    setSelectedRecipe(null);
    setShoppingList([]);
    setError(null);

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
          max_tokens: 1500,
          messages: [{
            role: "user",
            content: `Du er en dansk kogebog-assistent. Tilpas denne opskrift til ugens tilbudsvarer.\n\nOpskrift: ${baseRecipe.title}\nBasis ingredienser: ${baseRecipe.ingredients.join(", ")}\nFremgangsmåde: ${baseRecipe.steps.join(" ")}\n\nUgens tilbudsvarer tilgængelige:\n${dealList}\n\n${dietInstruction ? dietInstruction + "\n\n" : ""}Tilpas opskriften: brug de tilgængelige tilbudsvarer, juster mængder og fremhæv hvilke tilbudsvarer der er i spil. Svar KUN med JSON uden markdown:\n{"title":"...","time":"...","servings_count":4,"servings":"4 personer","ingredients":["500g hakket oksekød"],"steps":["Trin 1."],"tip":"..."}`,
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
      setSelectedRecipe(JSON.parse(clean));
      setServings(baseRecipe.servings_count || 4);
    } catch (err) {
      // Fallback to base recipe
      setSelectedRecipe({ ...baseRecipe, servings: `${baseRecipe.servings_count || 4} personer` });
      setError("Kunne ikke tilpasse opskrift – viser basis version.");
    } finally {
      setAdaptingRecipe(false);
    }
  }

  // ── Shopping list ───────────────────────────────────────────────
  function addToShoppingList(ingredient) {
    setShoppingList(prev => prev.includes(ingredient) ? prev : [...prev, ingredient]);
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
    const text = `${r.title}\n\nIngredienser:\n${r.ingredients.join("\n")}\n\nFremgangsmåde:\n${r.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nTip: ${r.tip}`;
    if (navigator.share) {
      await navigator.share({ title: r.title, text });
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // ── Scale ───────────────────────────────────────────────────────
  function scaleIngredient(ingredient, baseServings, currentServings) {
    const ratio = currentServings / baseServings;
    return ingredient.replace(/(\d+([.,]\d+)?)/g, match => {
      const scaled = parseFloat(match.replace(",", ".")) * ratio;
      return Number.isInteger(scaled) ? scaled : scaled.toFixed(1).replace(".", ",");
    });
  }

  const isRecipeSaved = selectedRecipe && savedRecipes.some(r => r.title === selectedRecipe.title);
  const weekBadge = `UGE ${getWeekNumber(new Date())} · ${new Date().getFullYear()}`;

  // ── Recipe card (browse) ────────────────────────────────────────
  function RecipeCard({ r }) {
    return (
      <div
        className={`recipe-browse-card${r.matchCount >= 2 ? " featured" : ""}`}
        onClick={() => selectRecipe(r)}
      >
        <div className="recipe-category-tag">{r.emoji} {r.category}</div>
        <div className="recipe-browse-title">{r.title}</div>
        <div className="recipe-browse-meta">
          <span>⏱ {r.time}</span>
          <span>🥘 {r.ingredients.length} ing.</span>
        </div>
        {r.matchCount > 0 && (
          <div className="recipe-match-badge">🛒 {r.matchCount} tilbudsvare{r.matchCount !== 1 ? "r" : ""}</div>
        )}
      </div>
    );
  }

  return (
    <div className="app">

      {/* Header */}
      <header className="app-header">
        <div className="app-header-deco-1" />
        <div className="app-header-deco-2" />
        <div className="week-badge">{weekBadge}</div>
        <h1 className="app-title">Tilbudskokken</h1>
        <p className="app-subtitle">Gennemse 50 opskrifter matchet til ugens tilbud</p>
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

      {/* Detail / loading view */}
      {(selectedRecipe || adaptingRecipe) ? (
        <>
          <button className="back-btn" onClick={() => { setSelectedRecipe(null); setAdaptingRecipe(false); setError(null); }}>
            ← Tilbage til opskrifter
          </button>

          {adaptingRecipe ? (
            <div className="loading-screen">
              <div className="loading-dots">
                <div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" />
              </div>
              <p className="loading-text">Tilpasser opskrift til ugens tilbud...</p>
            </div>
          ) : (
            <>
              {error && <div className="error-box" style={{ marginBottom: "1rem" }}>{error}</div>}

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
                    const scaled = scaleIngredient(ing, selectedRecipe.servings_count || 4, servings);
                    const inList = shoppingList.includes(scaled);
                    return (
                      <li key={i} className="ingredient-item">
                        <button
                          className="ingredient-add-btn"
                          onClick={() => addToShoppingList(scaled)}
                          disabled={inList}
                          style={{ background: inList ? "#d4ead4" : "#4a7050", color: inList ? "#3a6040" : "white" }}
                        >
                          {inList ? "✓" : "+"}
                        </button>
                        {scaled}
                      </li>
                    );
                  })}
                </ul>

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

          <div className="recipe-browse-section">
            <h2 className="section-title">Alle opskrifter · {others.length}</h2>
            <div className="recipe-browse-grid">
              {others.map(r => <RecipeCard key={r.id} r={r} />)}
            </div>
          </div>

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
                      <div className="saved-recipe-meta">⏱ {r.time} · 👥 {r.servings}</div>
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
                            <span style={{ width: 5, height: 5, background: "#7a9e7a", borderRadius: "50%", flexShrink: 0, display: "inline-block" }} />
                            {ing}
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
