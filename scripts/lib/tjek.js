// =============================================================================
// Tjek (eTilbudsavis) API – confirmed by Task 1 spike (2026-08-12)
// =============================================================================
// Base URL:    https://api.etilbudsavis.dk/v2   (confirmed ✓)
// Auth header: X-Api-Key                         (confirmed ✓)
// Key required: NO – API responds 200 with empty/no key (key length 0 → works)
//
// --- CONFIRMED FIELD NAMES ---
//
// Catalog (GET /catalogs?dealer_ids=<id>):
//   id          ✓  e.g. "s4rkfm4c"
//   label       ✓  e.g. "Uge 33"
//   dealer_id   ✓  e.g. "DWZE1w"
//   run_from    ✓  e.g. "2026-08-12T22:00:00+0000"
//   run_till    ✓  e.g. "2026-08-19T21:59:59+0000"
//   (also present: ern, background, page_count, offer_count, branding, pdf_url, pages, images, …)
//
// Offer (GET /offers?catalog_id=<id>):
//   heading                   ✓  e.g. "Lurpak smør eller smørbar"
//   pricing.price             ✓  e.g. 20  (number)
//   pricing.currency          ✓  e.g. "DKK"
//   pricing.pre_price             (pre-sale price or null)
//   quantity.size.from        ✓  e.g. 200
//   quantity.size.to              e.g. 200
//   quantity.unit.symbol      ✓  e.g. "g"
//   run_from                  ✓  e.g. "2026-08-12T22:00:00+0000"
//   run_till                  ✓  e.g. "2026-08-19T21:59:59+0000"
//   (also present: id, ern, description, catalog_page, images, dealer_id, catalog_id, …)
//
// Catalog pages (GET /catalogs/<id>/pages):
//   Each page object has THREE URL fields — all confirmed present:
//     thumb   low-res  (~250px wide)
//     view    mid-res  (~700px wide)  ← recommended for display/stitch
//     zoom    high-res (~1400px wide)
//   NOTE: field "image" does NOT exist on page objects; the code's fallback
//         p.view ?? p.zoom ?? p.image is fine because view is always present.
//
// --- CONCERN FOR FOLLOW-UP ---
//   No field-name mismatches found in catalog or offer objects.
//   normalize.js reads offer.heading, offer.pricing.price, offer.pricing.currency,
//   offer.quantity.size.from, offer.quantity.unit.symbol, offer.run_from,
//   offer.run_till — ALL confirmed correct against live API.
// =============================================================================
const BASE = "https://api.etilbudsavis.dk/v2"; // confirmed by Task 1 spike

export function createTjekClient({ apiKey, fetchImpl = fetch, now = () => new Date() }) {
  async function get(pathq) {
    const res = await fetchImpl(`${BASE}${pathq}`, {
      headers: { "X-Api-Key": apiKey, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Tjek ${pathq} -> ${res.status}`);
    return res.json();
  }

  function mapCatalog(c) {
    return { id: c.id, label: c.label ?? "", dealerId: c.dealer_id,
             runFrom: c.run_from, runTill: c.run_till };
  }

  return {
    async getActiveCatalog(dealerId) {
      const list = await get(`/catalogs?dealer_ids=${encodeURIComponent(dealerId)}`);
      const t = now().getTime();
      const active = (list || [])
        .map(mapCatalog)
        .filter(c => new Date(c.runFrom).getTime() <= t && t <= new Date(c.runTill).getTime());
      if (active.length === 0) return null;
      // A dealer often runs several catalogs at once (e.g. the weekly food avis
      // AND a themed "Nonfood" catalog). Prefer the food avis.
      const foodFirst = active.filter(c => !/nonfood/i.test(c.label));
      return foodFirst[0] ?? active[0];
    },
    async getCatalogPages(catalogId) {
      const pages = await get(`/catalogs/${encodeURIComponent(catalogId)}/pages`);
      return (pages || []).map((p, i) => ({ index: i, imageUrl: p.view ?? p.zoom ?? p.image }));
    },
    async getCatalogOffers(catalogId) {
      return get(`/offers?catalog_id=${encodeURIComponent(catalogId)}`);
    },
  };
}
