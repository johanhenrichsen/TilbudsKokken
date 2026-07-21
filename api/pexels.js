export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Missing query parameter' });

  const key = process.env.PEXELS_API_KEY;
  if (!key) return res.status(500).json({ error: 'PEXELS_API_KEY not configured' });

  // Landscape orientation frames food better on the card; fetching several
  // results lets Pexels' relevance ranking pick a good match. We take the top
  // ranked (photos[0]) — Pexels already orders by relevance to the query.
  const search = async q => {
    const resp = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=12&orientation=landscape`,
      { headers: { Authorization: key } }
    );
    if (!resp.ok) throw Object.assign(new Error(`Pexels ${resp.status}`), { status: resp.status });
    const data = await resp.json();
    return data?.photos?.[0]?.src?.large || null;
  };

  try {
    let url = await search(query);
    // Fallback: if the specific dish query found nothing, retry with a broader
    // query (drop all but the last two words, which are the core dish + "food").
    if (!url) {
      const parts = query.trim().split(/\s+/);
      const broad = parts.slice(-2).join(" ") || query;
      if (broad !== query) url = await search(broad);
    }
    return res.status(200).json({ url });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}
