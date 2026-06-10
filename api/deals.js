export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const apiKey = process.env.SALLING_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  // Accept comma-separated zip codes or a single zip
  const rawZip = req.query.zip || "";
  const zips = rawZip ? rawZip.split(",").map(z => z.trim()).filter(Boolean) : [];

  try {
    // Fetch for each zip in parallel (max 3 to avoid rate limits)
    const targets = zips.slice(0, 3).length > 0 ? zips.slice(0, 3) : [null];
    const responses = await Promise.all(
      targets.map(zip => {
        const url = new URL("https://api.sallinggroup.com/v1/food-waste");
        if (zip) url.searchParams.set("zip", zip);
        return fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json",
          },
        }).then(r => {
          if (!r.ok) return [];
          return r.json();
        }).catch(() => []);
      })
    );

    // Normalise: flatten all stores × clearances into flat deal objects
    const seen = new Set();
    const deals = [];

    for (const storeList of responses) {
      if (!Array.isArray(storeList)) continue;
      for (const storeData of storeList) {
        const store = storeData.store || {};
        for (const clearance of storeData.clearances || []) {
          const offer = clearance.offer || {};
          const product = clearance.product || {};
          const key = `${store.id}-${product.ean || product.description}`;
          if (seen.has(key)) continue;
          seen.add(key);
          deals.push({
            id: key,
            description: product.description || "",
            ean: product.ean || null,
            price: offer.price ?? null,
            originalPrice: offer.originalPrice ?? null,
            discount: offer.percentDiscount ?? null,
            endTime: offer.endTime || null,
            startTime: offer.startTime || null,
            stock: offer.stock ?? null,
            stockUnit: offer.stockUnit || null,
            currency: offer.currency || "DKK",
            store: store.name || "",
            brand: (store.brand || "").toLowerCase(), // "netto", "foetex", "bilka"
            storeId: store.id || null,
            storeCity: store.address?.city || "",
            storeZip: store.address?.zip || "",
          });
        }
      }
    }

    // Cache for 30 minutes — food waste offers don't change that often
    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
    return res.status(200).json(deals);
  } catch (err) {
    console.error("Salling API error:", err);
    return res.status(502).json({ error: "Failed to fetch deals from Salling" });
  }
}
