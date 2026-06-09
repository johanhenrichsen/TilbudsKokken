import { useState } from "react";

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
    color: "#FFD700",
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

  function toggle(key) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
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

  function scaleIngredient(ingredient, baseServings, currentServings) {
    const ratio = currentServings / baseServings;
    return ingredient.replace(/(\d+([.,]\d+)?)/g, (match) => {
      const scaled = parseFloat(match.replace(",", ".")) * ratio;
      return Number.isInteger(scaled) ? scaled : scaled.toFixed(1).replace(".", ",");
    });
  }

  async function generateRecipe() {
    if (selected.size === 0) return;
    setLoading(true);
    setRecipe(null);
    setError(null);

    const varer = [...selected].map((k) => k.split("|")[1]);

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
          messages: [
            {
              role: "user",
              content: `Du er en dansk kogebog-assistent. Lav en opskrift til ${servings} personer der bruger nogle eller alle af disse tilbudsvarer: ${varer.join(", ")}.${dietInstructions[diet] ? ` ${dietInstructions[diet]}` : ""} Svar KUN med et JSON-objekt uden markdown eller forklaringer: {"title": "navn", "time": "XX min", "servings": "${servings} personer", "servings_count": ${servings}, "ingredients": ["ingrediens 1"], "steps": ["trin 1"], "tip": "tip her"}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "API fejl");
      }

      const data = await response.json();
      const text = data.content[0].text;
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setRecipe(parsed);
    } catch (err) {
      setError("Fejl: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const chips = [...selected].slice(0, 4).map((k) => k.split("|")[1].split(" ").slice(0, 2).join(" "));
  const extraChips = selected.size > 4 ? selected.size - 4 : 0;
  const total = [...selected].reduce((sum, key) => {
    const [si, name] = key.split("|");
    const item = stores[+si]?.items.find(it => it.name === name);
    return sum + (item?.price || 0);
  }, 0);

  return (
    <div style={{ fontFamily: "sans-serif", padding: "1rem", maxWidth: 700, margin: "0 auto" }}>
      <div style={{ background: "#1a2e1a", color: "#f0ead6", padding: "2rem 1.5rem 1.5rem", borderRadius: 16, marginBottom: "1.5rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, background: "#2d4a2d", borderRadius: "50%" }} />
        <div style={{ display: "inline-block", background: "#3a5a3a", color: "#a8c0a8", fontSize: 11, padding: "3px 10px", borderRadius: 20, marginBottom: 10, position: "relative" }}>UGE 24 · 2026</div>
        <div style={{ fontSize: 26, fontWeight: 600, margin: "0 0 4px", position: "relative" }}>Ugens tilbud</div>
        <p style={{ fontSize: 13, color: "#a8c0a8", margin: 0, position: "relative" }}>Vælg varer og få en opskrift genereret automatisk</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap" }}>
        {dietFilters.map(f => (
          <button key={f} onClick={() => changeDiet(f)} style={{ background: diet === f ? "#1a2e1a" : "#f0f7f0", color: diet === f ? "#f0ead6" : "#2a5a2a", border: diet === f ? "none" : "1px solid #c8ddc8", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: diet === f ? 600 : 400, cursor: "pointer" }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: "1.5rem" }}>
        {stores.map((store, si) => (
          <div key={si} style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "10px 12px 8px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #e5e5e5" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: store.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{store.name}</span>
            </div>
            <div>
              {store.items.filter(item => !dietExcludes[diet].some(kw => item.name.toLowerCase().includes(kw))).map((item, ii) => {
                const key = `${si}|${item.name}`;
                const isSel = selected.has(key);
                return (
                  <div key={ii} onClick={() => toggle(key)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 12px", cursor: "pointer", background: isSel ? "#f0f7f0" : "transparent" }}>
                    <span style={{ fontSize: 12 }}>{item.name}</span>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "#2d6a2d" }}>{item.price.toFixed(2)} kr</div>
                      <div style={{ fontSize: 10, color: "#999" }}>{item.unit}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "#f7f7f7", border: "1px solid #e5e5e5", borderRadius: 12, padding: "12px 16px", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 13, color: "#555", display: "flex", alignItems: "center", gap: 12 }}>
            <span><strong>{selected.size} {selected.size === 1 ? "vare" : "varer"}</strong> valgt</span>
            {selected.size > 0 && <span style={{ color: "#2d6a2d", fontWeight: 500 }}>💰 I alt: {total.toFixed(2).replace(".", ",")} kr</span>}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
            {chips.map((c, i) => <span key={i} style={{ background: "#e8f3e8", color: "#2a5a2a", fontSize: 11, padding: "3px 10px", borderRadius: 20 }}>{c}</span>)}
            {extraChips > 0 && <span style={{ background: "#e8f3e8", color: "#2a5a2a", fontSize: 11, padding: "3px 10px", borderRadius: 20 }}>+{extraChips} mere</span>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#555" }}>
            👥
            <button onClick={() => setServings(s => Math.max(1, s - 1))} style={{ background: "#e8f3e8", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontWeight: "bold", fontSize: 14, lineHeight: 1 }}>−</button>
            {servings} personer
            <button onClick={() => setServings(s => Math.min(10, s + 1))} style={{ background: "#e8f3e8", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontWeight: "bold", fontSize: 14, lineHeight: 1 }}>+</button>
          </span>
          <button onClick={generateRecipe} disabled={loading || selected.size === 0} style={{ background: "#1a2e1a", color: "#f0ead6", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: selected.size === 0 ? "not-allowed" : "pointer", opacity: selected.size === 0 ? 0.5 : 1 }}>
            {loading ? "Genererer..." : "Generér opskrift"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fce8e8", border: "1px solid #f0a0a0", borderRadius: 12, padding: "12px 16px", marginBottom: "1rem", fontSize: 13, color: "#7a2020" }}>
          {error}
        </div>
      )}

      {recipe && (
        <div style={{ background: "#fffdf7", border: "1px solid #d4c9a8", borderRadius: 12, padding: "1.5rem" }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#1a2e1a", marginBottom: 6 }}>{recipe.title}</div>
          <div style={{ fontSize: 12, color: "#7a8a7a", marginBottom: "1rem", display: "flex", gap: 12 }}>
            <span>⏱ {recipe.time}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              👥
              <button onClick={() => setServings(s => Math.max(1, s - 1))} style={{ background: "#e8f3e8", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontWeight: "bold", fontSize: 14, lineHeight: 1 }}>−</button>
              {servings} personer
              <button onClick={() => setServings(s => Math.min(10, s + 1))} style={{ background: "#e8f3e8", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontWeight: "bold", fontSize: 14, lineHeight: 1 }}>+</button>
            </span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#5a7a5a", letterSpacing: 1, textTransform: "uppercase", margin: "1rem 0 8px" }}>Ingredienser</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
            {recipe.ingredients.map((ing, i) => {
              const scaledIng = scaleIngredient(ing, recipe.servings_count || 4, servings);
              const inList = shoppingList.includes(scaledIng);
              return (
                <li key={i} style={{ fontSize: 13, color: "#333", padding: "3px 0", display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    onClick={() => addToShoppingList(scaledIng)}
                    title={inList ? "Allerede i indkøbsliste" : "Tilføj til indkøbsliste"}
                    disabled={inList}
                    style={{ width: 16, height: 16, background: inList ? "#c8e6c8" : "#5a9a5a", border: "none", borderRadius: "50%", cursor: inList ? "default" : "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: inList ? "#3a7a3a" : "white", fontSize: 11, fontWeight: "bold", lineHeight: 1, padding: 0 }}
                  >
                    {inList ? "✓" : "+"}
                  </button>
                  {scaledIng}
                </li>
              );
            })}
          </ul>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#5a7a5a", letterSpacing: 1, textTransform: "uppercase", margin: "1rem 0 8px" }}>Fremgangsmåde</div>
          <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {recipe.steps.map((step, i) => (
              <li key={i} style={{ fontSize: 13, color: "#333", padding: "6px 0 6px 28px", position: "relative", borderBottom: i < recipe.steps.length - 1 ? "1px solid #ede8d8" : "none", lineHeight: 1.5 }}>
                <span style={{ position: "absolute", left: 0, top: 7, width: 18, height: 18, background: "#1a2e1a", color: "#f0ead6", borderRadius: "50%", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500 }}>{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
          <div style={{ background: "#f0f7f0", borderLeft: "2px solid #5a9a5a", padding: "10px 12px", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#3a6a3a", marginTop: "1rem" }}>
            <strong>Tips:</strong> {recipe.tip}
          </div>
        </div>
      )}

      {shoppingList.length > 0 && (
        <div style={{ background: "#fffdf7", border: "1px solid #d4c9a8", borderRadius: 12, padding: "1.5rem", marginTop: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#5a7a5a", letterSpacing: 1, textTransform: "uppercase" }}>
              Indkøbsliste · {shoppingList.length} {shoppingList.length === 1 ? "vare" : "varer"}
            </div>
            <button
              onClick={clearShoppingList}
              style={{ background: "transparent", border: "1px solid #c8a870", color: "#8a6a2a", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}
            >
              Ryd liste
            </button>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {shoppingList.map((item, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: i < shoppingList.length - 1 ? "1px solid #ede8d8" : "none", fontSize: 13, color: "#333" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 5, height: 5, background: "#5a9a5a", borderRadius: "50%", flexShrink: 0, display: "inline-block" }} />
                  {item}
                </div>
                <button
                  onClick={() => removeFromShoppingList(i)}
                  title="Fjern fra liste"
                  style={{ background: "transparent", border: "none", color: "#bbb", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px" }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}