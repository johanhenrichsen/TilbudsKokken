// Translates short Danish UI/recipe strings to English on demand.
// The client batches untranslated strings and caches results, so each string
// is only ever translated once. Reuses the same Claude key as the rest of the app.

const SYSTEM = `You are a translation engine for a Danish recipe app. Translate each Danish string to natural, idiomatic English.

RULES:
- Keep all numbers, quantities and units exactly as written (e.g. "560 g", "2 dl", "1½", "180°C").
- Translate food and cooking terms accurately (e.g. "kyllingelår" → "chicken thighs", "fløde" → "cream", "svinemørbrad" → "pork tenderloin").
- Keep it concise — do not add or remove information, and do not add explanations.
- Preserve the original capitalisation style (a Title Case dish name stays Title Case).
- If a string is already English or is a proper noun/brand (e.g. "Netto", "Rema 1000"), return it unchanged.

OUTPUT FORMAT — VERY IMPORTANT:
- Return ONLY this JSON, no markdown, no commentary. Use the "n" value from the input as the key:
{"results":[{"n":0,"t":"English translation"},{"n":1,"t":"English translation"}]}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { texts } = req.body || {};
  if (!Array.isArray(texts) || texts.length === 0) {
    return res.status(400).json({ error: 'texts array required' });
  }

  const apiKey = process.env.VITE_CLAUDE_KEY;
  if (!apiKey) {
    console.error('[translate] VITE_CLAUDE_KEY is not set');
    return res.status(500).json({ error: 'Claude API key not configured' });
  }

  // Cap the batch so output stays within max_tokens. Client already chunks,
  // but guard here too.
  const batch = texts.slice(0, 60).map(s => String(s ?? ''));
  const indexed = batch.map((t, n) => ({ n, t }));

  const userContent = `Translate these ${indexed.length} Danish strings to English. Use the "n" value as the key in your output:
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
      console.error(`[translate] Claude API ${response.status}:`, errBody.slice(0, 300));
      return res.status(200).json({ translations: [], _error: `Claude API ${response.status}` });
    }

    const data = await response.json();
    const rawText = (data.content?.[0]?.text || '').trim();

    if (data.stop_reason === 'max_tokens') {
      console.error('[translate] hit max_tokens — reduce batch size');
      return res.status(200).json({ translations: [], _error: 'response truncated' });
    }

    const text = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

    const parseInto = (raw) => {
      const out = new Array(batch.length).fill(null);
      for (const r of (raw.results || [])) {
        if (typeof r.n === 'number' && r.n >= 0 && r.n < batch.length) out[r.n] = r.t ?? null;
      }
      return out;
    };

    try {
      return res.status(200).json({ translations: parseInto(JSON.parse(text)) });
    } catch { /* fall through to regex */ }

    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return res.status(200).json({ translations: parseInto(JSON.parse(match[0])) });
      } catch { /* fall through */ }
    }

    console.error('[translate] Failed to parse. Raw:', rawText.slice(0, 300));
    return res.status(200).json({ translations: [], _error: 'JSON parse failed' });
  } catch (err) {
    console.error('[translate] Unexpected error:', err);
    return res.status(200).json({ translations: [], _error: String(err) });
  }
}
