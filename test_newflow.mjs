import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 390, height: 844 });

const mockRecipes = Array.from({ length: 10 }, (_, i) => ({
  title: ["Spaghetti Bolognese","Kylling med ris","Laks med flødesauce","Pasta med spinat","Æggekage med grønt","Kartoffelsuppe","Risotto med parmesan","Kyllingesuppe","Oksekød stir-fry","Mozzarella salat"][i],
  emoji: ["🍝","🍗","🐟","🌿","🥚","🥣","🧀","🍜","🥩","🥗"][i],
  category: ["Pasta","Ris","Fisk","Pasta","Æg","Suppe","Pasta","Suppe","Wok","Salat"][i],
  time: `${25 + i * 5} min`,
  servings_count: 4,
  servings: "4 personer",
  stores: i % 3 === 0 ? ["Rema 1000"] : i % 3 === 1 ? ["Netto"] : ["Coop 365"],
  ingredients: ["400g hakket oksekød", "250g spaghetti", "400g dåsetomater"],
  steps: ["Kog spaghetti.", "Brun kødet.", "Server."],
  tip: "Tilsæt basilikum."
}));

await page.route('**/api/recipe', route => {
  console.log('API called, bulk=', route.request().postData().includes('Generer 10'));
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ content: [{ text: JSON.stringify(mockRecipes) }] })
  });
});

await page.goto('http://localhost:5177');

// Wait for recipes to load
await page.waitForSelector('.recipe-browse-card', { timeout: 10000 });
await page.screenshot({ path: 'ss_new_1_browse.png', fullPage: true });

// Click first card
await page.locator('.recipe-browse-card').first().click();
await page.waitForSelector('.recipe-card');
await page.screenshot({ path: 'ss_new_2_detail.png', fullPage: true });

// Add ingredient to shopping list
await page.locator('.ingredient-add-btn').first().click();
await page.screenshot({ path: 'ss_new_3_shopping.png', fullPage: true });

// Go back
await page.locator('.back-btn').click();
await page.waitForSelector('.recipe-browse-card');
await page.screenshot({ path: 'ss_new_4_back.png', fullPage: false });

// Toggle a store off
await page.locator('.store-toggle').first().click();
// Wait for reload (mock fires immediately)
await page.waitForTimeout(500);
await page.screenshot({ path: 'ss_new_5_store_toggle.png', fullPage: false });

await browser.close();
console.log('Done');
