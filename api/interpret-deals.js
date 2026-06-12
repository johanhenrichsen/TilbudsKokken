const SYSTEM = `Du er et produktfortolkningssystem til en dansk madspild-app. Konverter rå supermarkedsbeskrivelser til struktureret ingrediensinformation.

For hvert produkt, bestem:
- "ingredient": Det kanoniske danske navn på råvaren med lowercase (f.eks. "kyllingebryst", "laks", "fløde", "gulerødder", "hakket oksekød"). Returner null hvis det ikke er en råvare.
- "category": Én af: "kød", "fisk", "mejeri", "æg", "grønt", "korn", "krydderi", "færdigret", "andet"
- "isIngredient": true KUN for rå eller minimalt forarbejdede madlavningsingredienser. false for færdigretter, saucer, drikkevarer, snacks, krydderiblandinger og alt der ikke er en råvare.

Eksempler:
- "KYLLINGEBRYST 500G" → ingredient:"kyllingebryst", category:"kød", isIngredient:true
- "PASTA KYL PERSI SALLING NU" → ingredient:null, category:"færdigret", isIngredient:false
- "MADLAVNINGSFLØDE 15% ARLA 0.5L" → ingredient:"madlavningsfløde", category:"mejeri", isIngredient:true
- "LAKS FILET FRISK 400G" → ingredient:"laks", category:"fisk", isIngredient:true
- "LASAGNE BOLOGNESE FÆRDIG 400G" → ingredient:null, category:"færdigret", isIngredient:false
- "HAKKET OKSEKØD 8% 500G" → ingredient:"hakket oksekød", category:"kød", isIngredient:true
- "SPINAT FRISK 200G" → ingredient:"spinat", category:"grønt", isIngredient:true
- "BOLOGNESE SAUCE 350G" → ingredient:null, category:"færdigret", isIngredient:false

Returner KUN gyldig JSON uden forklaringstekst.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { deals } = req.body || {};
  if (!Array.isArray(deals) || deals.length === 0) {
    return res.status(400).json({ error: 'deals array required' });
  }

  const apiKey = process.env.VITE_CLAUDE_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Claude API key not configured' });

  const userContent = `Fortolk disse produktbeskrivelser fra danske supermarkeders madspild-API:
${JSON.stringify(deals.slice(0, 60))}

Returner præcis dette JSON-format:
{"results":[{"id":"...","ingredient":"...","category":"...","isIngredient":true},{"id":"...","ingredient":null,"category":"færdigret","isIngredient":false},...]}`;

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

    // Try direct parse first
    try {
      return res.status(200).json(JSON.parse(text));
    } catch {
      // Extract JSON block if Claude added surrounding text
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { return res.status(200).json(JSON.parse(match[0])); } catch {}
      }
      return res.status(200).json({ results: [] });
    }
  } catch (err) {
    console.error('interpret-deals error:', err);
    // Always return 200 so the client can gracefully fall back to keyword matching
    return res.status(200).json({ results: [] });
  }
}
