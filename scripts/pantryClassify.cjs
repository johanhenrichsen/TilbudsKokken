// Canonical pantry classification for Spotkokken recipe ingredients.
//
// The app splits every ingredient into two buckets:
//   • PANTRY (isPantry: true)  — true shelf staples you always have at home.
//                                 Excluded from the shopping list AND the price.
//   • SHOPPABLE (isPantry:false) — everything you actually buy for the meal.
//                                  Counted in the per-person price and put on the
//                                  shopping list. A shoppable item may or may not
//                                  be a specific store deal (it's a deal only when
//                                  it has a `store`).
//
// Historically onion (løg), garlic (hvidløg), butter, cream, lemon, canned
// tomatoes etc. were miscategorised as pantry, so their cost never showed up in
// the recipe price. The rule below is a strict *allowlist*: an ingredient is
// pantry ONLY if it is one of a small set of universal staples. Everything else
// is shoppable. Keep this list in sync with the generator prompts.
//
// Staples that stay pantry: salt, pepper, cooking oil, water, sugar, flour,
// vinegar, bouillon/stock, and dried/ground spices & dried herbs.

// Anything bought "til stegning/kogning" (fat/salt used purely for the pan or
// the pasta water) is always a staple regardless of the base word.
const FOR_COOKING = /\btil\s+(steg|steng|kog|pande|friture|bag)/i;

// Fresh produce/herbs are never pantry even if the base word looks staple-ish
// (e.g. "frisk timian" is shoppable, "timian" from a jar is pantry).
const FRESH = /\bfrisk|friske\b|\bi potte\b/i;

// Words that share a substring with a staple keyword but are real produce/goods.
// Checked first so "peberfrugt" is never mistaken for seasoning "peber", etc.
const NOT_STAPLE = /peberfrugt|peberrod|rød peber|grøn peber|gul peber|melon|karamel|karameliseret/i;

// Substring keywords that mark a true staple. Matched case-insensitively against
// the whole ingredient text.
const STAPLE_KEYWORDS = [
  // salt & pepper
  "salt og peber", "salt & peber", "salt/peber", "salt", "peber", "peberkorn",
  // cooking oil / frying fat
  "olivenolie", "oliven olie", "olivenollie", "olivensolie", "sesamolie",
  "rapsolie", "solsikkeolie", "vindruekerneolie", "madolie", "neutral olie",
  "jomfruolie", "olie",
  // water
  "vand",
  // sugar
  "flormelis", "puddersukker", "vaniljesukker", "rørsukker", "farin", "sukker",
  // flour & thickeners
  "hvedemel", "kartoffelmel", "majsstivelse", "maizena", "mel",
  // vinegar
  "balsamico", "riseddike", "æbleeddike", "hvidvinseddike", "eddike",
  // bouillon / stock
  "bouillonterning", "bouillon", "grøntsagsfond", "grøntsagsbouillon",
  "hønsefond", "kyllingefond", "oksefond", "fiskefond", "fond", "bouillonterning",
  // dried / ground spices
  "paprika", "spidskommen", "kommen", "cumin", "gurkemeje", "garam masala", "karrypulver",
  "karry", "chilipulver", "chili pulver", "chiliflager", "cayenne", "kanel",
  "kardemomme", "nelliker", "muskatnød", "korianderpulver", "stjerneanis",
  "hvidløgspulver", "løgpulver", "paprikapulver", "røgsalt", "chiliflager",
  "gochugaru", "sumak", "za'atar", "ras el hanout", "tandoori", "curry",
  // dried herbs (fresh handled by the FRESH guard above)
  "tørret", "oregano", "timian", "rosmarin", "merian", "estragon", "laurbær",
  "salvie", "herbes de provence", "italiensk krydderurter", "provence",
];

function normalize(text) {
  return String(text || "").toLowerCase().trim();
}

// True if the ingredient text is a universal pantry staple.
function isStaple(text) {
  const t = normalize(text);
  if (!t) return false;
  if (FOR_COOKING.test(t)) return true;      // "smør til stegning", "salt til pasta"
  if (NOT_STAPLE.test(t)) return false;      // "peberfrugt" is produce, not seasoning
  if (FRESH.test(t)) return false;           // "frisk timian", "basilikum i potte"
  return STAPLE_KEYWORDS.some(k => t.includes(k));
}

// Estimated normal (non-deal) grocery cost in DKK for a shoppable "basic"
// ingredient — the meal's realistic share, not a whole retail package. Only used
// for items that aren't a store deal (no price of their own). Ordered: first
// keyword hit wins, so put longer/more-specific keywords first.
const BASIC_PRICE_RULES = [
  [/kartof/, 12],                                   // potatoes
  [/(piskefløde|madlavningsfløde|fløde|cremefine|creme frai|crème frai|fraiche|fraîche)/, 12],
  [/(fiskesauce|østerssauce)/, 12],
  [/(kapers|oliven\b)/, 12],
  [/(parmesan|pecorino)/, 15],
  [/(mozzarella|feta|halloumi|flødeost|revet ost|cheddar|ost\b)/, 14],
  [/(sojasauce|soja|teriyaki|hoisin|sweet chili|ketchup|bbq)/, 10],
  [/(mayonnaise|majonnaise|remoulade|dressing)/, 10],
  [/(dijon|sennep)/, 8],
  [/(mælk|kærnemælk|kokosmælk)/, 9],
  [/(spinat|broccoli|blomkål|squash|aubergine)/, 10],
  [/(champignon|svampe)/, 12],
  [/(peberfrugt|peberfrud|agurk|salat|porre|selleri|fennikel)/, 8],
  [/(forårsløg|forårsog)/, 5],
  [/(rødløg|skalotteløg|gul løg|løg)/, 4],          // onions (after spring onion)
  [/hvidløg/, 4],                                    // garlic
  [/(gulerod|gulerødder)/, 5],
  [/ingefær/, 5],
  [/(citronsaft|limesaft|lime|citron)/, 4],          // citrus + juice
  [/(hakkede tomater|flåede tomater|dåsetomat|dåse tomat|tomatpuré|tomatpure|passata)/, 6],
  [/(cocktailtomat|tomat)/, 8],                      // fresh tomato
  [/(honning|sirup|ahornsirup)/, 6],
  [/æg\b/, 6],                                       // eggs
  [/smør/, 8],                                       // butter
  [/(rasp|panko|brødkrummer|krummer)/, 6],
  [/(persille|dild|koriander|basilikum|mynte|urter|purløg|kørvel)/, 8], // fresh herbs
  [/(bønner|kikærter|linser|majs)/, 8],
  [/(nødder|mandler|cashew|peanut|sesamfrø|kerner)/, 12],
];

function estimateBasicPrice(text) {
  const t = normalize(text);
  for (const [re, price] of BASIC_PRICE_RULES) {
    if (re.test(t)) return price;
  }
  return 6; // sensible fallback for an unlisted everyday ingredient
}

module.exports = { isStaple, estimateBasicPrice };
