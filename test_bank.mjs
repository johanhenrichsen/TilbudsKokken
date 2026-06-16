import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 390, height: 844 });

const mockAdapted = {
  title: "Spaghetti Bolognese med friske tilbudsvarer",
  time: "45 min", servings_count: 4, servings: "4 personer",
  ingredients: ["500g hakket oksekød (Rema 1000)", "250g spaghetti (Rema 1000)", "400g dåsetomater (Netto)", "1 løg (Rema 1000)"],
  steps: ["Kog spaghetti i saltet vand.", "Brun oksekød med løg.", "Tilsæt dåsetomater og simmer 20 min.", "Server."],
  tip: "Perfekt med tilbudsvarer fra denne uge."
};

await page.route('**/api/recipe', route => {
  console.log('AI called for tailoring');
  route.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ content: [{ text: JSON.stringify(mockAdapted) }] }) });
});

await page.goto('http://localhost:5177');
await page.screenshot({ path: 'ss_bank_1_browse.png', fullPage: true });

// Check recommended section exists
const recommended = await page.locator('text=Denne uges anbefalinger').count();
const allRecipes = await page.locator('text=Alle opskrifter').count();
console.log('Recommended section:', recommended > 0 ? '✓' : '✗');
console.log('All recipes section:', allRecipes > 0 ? '✓' : '✗');

const cardCount = await page.locator('.recipe-browse-card').count();
console.log('Cards shown:', cardCount);

// Click first featured card
await page.locator('.recipe-browse-card.featured').first().click();
await page.waitForSelector('.recipe-card', { timeout: 10000 });
await page.screenshot({ path: 'ss_bank_2_detail.png', fullPage: false });

// Add to shopping list
await page.locator('.ingredient-add-btn').first().click();
await page.screenshot({ path: 'ss_bank_3_shop.png', fullPage: false });

await browser.close();
console.log('Done');
