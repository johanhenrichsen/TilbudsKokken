const SALLING_BRANDS = ["netto", "foetex", "bilka"];
const BRAND_TO_CHAIN = { netto: "Netto", foetex: "Føtex", bilka: "Bilka" };

async function fetchBrand(apiKey, brand) {
  const stores = [];
  for (let page = 1; page <= 30; page++) {
    const url = `https://api.sallinggroup.com/v2/stores?brand=${brand}&per_page=100&page=${page}`;
    let r;
    try {
      r = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      });
    } catch {
      break;
    }
    if (!r.ok) break;
    const data = await r.json();
    const items = Array.isArray(data) ? data : (data.data || data.stores || []);
    stores.push(...items);
    if (items.length < 100) break;
  }
  return stores;
}

function normalize(raw, chain) {
  return raw
    .filter(s => {
      const country = s.address?.country;
      return !country || country === "DK" || country === "Denmark";
    })
    .map(s => ({
      name: s.name || `${chain} ${s.address?.city || ""}`.trim(),
      chain,
      city: s.address?.city || "",
      zip: s.address?.zip || "",
      street: s.address?.street || "",
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "da"));
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const apiKey = process.env.SALLING_API_KEY;
  if (!apiKey) {
    console.error("[salling-stores] SALLING_API_KEY not set");
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const [nettoRaw, foetexRaw, bilkaRaw] = await Promise.all(
      SALLING_BRANDS.map(b => fetchBrand(apiKey, b))
    );

    const result = {
      Netto: normalize(nettoRaw, "Netto"),
      Føtex: normalize(foetexRaw, "Føtex"),
      Bilka: normalize(bilkaRaw, "Bilka"),
    };

    console.log(
      `[salling-stores] Netto:${result.Netto.length} Føtex:${result.Føtex.length} Bilka:${result.Bilka.length}`
    );

    // Stores change rarely — cache for 24 h, serve stale for 7 days
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
    return res.status(200).json(result);
  } catch (err) {
    console.error("[salling-stores] Unexpected error:", err);
    return res.status(502).json({ error: "Failed to fetch stores from Salling" });
  }
}
