export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Missing query parameter' });

  const key = process.env.PEXELS_API_KEY;
  if (!key) return res.status(500).json({ error: 'PEXELS_API_KEY not configured' });

  // Words in a photo's alt text that mean it is NOT a plated dish. If one of
  // these appears and no food-context word does, we skip the photo outright so a
  // stock portrait / landscape never lands on a recipe card.
  const NON_FOOD = [
    'person', 'people', 'woman', 'women', 'man ', ' men ', 'girl', 'boy',
    'child', 'kid', 'portrait', 'wedding', 'model', 'fashion', 'office',
    'desk', 'laptop', 'computer', 'phone', 'building', 'cityscape', 'street',
    'car ', 'landscape', 'mountain', 'beach', 'flower', 'animal', 'dog', 'cat',
    'sky', 'forest', 'field', 'farm', 'grocery', 'supermarket', 'shopping',
    'menu', 'text', 'signage', 'poster',
  ];
  // Generic culinary words that confirm a photo is food even when the specific
  // dish name is missing from the alt text.
  const FOOD_HINTS = [
    'food', 'dish', 'meal', 'plate', 'bowl', 'cuisine', 'delicious', 'tasty',
    'cooked', 'homemade', 'fresh', 'served', 'sauce', 'grilled', 'baked',
    'roasted', 'fried', 'dinner', 'lunch', 'breakfast', 'restaurant', 'kitchen',
    'ingredient', 'cooking', 'salad', 'soup', 'dessert', 'snack',
  ];

  // Meaningful query tokens (drop the trailing generic "food" and short words).
  const tokens = query
    .toLowerCase()
    .replace(/\bfood\b/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);

  // Score each candidate against its alt text. Earlier query tokens carry the
  // dish identity, so they weigh more than later ones. Returns photos sorted
  // best-first with clearly non-food shots dropped.
  const rank = photos => {
    return photos
      .map((p, i) => {
        const alt = ` ${(p.alt || '').toLowerCase().trim()} `;
        const posBias = i * 0.05; // gentle tie-break toward Pexels' own ranking
        let score;
        if (alt.trim() === '') {
          score = -0.5 - posBias; // unverifiable — keep only as a last resort
        } else if (NON_FOOD.some(w => alt.includes(w)) && !FOOD_HINTS.some(w => alt.includes(w))) {
          score = -100 - posBias; // clearly not a food photo
        } else {
          score = 0;
          tokens.forEach((tok, ti) => {
            if (alt.includes(tok)) score += Math.max(1, 4 - ti);
          });
          if (FOOD_HINTS.some(w => alt.includes(w))) score += 1;
          score -= posBias;
        }
        return { p, score };
      })
      .filter(x => x.score > -100)   // drop the certain non-food shots entirely
      .sort((a, b) => b.score - a.score)
      .map(x => x.p?.src?.large)
      .filter(Boolean);
  };

  // Landscape frames food better on the card. Fetch a wide pool so scoring has
  // real choices — and so the client has spare candidates to avoid duplicates
  // across recipes.
  const search = async q => {
    const resp = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=24&orientation=landscape`,
      { headers: { Authorization: key } }
    );
    if (!resp.ok) throw Object.assign(new Error(`Pexels ${resp.status}`), { status: resp.status });
    const data = await resp.json();
    return rank(data?.photos || []);
  };

  try {
    let candidates = await search(query);
    // Fallback: if the specific dish query found nothing, retry with just the
    // dish identity — the FIRST two meaningful words (cuisine + core dish),
    // not the last two (which are the side, e.g. "rice").
    if (!candidates.length) {
      const parts = query.toLowerCase().replace(/\bfood\b/g, ' ').trim().split(/\s+/);
      const broad = `${parts.slice(0, 2).join(' ')} food`.trim();
      if (broad !== query.toLowerCase().trim()) candidates = await search(broad);
    }
    // `url` kept for backward compatibility; `candidates` lets the client pick
    // an image not already used by another recipe card.
    return res.status(200).json({ url: candidates[0] || null, candidates });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}
