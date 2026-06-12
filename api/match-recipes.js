const SYSTEM = `Du er et opskrift-ingrediens-matchningssystem til en dansk madspild-app. Afgør hvilke opskrifter der genuint bruger de tilgængelige madspild-ingredienser som meningsfulde komponenter.

MATCHNINGSREGLER:
- Match KUN hvis ingrediensen faktisk bruges i opskriften (hoved- eller støtteingrediiens, ikke blot løst relateret)
- "madlavningsfløde" eller "fløde" matcher opskrifter der kalder på fløde
- Rå kylling (kyllingebryst/kyllingefilet) matcher kyllingeopskrifter
- "laks" matcher lakseopskrifter; "tun" matcher tunopskrifter — de er ikke udskiftelige
- Tørret pasta (spaghetti/penne/fusilli) matcher pasteopskrifter der bruger tørret pasta
- "hakket oksekød" er ikke det samme som "oksebøf" eller "oksesteg" — vær præcis
- "gulerødder" som grønt matcher opskrifter der bruger gulerødder som ingrediens
- Vær STRICT: færre præcise matches er bedre end mange løse. Ingen gætterier.

Returner KUN gyldig JSON, ingen forklaringstekst.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { ingredients, recipes } = req.body || {};
  if (!Array.isArray(ingredients) || !Array.isArray(recipes)) {
    return res.status(400).json({ error: 'ingredients and recipes arrays required' });
  }

  const apiKey = process.env.VITE_CLAUDE_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Claude API key not configured' });

  const userContent = `Tilgængelige madspild-ingredienser (råvarer fra Salling Group):
${JSON.stringify(ingredients)}

Opskrifter i opskriftsbanken (med de nøgleingredienser der potentielt kan matche madspild):
${JSON.stringify(recipes)}

Returner præcis dette JSON-format — inkludér kun opskrifter med mindst ét ægte match:
{"matches":[{"recipeId":4,"matchedDealIds":["deal-id-1","deal-id-2"]},...]}
Ingen matches: {"matches":[]}`;

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
        max_tokens: 1024,
        system: SYSTEM,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!response.ok) {
      console.error('Claude API returned', response.status);
      return res.status(200).json({ matches: [] });
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
      return res.status(200).json({ matches: [] });
    }
  } catch (err) {
    console.error('match-recipes error:', err);
    return res.status(200).json({ matches: [] });
  }
}
