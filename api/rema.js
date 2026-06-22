const BASE = "https://cphapp.rema1000.dk/api/v3";
const UA = "Spotkokken/1.0 (tilbuds-kokken.vercel.app)";

// Rema department slugs that contain cooking ingredients
const FOOD_DEPT_SLUGS = new Set([
  "frugt-gront",       // Frugt & grønt
  "kod-fisk-fjerkrae", // Kød, fisk & fjerkræ
  "kol",               // Køl
  "frost",             // Frost
  "mejeri",            // Mejeri
  "ost-mv",            // Ost m.v.
  "kolonial",          // Kolonial
]);

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

async function fetchJSON(url) {
  const r = await fetch(url, {
    headers: { "User-Agent": UA, "Accept": "application/json" },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.json();
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    // Fetch all departments, filter to food-relevant ones
    const deptsData = await fetchJSON(`${BASE}/departments`);
    const foodDepts = (deptsData.data || []).filter(d => FOOD_DEPT_SLUGS.has(d.slug));
    console.log(`[rema] ${foodDepts.length} food departments: ${foodDepts.map(d => d.name).join(", ")}`);

    // Fetch all food department products in parallel — one request per department
    const productArrays = await Promise.all(
      foodDepts.map(dept =>
        fetchJSON(`${BASE}/departments/${dept.id}/products`)
          .then(d => d.data || [])
          .catch(err => {
            console.warn(`[rema] dept ${dept.id} failed:`, err.message);
            return [];
          })
      )
    );

    const now = Date.now();
    const seen = new Set();
    const deals = [];

    for (const products of productArrays) {
      for (const product of products) {
        const prices = product.prices || [];

        // Find the currently active price entry
        const activeIdx = prices.findIndex(p => {
          const start = p.starting_at ? Date.parse(p.starting_at) : 0;
          const end = p.ending_at ? Date.parse(p.ending_at) : Infinity;
          return start <= now && end >= now;
        });
        if (activeIdx === -1) continue;

        const active = prices[activeIdx];

        // Only include campaign deals or time-limited advertised promotions
        if (active.is_campaign) {
          // Campaign = explicitly discounted, always include
        } else if (active.is_advertised) {
          // Advertised-only: include only if the promotion ends within 30 days
          // (filters out "permanent" advertised prices with ending_at far in the future)
          const end = active.ending_at ? Date.parse(active.ending_at) : Infinity;
          if (end - now > THIRTY_DAYS_MS) continue;
        } else {
          continue;
        }

        const id = `rema-${product.id}`;
        if (seen.has(id)) continue;
        seen.add(id);

        // Original price = next price entry (the regular price after campaign ends)
        const next = prices[activeIdx + 1];
        const originalPrice = (next && next.price > active.price) ? next.price : null;
        const discount = originalPrice
          ? Math.round((1 - active.price / originalPrice) * 100)
          : null;

        const description = [product.name, product.underline]
          .filter(Boolean)
          .join(" – ");

        deals.push({
          id,
          description,
          ean: product.ean || null,
          price: active.price,
          originalPrice,
          discount,
          endTime: active.ending_at || null,
          startTime: active.starting_at || null,
          stock: null,
          stockUnit: null,
          currency: "DKK",
          store: "Rema 1000",
          brand: "rema1000",
          storeId: null,
          storeCity: "",
          storeZip: "",
        });
      }
    }

    console.log(`[rema] ${deals.length} deals found`);
    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
    return res.status(200).json({ deals });

  } catch (err) {
    console.error("[rema] Error:", err);
    return res.status(502).json({ deals: [], error: String(err) });
  }
}
