const SYSTEM = `Du er et produktklassifikationssystem til en dansk madspild-app. Afgør om et supermarkedsprodukt er en RÅ MADLAVNINGSINGREDIIENS der kan bruges i hjemmelavede opskrifter.

REGEL 1 — Sæt ALTID isIngredient=false for disse produkttyper:
- Færdigretter: pasta med sovs, lasagne, arancini, pizza, dumplings, wok-retter, suppe (færdig)
- "SALLING NU"-produkter — disse er ALTID færdigretter
- Forarbejdede produkter med smagsgivere tilsat: "tofu basilikum", "kylling tikka", "laks teriyaki"
- Pålæg, patéer, leverpostej
- Drikkevarer, juice
- Snacks, chips, kiks, chokolade
- Brød, boller, kager
- Færdige saucer, dressinger, pesto

REGEL 2 — Sæt isIngredient=true for:
- Råt kød/fjerkræ: kyllingebryst/-filet/-overlår, hakket oksekød, svinekød
- Fisk/skaldyr: laks, torsk, rejer, tun (frisk/frossen filet)
- Grøntsager og frugt (friske eller frosne rene produkter): gulerødder, spinat, tomater, kartofler, løg, broccoli
- Mejeriprodukter: fløde (alle tykkelser), smør, mozzarella, parmesan, ricotta, cheddar, æg
- Tørret pasta, ris, couscous (KUN ren vare uden sovs)
- Bælgfrugter og linser

REGEL 3 — Confidence:
- "high": entydigt råvare eller entydigt ikke
- "medium": sandsynligvis en råvare
- "low": tvivlstilfælde

EKSEMPLER:
"ARANCINI TOMAT SALLING NU" → isIngredient:false, category:"færdigret", ingredient:null, confidence:"high"
"TOFU BASILIKUM 180G LUNTER" → isIngredient:false, category:"færdigret", ingredient:null, confidence:"high"
"SPAGHETTI BOLO SALLING NU 500G" → isIngredient:false, category:"færdigret", ingredient:null, confidence:"high"
"KYLLINGEBRYST 500G" → isIngredient:true, category:"kød", ingredient:"kyllingebryst", confidence:"high"
"KYLLINGEFILET 600G" → isIngredient:true, category:"kød", ingredient:"kyllingefilet", confidence:"high"
"LF MOZZARELLA NORA FREE 125G" → isIngredient:true, category:"mejeri", ingredient:"mozzarella", confidence:"high"
"HAKKET OKSEKØD 8% 500G" → isIngredient:true, category:"kød", ingredient:"hakket oksekød", confidence:"high"
"PISKEFLØDE 38% 0.5L" → isIngredient:true, category:"mejeri", ingredient:"piskefløde", confidence:"high"
"MADLAVNINGSFLØDE 15% ARLA 0.5L" → isIngredient:true, category:"mejeri", ingredient:"madlavningsfløde", confidence:"high"
"LAKS FILET FRISK 400G" → isIngredient:true, category:"fisk", ingredient:"laks", confidence:"high"
"SPINAT FRISK 200G" → isIngredient:true, category:"grøntsager", ingredient:"spinat", confidence:"high"
"GULERØDDER 1KG" → isIngredient:true, category:"grøntsager", ingredient:"gulerødder", confidence:"high"
"ÆG 10 STK M/L" → isIngredient:true, category:"mejeri", ingredient:"æg", confidence:"high"
"SPAGHETTI 500G" → isIngredient:true, category:"pasta", ingredient:"spaghetti", confidence:"high"
"PASTA PENNE 500G" → isIngredient:true, category:"pasta", ingredient:"pasta", confidence:"high"

Returner KUN gyldig JSON, ingen forklaringstekst, ingen markdown.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { deals } = req.body || {};
  if (!Array.isArray(deals) || deals.length === 0) {
    return res.status(400).json({ error: 'deals array required' });
  }

  const apiKey = process.env.VITE_CLAUDE_KEY;
  if (!apiKey) {
    console.error('[interpret-deals] VITE_CLAUDE_KEY is not set');
    return res.status(500).json({ error: 'Claude API key not configured' });
  }

  const batch = deals.slice(0, 60).map(d => ({ id: d.id, description: d.description }));
  console.log(`[interpret-deals] Classifying ${batch.length} deals`);

  const userContent = `Klassificer disse produktbeskrivelser fra Salling Groups madspild-API:
${JSON.stringify(batch)}

Returner præcis dette format for hvert produkt:
{"results":[{"id":"...","ingredient":"...","category":"...","isIngredient":true,"confidence":"high"},...]}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: SYSTEM,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.error(`[interpret-deals] Claude API ${response.status}:`, errBody);
      return res.status(200).json({ results: [] });
    }

    const data = await response.json();
    const text = (data.content?.[0]?.text || '').trim();
    console.log(`[interpret-deals] Claude raw response (${text.length} chars):`, text.slice(0, 500));

    try {
      const parsed = JSON.parse(text);
      const ingCount = (parsed.results || []).filter(r => r.isIngredient).length;
      console.log(`[interpret-deals] Parsed OK — ${parsed.results?.length ?? 0} total, ${ingCount} isIngredient:true`);
      return res.status(200).json(parsed);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          console.log('[interpret-deals] Parsed via regex fallback');
          return res.status(200).json(parsed);
        } catch {}
      }
      console.error('[interpret-deals] Failed to parse Claude response:', text.slice(0, 300));
      return res.status(200).json({ results: [] });
    }
  } catch (err) {
    console.error('[interpret-deals] Unexpected error:', err);
    return res.status(200).json({ results: [] });
  }
}
