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

OUTPUT-FORMAT — MEGET VIGTIGT:
- Brug KUN tallet "n" som nøgle (fra input-feltet "n") — IKKE produkt-id eller beskrivelse
- Returner præcis dette JSON, ingen markdown, ingen forklaring:
{"results":[{"n":0,"ingredient":null,"category":"pålæg","isIngredient":false,"confidence":"high"},{"n":1,"ingredient":"laks","category":"fisk","isIngredient":true,"confidence":"high"},...]}`;

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

  // Batch of 40: at ~60 chars/result, 40 results ≈ 800 tokens output — safe within 4096
  const batch = deals.slice(0, 40).map(d => ({ id: d.id, description: d.description }));
  // Send only "n" (short number) + description to Claude — long UUID IDs never appear in output
  const indexed = batch.map((d, i) => ({ n: i, description: d.description }));
  console.log(`[interpret-deals] Classifying ${batch.length} deals`);

  const userContent = `Klassificer disse ${indexed.length} produkter. Brug "n"-værdien fra input som nøgle i output:
${JSON.stringify(indexed)}`;

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
      console.error(`[interpret-deals] Claude API ${response.status}:`, errBody);
      return res.status(200).json({ results: [], _error: `Claude API ${response.status}: ${errBody.slice(0, 300)}` });
    }

    const data = await response.json();
    const stopReason = data.stop_reason;
    const rawText = (data.content?.[0]?.text || '').trim();

    if (stopReason === 'max_tokens') {
      console.error('[interpret-deals] Claude hit max_tokens — increase batch size or max_tokens');
      return res.status(200).json({ results: [], _error: 'Claude response truncated (max_tokens)' });
    }

    console.log(`[interpret-deals] stop_reason=${stopReason}, ${rawText.length} chars:`, rawText.slice(0, 400));

    // Strip markdown code fences if Claude added them despite instruction
    const text = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

    // Map results back: accept both "n" (new format) and "id" (Claude ignoring instruction)
    const mapResults = (raw) =>
      (raw.results || [])
        .map(r => {
          // Try "n" (short index) first, then fall back to matching by full "id"
          let original = batch[r.n];
          if (!original && r.id) original = batch.find(d => d.id === r.id);
          if (!original) return null;
          return {
            id: original.id,
            ingredient: r.ingredient ?? null,
            category: r.category ?? null,
            isIngredient: r.isIngredient === true,
            confidence: r.confidence ?? 'medium',
          };
        })
        .filter(Boolean);

    // Try direct parse first
    try {
      const parsed = JSON.parse(text);
      const mapped = mapResults(parsed);
      const ingCount = mapped.filter(r => r.isIngredient).length;
      console.log(`[interpret-deals] OK — ${mapped.length} classified, ${ingCount} ingredients`);
      return res.status(200).json({ results: mapped });
    } catch { /* fall through to regex */ }

    // Regex extraction: find outermost {...}
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        const mapped = mapResults(parsed);
        console.log(`[interpret-deals] OK (regex) — ${mapped.length} classified`);
        return res.status(200).json({ results: mapped });
      } catch { /* fall through */ }
    }

    console.error('[interpret-deals] Failed to parse. Raw:', rawText.slice(0, 400));
    return res.status(200).json({ results: [], _error: `JSON parse failed. Raw: ${rawText.slice(0, 200)}` });

  } catch (err) {
    console.error('[interpret-deals] Unexpected error:', err);
    return res.status(200).json({ results: [], _error: String(err) });
  }
}
