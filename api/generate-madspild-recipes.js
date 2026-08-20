const SYSTEM = `Du er en opskriftsgenerator for en dansk mad-app. Du modtager en liste af discounterede ingredienser fra supermarkedets madspildssektion. Generer præcis 2-3 lækre, realistiske danske opskrifter der bruger så mange af disse ingredienser som muligt som HOVEDINGREDIENSER.

DEALITEM-REGLER:
- Brug dealItem-feltet til at angive tilbudsingredienser der bruges i opskriften
- Værdien af dealItem SKAL matche NØJAGTIGT med et "ingredient"-navn fra input-listen (f.eks. "laks", "kylling", "spinat")
- Sæt dealItem = null for varer der IKKE er på input-listen. Bemærk: løg, hvidløg, citron, smør, fløde, æg osv. er IKKE basisvarer — de er helt almindelige indkøbsvarer, men får kun en dealItem hvis de står på input-listen.
- Kun ægte basisvarer (salt, peber, madolie/olivenolie, vand, sukker, mel, eddike, bouillon og tørrede krydderier) er noget man har hjemme.

OUTPUT FORMAT — kun ren JSON, ingen markdown, ingen forklaring:
{"recipes":[{"title":"Stegt laks med citronsmør","emoji":"🐟","time":"25 min","servings_count":4,"category":"Fisk","cuisine":"nordisk","mealType":"aftensmad","cookingMethod":"Én pande","difficulty":"Nem","allergens":["Fisk","Mælk / laktose"],"dietTags":["pescetar"],"description":"En hurtig og lækker hverdagsret med frisk laks.","ingredients":[{"text":"600 g laks filet","dealItem":"laks"},{"text":"50 g smør","dealItem":null},{"text":"1 citron, saft og skal","dealItem":null}],"steps":["Krydr laksen med salt og peber på begge sider.","Smelt smørret i en pande på middel-høj varme.","Steg laksen 3-4 min på hver side til den er gyldenbrun.","Tilsæt citronsaft og server straks."],"tip":"Server med kogte kartofler eller en frisk grøn salat."}]}

REGLER:
- Generer ALTID præcis 2-3 opskrifter — aldrig mere, aldrig færre
- Alle trin i "steps" skal være konkrete, præcise og rækkefølgeordnet
- "time" angiver realistisk samlet tilberedningstid
- "servings_count" skal være 2, 4 eller 6
- Opskrifterne skal passe til en dansk familiemiddag
- emoji skal afspejle opskriftens indhold (🐟 fisk, 🍗 kylling, 🥩 kød, 🥦 grønt, 🍝 pasta osv.)
- Varier opskrifterne så de bruger ingredienserne på forskellig vis
- "mealType" skal være én af: "aftensmad", "frokost", "morgenmad", "snack"
- "cookingMethod" skal være én af: "Én pande", "Ovn", "Gryde", "Wok", "Grill", "Bagning", "Ingen tilberedning"
- "difficulty" skal være én af: "Nem", "Middel", "Svær"
- "cuisine" skal være én af: "nordisk", "italiensk", "asiatisk", "mellemostlig", "mexicansk", "indisk", "amerikansk", "europaeisk"
- "allergens" er et array (kan være tomt) — brug KUN disse EU-14 danske betegnelser: Gluten, Skaldyr, Æg, Fisk, Jordnødder, Soja, Mælk / laktose, Nødder, Selleri, Sennep, Sesamfrø, Svovldioxid og sulfitter, Lupin, Bløddyr
- "dietTags" er et array (kan være tomt) — brug KUN: "vegetar", "vegansk", "pescetar", "fleksitar", "halal", "kosher"`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { ingredients } = req.body || {};
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: 'ingredients array required' });
  }

  const apiKey = process.env.VITE_CLAUDE_KEY;
  if (!apiKey) {
    console.error('[generate-madspild-recipes] VITE_CLAUDE_KEY is not set');
    return res.status(500).json({ error: 'Claude API key not configured' });
  }

  const ingredientList = ingredients
    .map(i => `- ${i.ingredient} (${i.category})`)
    .join('\n');

  const userContent = `Generer 2-3 danske opskrifter baseret på disse discounterede ingredienser:\n${ingredientList}`;

  console.log(`[generate-madspild-recipes] Generating for: ${ingredients.map(i => i.ingredient).join(', ')}`);

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
        max_tokens: 4096,
        system: SYSTEM,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.error(`[generate-madspild-recipes] Claude API ${response.status}:`, errBody);
      return res.status(200).json({ recipes: [], _error: `Claude API ${response.status}: ${errBody.slice(0, 200)}` });
    }

    const data = await response.json();
    const stopReason = data.stop_reason;
    const rawText = (data.content?.[0]?.text || '').trim();

    if (stopReason === 'max_tokens') {
      console.error('[generate-madspild-recipes] Claude hit max_tokens');
      return res.status(200).json({ recipes: [], _error: 'Claude response truncated' });
    }

    const text = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

    const parseRecipes = (raw) =>
      (raw.recipes || []).filter(r =>
        r.title &&
        Array.isArray(r.steps) && r.steps.length > 0 &&
        Array.isArray(r.ingredients) && r.ingredients.length > 0
      );

    try {
      const parsed = JSON.parse(text);
      const recipes = parseRecipes(parsed);
      console.log(`[generate-madspild-recipes] OK — ${recipes.length} recipes: ${recipes.map(r => r.title).join(', ')}`);
      return res.status(200).json({ recipes });
    } catch { /* fall through */ }

    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        const recipes = parseRecipes(parsed);
        console.log(`[generate-madspild-recipes] OK (regex) — ${recipes.length} recipes`);
        return res.status(200).json({ recipes });
      } catch { /* fall through */ }
    }

    console.error('[generate-madspild-recipes] Failed to parse. Raw:', rawText.slice(0, 400));
    return res.status(200).json({ recipes: [], _error: `JSON parse failed. Raw: ${rawText.slice(0, 200)}` });

  } catch (err) {
    console.error('[generate-madspild-recipes] Unexpected error:', err);
    return res.status(200).json({ recipes: [], _error: String(err) });
  }
}
