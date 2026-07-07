export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Missing query parameter' });

  const key = process.env.PEXELS_API_KEY;
  if (!key) return res.status(500).json({ error: 'PEXELS_API_KEY not configured' });

  try {
    const resp = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
      { headers: { Authorization: key } }
    );
    if (!resp.ok) {
      return res.status(resp.status).json({ error: `Pexels returned ${resp.status}` });
    }
    const data = await resp.json();
    const url = data?.photos?.[0]?.src?.large || null;
    return res.status(200).json({ url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
