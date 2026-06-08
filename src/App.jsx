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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function toggle(key) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function generateRecipe() {
    if (selected.size === 0) return;
    setLoading(true);
    setRecipe(null);
    setError(null);

    const varer = [...selected].map((k) => k.split("|")[1]);

    try {
      const response = await fetch("/api/v1/messages", {
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
              content: `Du er en dansk kogebog-assistent. Lav en opskrift der bruger nogle eller alle af disse tilbudsvarer: ${varer.join(", ")}. Svar KUN med et JSON-objekt uden markdown eller forklaringer: {"title": "navn", "time": "XX min", "servings": "X personer", "ingredients": ["ingrediens 1"], "steps": ["trin 1"], "tip": "tip her"}`,
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

  return (
    <div style={{ fontFamily: "sans-serif", padding: "1rem", maxWidth: 700, margin: "0 auto" }}>
      <div style={{ background: "#1a2e1a", color: "#f0ead6", padding: "2rem 1.5rem 1.5rem", borderRadius: 16, marginBottom: "1.5rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, background: "#2d4a2d", borderRadius: "50%" }} />
        <div style={{ display: "inline-block", background: "#3a5a3a", color: "#a8c0a8", fontSize: 11, padding: "3px 10px", borderRadius: 20, marginBottom: 10, position: "relative" }}>UGE 24 · 2026</div>
        <div style={{ fontSize: 26, fontWeight: 600, margin: "0 0 4px", position: "relative" }}>Ugens tilbud</div>
        <p style={{ fontSize: 13, color: "#a8c0a8", margin: 0, position: "relative" }}>Vælg varer og få en opskrift genereret automatisk</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: "1.5rem" }}>
        {stores.map((store, si) => (
          <div key={si} style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "10px 12px 8px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #e5e5e5" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: store.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{store.name}</span>
            </div>
            <div>
              {store.items.map((item, ii) => {
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
          <div style={{ fontSize: 13, color: "#555" }}><strong>{selected.size} {selected.size === 1 ? "vare" : "varer"}</strong> valgt</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
            {chips.map((c, i) => <span key={i} style={{ background: "#e8f3e8", color: "#2a5a2a", fontSize: 11, padding: "3px 10px", borderRadius: 20 }}>{c}</span>)}
            {extraChips > 0 && <span style={{ background: "#e8f3e8", color: "#2a5a2a", fontSize: 11, padding: "3px 10px", borderRadius: 20 }}>+{extraChips} mere</span>}
          </div>
        </div>
        <button onClick={generateRecipe} disabled={loading || selected.size === 0} style={{ background: "#1a2e1a", color: "#f0ead6", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: selected.size === 0 ? "not-allowed" : "pointer", opacity: selected.size === 0 ? 0.5 : 1 }}>
          {loading ? "Genererer..." : "Generér opskrift"}
        </button>
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
            <span>👥 {recipe.servings}</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#5a7a5a", letterSpacing: 1, textTransform: "uppercase", margin: "1rem 0 8px" }}>Ingredienser</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
            {recipe.ingredients.map((ing, i) => (
              <li key={i} style={{ fontSize: 13, color: "#333", padding: "3px 0", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 5, height: 5, background: "#5a9a5a", borderRadius: "50%", flexShrink: 0, display: "inline-block" }} />{ing}
              </li>
            ))}
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
    </div>
  );
}
