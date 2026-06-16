import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 390, height: 844 });

let callCount = 0;
const recipes = [
  { title: "Kylling med ris og grøntsager", time: "35 min", servings: "4 personer", servings_count: 4,
    ingredients: ["600g kyllingefilet", "300g ris"], steps: ["Krydr kyllingen.", "Server med ris."], tip: "Tilsæt basilikum." },
  { title: "Asiatisk kyllingegryde", time: "40 min", servings: "4 personer", servings_count: 4,
    ingredients: ["600g kyllingefilet", "300g ris"], steps: ["Steg kyllingen.", "Tilsæt krydderier."], tip: "Prøv med ingefær." },
];

await page.route('**/api/recipe', route => {
  const body = JSON.parse(route.request().postData());
  const isRetry = body.messages[0].content.includes('Lav en anderledes opskrift');
  console.log(`Call #${++callCount} — retry: ${isRetry}`);
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ content: [{ text: JSON.stringify(recipes[callCount - 1] || recipes[1]) }] })
  });
});

await page.goto('http://localhost:5177');
await page.locator('text=Kyllingefilet 600g').first().click();
await page.locator('text=Ris 1kg').first().click();

// First generate
await page.locator('text=Generér opskrift').click();
await page.waitForSelector('.recipe-card');
await page.screenshot({ path: 'ss_retry_1.png', fullPage: false });

// Click retry
await page.locator('.retry-btn').click();
await page.waitForSelector('.recipe-card');
await page.screenshot({ path: 'ss_retry_2.png', fullPage: false });

await browser.close();
console.log('Done');
