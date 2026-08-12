// Tjek (eTilbudsavis) API v2 base URL; auth via X-Api-Key request header.
const BASE = "https://api.etilbudsavis.dk/v2"; // per Task 1 spike

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
        .find(c => new Date(c.runFrom).getTime() <= t && t <= new Date(c.runTill).getTime());
      return active ?? null;
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
