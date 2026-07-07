export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Missing query parameter' });

  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return res.status(500).json({ error: 'UNSPLASH_ACCESS_KEY not configured' });

  try {
    const resp = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`,
      { headers: { Authorization: `Client-ID ${key}` } }
    );
    if (!resp.ok) {
      return res.status(resp.status).json({ error: `Unsplash returned ${resp.status}` });
    }
    const data = await resp.json();
    const url = data?.results?.[0]?.urls?.small || null;
    return res.status(200).json({ url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
