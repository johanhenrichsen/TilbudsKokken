const SYSTEM = `Du er et strikt produktklassifikationssystem til en dansk madspild-app. Afgør om et supermarkedsprodukt er en RÅ MADLAVNINGSINGREDIIENS der kan bruges i hjemmelavede opskrifter.

REGEL 1 — Sæt ALTID isIngredient=false for disse produkttyper, uanset andre ord i beskrivelsen:
- Færdigretter af enhver slags: pasta med sovs, lasagne, arancini, pizza, dumplings, burritos, wok-retter, suppe, grød
- "SALLING NU"-produkter — disse er ALTID færdigretter
- Forarbejdede produkter med smagsgivere/krydderier tilsat (f.eks. "tofu basilikum", "kylling tikka", "laks teriyaki")
- Pålæg, patéer, leverpostej, rullepølse
- Drikkevarer, juice, mælkedrikke
- Snacks, chips, kiks, nødder, chokolade
- Brød, boller, kager, desserter
- Saucer, dressinger, marinader, pesto, dips
- Krydderiblandinger, bouillonterninger, mix-produkter
- Frosne færdigretter
- Produkter der klart er et brand-navn på en sammensat ret

REGEL 2 — Sæt isIngredient=true KUN for disse:
- Råt kød/fjerkræ uden tilsætning: kyllingebryst, hakket oksekød, svinekød, lammekød
- Hel/filet fisk og skaldyr uden tilsætning: laksfilet, torsk, rejer
- Uforarbejdede grøntsager og frugt: gulerødder, spinat, tomater, løg, kartofler
- Basale mejeriprodukter: fløde, smør, ost (mozzarella, parmesan, ricotta), æggehvider
- Æg
- Tørret pasta, ris, couscous, korn — KUN hvis det er rent tørret produkt (ikke med sovs/krydderier)
- Bælgfrugter og linser (tørrede/på dåse, ren vare)

REGEL 3 — Confidence:
- "high": Produktet er entydigt en råvare eller entydigt IKKE en råvare
- "medium": Sandsynligvis en råvare men der er lidt tvivl
- "low": Usikkert om produktet er en råvare — sæt isIngredient=false ved tvivl

EKSEMPLER (lær disse udenad):
"ARANCINI TOMAT SALLING NU" → isIngredient:false, category:"færdigret", ingredient:null, confidence:"high"
"TOFU BASILIKUM 180G LUNTER" → isIngredient:false, category:"færdigret", ingredient:null, confidence:"high"
"SPAGHETTI BOLO SALLING NU 500G" → isIngredient:false, category:"færdigret", ingredient:null, confidence:"high"
"PASTA KYL PERSI SALLING NU" → isIngredient:false, category:"færdigret", ingredient:null, confidence:"high"
"KYLLINGEBRYST 500G" → isIngredient:true, category:"kød", ingredient:"kyllingebryst", confidence:"high"
"LF MOZZARELLA NORA FREE 125G" → isIngredient:true, category:"mejeri", ingredient:"mozzarella", confidence:"high"
"HAKKET OKSEKØD 8% 500G" → isIngredient:true, category:"kød", ingredient:"hakket oksekød", confidence:"high"
"MADLAVNINGSFLØDE 15% ARLA 0.5L" → isIngredient:true, category:"mejeri", ingredient:"madlavningsfløde", confidence:"high"
"LAKS FILET FRISK 400G" → isIngredient:true, category:"fisk", ingredient:"laks", confidence:"high"
"SPINAT FRISK 200G" → isIngredient:true, category:"grøntsager", ingredient:"spinat", confidence:"high"
"GULERØDDER 1KG" → isIngredient:true, category:"grøntsager", ingredient:"gulerødder", confidence:"high"

Returner KUN gyldig JSON, ingen forklaringstekst, ingen markdown.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { deals } = req.body || {};
  if (!Array.isArray(deals) || deals.length === 0) {
    return res.status(400).json({ error: 'deals array required' });
  }

  const apiKey = process.env.VITE_CLAUDE_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Claude API key not configured' });

  const userContent = `Klassificer disse produktbeskrivelser fra Salling Groups madspild-API:
${JSON.stringify(deals.slice(0, 60).map(d => ({ id: d.id, description: d.description })))}

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
      console.error('Claude API returned', response.status);
      return res.status(200).json({ results: [] });
    }

    const data = await response.json();
    const text = (data.content?.[0]?.text || '').trim();

    try {
      return res.status(200).json(JSON.parse(text));
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { return res.status(200).json(JSON.parse(match[0])); } catch {}
      }
      return res.status(200).json({ results: [] });
    }
  } catch (err) {
    console.error('interpret-deals error:', err);
    return res.status(200).json({ results: [] });
  }
}
