const SYSTEM = `Du er et præcist opskrift-ingrediens-matchningssystem til en dansk madspild-app. Find opskrifter der SPECIFIKT kræver den tilgængelige råvare.

STRENGE REGLER:
1. Match KUN hvis råvaren direkte svarer til et af opskriftens "dealItems" — tjek hvert dealItem eksplicit
2. Godkendte matches (ingredient → dealItem):
   - "kyllingebryst" eller "kyllingefilet" → "Kyllingefilet 600g" ✓
   - "hakket oksekød" → "Hakket oksekød 500g" ✓
   - "mozzarella" → "Mozzarella 125g" ✓
   - "madlavningsfløde" eller "fløde" → "Fløde 38% 0.5L" ✓
   - "laks" eller "laksfilet" → "Laks filet 400g" ✓
   - "spaghetti" → "Spaghetti 500g" ✓
   - "pasta" eller "penne" → "Pasta penne 500g" ✓
   - "spinat" → "Spinat frisk 200g" ✓
   - "parmesan" → "Parmesan revet 80g" ✓
   - "gulerødder" → "Gulerødder 1kg" ✓
3. Uacceptable matches:
   - En ingrediens matcher IKKE et dealItem bare fordi det er samme kategori
   - "laks" matcher IKKE en opskrift der bruger "Kyllingefilet" — begge er protein, men de er forskellige råvarer
   - "tomat" (frisk) matcher IKKE nødvendigvis alle opskrifter med tomater — tjek det specifikke dealItem
4. Vær hellere for strict end for løs. Vis frem for alt KORREKTE matches — ikke flest mulige.
5. Returner KUN opskrifter med mindst ét klart, specifikt match.

Returner KUN gyldig JSON, ingen forklaringstekst, ingen markdown.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { ingredients, recipes } = req.body || {};
  if (!Array.isArray(ingredients) || !Array.isArray(recipes)) {
    return res.status(400).json({ error: 'ingredients and recipes arrays required' });
  }

  const apiKey = process.env.VITE_CLAUDE_KEY;
  if (!apiKey) {
    console.error('[match-recipes] VITE_CLAUDE_KEY is not set');
    return res.status(500).json({ error: 'Claude API key not configured' });
  }
  console.log(`[match-recipes] Matching ${ingredients.length} ingredients against ${recipes.length} recipes`);

  const userContent = `Tilgængelige madspild-råvarer (allerede klassificeret som ægte råvarer):
${JSON.stringify(ingredients)}

Opskrifter med deres specifikke råvare-krav (dealItems):
${JSON.stringify(recipes)}

For hver opskrift med mindst ét klart ingredient-match, returner recipe-ID og hvilke deal-IDs der matcher:
{"matches":[{"recipeId":4,"matchedDealIds":["deal-id-1"]},...]}
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
      const errBody = await response.text().catch(() => '');
      console.error(`[match-recipes] Claude API ${response.status}:`, errBody);
      return res.status(200).json({ matches: [] });
    }

    const data = await response.json();
    const text = (data.content?.[0]?.text || '').trim();
    console.log(`[match-recipes] Claude raw response (${text.length} chars):`, text.slice(0, 500));

    try {
      const parsed = JSON.parse(text);
      console.log(`[match-recipes] Parsed OK — ${parsed.matches?.length ?? 0} matches`);
      return res.status(200).json(parsed);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          console.log('[match-recipes] Parsed via regex fallback');
          return res.status(200).json(parsed);
        } catch {}
      }
      console.error('[match-recipes] Failed to parse Claude response:', text.slice(0, 300));
      return res.status(200).json({ matches: [] });
    }
  } catch (err) {
    console.error('[match-recipes] Unexpected error:', err);
    return res.status(200).json({ matches: [] });
  }
}
