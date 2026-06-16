import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 390, height: 844 });

const mockRecipe = {
  title: "Kylling med ris og grøntsager",
  time: "35 min",
  servings: "4 personer",
  servings_count: 4,
  ingredients: ["600g kyllingefilet", "300g ris", "400g dåsetomater", "2 fed hvidløg"],
  steps: ["Krydr kyllingen med salt og peber.", "Svits løg og hvidløg.", "Tilsæt tomater og simmer.", "Server med ris."],
  tip: "Tilsæt lidt frisk basilikum ved servering."
};

// App expects Claude API response format: { content: [{ text: "..." }] }
const mockApiResponse = {
  content: [{ text: JSON.stringify(mockRecipe) }]
};

await page.route('**/api/recipe', route => {
  console.log('Route intercepted:', route.request().url());
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockApiResponse)
  });
});

await page.goto('http://localhost:5177');

// Select items
await page.locator('text=Kyllingefilet 600g').first().click();
await page.locator('text=Ris 1kg').first().click();

// Generate recipe
await page.locator('text=Generér opskrift').click();
await page.waitForSelector('.recipe-card', { timeout: 10000 });
await page.screenshot({ path: 'ss_t1_recipe.png', fullPage: true });

// Click save
await page.locator('.save-btn').click();
await page.screenshot({ path: 'ss_t2_saved_btn.png', fullPage: true });

// Scroll to bottom
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(300);
await page.screenshot({ path: 'ss_t3_saved_list.png', fullPage: true });

// Expand saved recipe
await page.locator('.saved-recipe-header').first().click();
await page.waitForTimeout(200);
await page.screenshot({ path: 'ss_t4_expanded.png', fullPage: true });

// Delete saved recipe
await page.locator('.saved-recipe-delete').first().click();
await page.waitForTimeout(200);
await page.screenshot({ path: 'ss_t5_deleted.png', fullPage: true });

await browser.close();
console.log('All tests passed');
