const EXCLUDE = [
  "vodka", "vin ", "øl", "bajer", "spiritus", "gajol", "shot", "cocktail",
  "slik", "chokolade", "marabou", "chips", "sodavand", "cola", "energidrik",
  "toiletpapir", "køkkenrulle", "vaskepulver", "sæbe", "shampoo", "tandpasta",
  "bleer", "rengøring", "opvasketabs",
];

export function toBaseRow(offer, dealer) {
  const q = offer.quantity?.size;
  const unit = offer.quantity?.unit?.symbol ?? "";
  const size = q?.from ?? null;
  const weight = size != null && unit ? `${size} ${unit}` : "";
  return {
    store: dealer.name,
    brand: dealer.brand,
    catalogId: dealer.catalogId ?? null,
    validFrom: offer.run_from ?? null,
    validTo: offer.run_till ?? null,
    name: offer.heading ?? "",
    price: offer.pricing?.price ?? null,
    currency: offer.pricing?.currency ?? "DKK",
    weight,
    unit,
    pricePerUnit: null,
  };
}

export function isFood(row) {
  const n = (row.name ?? "").toLowerCase();
  if (!n) return false;
  return !EXCLUDE.some(bad => n.includes(bad));
}
