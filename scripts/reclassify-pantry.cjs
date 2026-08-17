// One-off (re-runnable) migration that re-applies the canonical pantry rule to
// src/data/weeklyRecipes.json:
//   • true staples  -> isPantry:true, store:null, price:null (out of the price)
//   • everything else -> isPantry:false; deals keep their store+price, other
//     "basic" ingredients get an estimated normal-grocery price and no store.
// dealItems is rebuilt from the non-pantry ingredients that have a store, so the
// price/shopping/chain-filter logic all stay consistent.
//
// Usage:  node scripts/reclassify-pantry.cjs [--dry]

const fs = require("fs");
const path = require("path");
const { isStaple, estimateBasicPrice } = require("./pantryClassify.cjs");

const DATA_PATH = path.join(__dirname, "..", "src", "data", "weeklyRecipes.json");
const DRY = process.argv.includes("--dry");

const parsePrice = s => {
  const m = String(s || "").match(/(\d+(?:[.,]\d+)?)/);
  return m ? parseFloat(m[1].replace(",", ".")) : 0;
};
const fmtPrice = kr => `${kr} kr.`;

const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));

let movedToPantry = 0, movedToShoppable = 0, priced = 0;
const movedOutSamples = new Set();
const movedInSamples = new Set();

for (const r of data) {
  for (const ing of (r.ingredients || [])) {
    const wasPantry = !!ing.isPantry;
    // A real weekly deal (has a store + price) is what the recipe is built
    // around — never demote it to pantry even if it matches a staple keyword
    // (e.g. a Lidl "Ramenbouillon" or a Bilka olive-oil offer).
    const isRealDeal = !!ing.store && parsePrice(ing.price) > 0;
    const staple = !isRealDeal && isStaple(ing.text);

    if (staple) {
      if (!wasPantry) { movedToPantry++; movedInSamples.add(ing.text); }
      ing.isPantry = true;
      ing.store = null;
      ing.price = null;
    } else {
      if (wasPantry) { movedToShoppable++; movedOutSamples.add(ing.text); }
      ing.isPantry = false;
      // Deals keep their store + price; basics (or priceless items) get an estimate.
      if (parsePrice(ing.price) <= 0) {
        ing.price = fmtPrice(estimateBasicPrice(ing.text));
        priced++;
      }
      if (ing.store === undefined) ing.store = null;
    }
  }

  // Rebuild dealItems from the non-pantry ingredients that are actual store deals.
  r.dealItems = (r.ingredients || [])
    .filter(ing => !ing.isPantry && ing.store)
    .map(ing => ({ name: ing.text, store: ing.store, price: ing.price }));
}

console.log(`Recipes processed:      ${data.length}`);
console.log(`Moved INTO pantry:      ${movedToPantry}  (e.g. ${[...movedInSamples].slice(0, 8).join(", ")})`);
console.log(`Moved OUT of pantry:    ${movedToShoppable}  (e.g. ${[...movedOutSamples].slice(0, 10).join(", ")})`);
console.log(`Estimated prices added: ${priced}`);

if (DRY) {
  console.log("\n--dry: no file written.");
} else {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`\nWrote ${DATA_PATH}`);
}
