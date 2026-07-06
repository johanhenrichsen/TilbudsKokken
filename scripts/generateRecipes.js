import Anthropic from '@anthropic-ai/sdk';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Load .env so VITE_CLAUDE_KEY is available without an external env setup
try {
  const envFile = path.join(ROOT, '.env');
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
      const m = line.match(/^\s*([^#=\s][^=]*?)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
} catch {}
if (!process.env.ANTHROPIC_API_KEY && process.env.VITE_CLAUDE_KEY) {
  process.env.ANTHROPIC_API_KEY = process.env.VITE_CLAUDE_KEY;
}

const XLSX_PATH = path.join(ROOT, 'src', 'data', 'tilbudsaviser.xlsx');
const OUT_PATH  = path.join(ROOT, 'src', 'data', 'weeklyRecipes.json');

// ── 1. Read products from xlsx ────────────────────────────────────────────────
// Returns { products: string[], productMap: Map<string, {name, price, store}> }
// Each product string is formatted as "Produktnavn 120 g 10 kr. (Butik)"
// so Claude can include it verbatim in tilbudsvarer and we can look it up.

function readProductsFromXlsx() {
  if (!fs.existsSync(XLSX_PATH)) return { products: [], productMap: new Map() };

  const workbook = XLSX.readFile(XLSX_PATH);
  const products = [];
  const productMap = new Map();

  for (const sheetName of workbook.SheetNames) {
    if (sheetName === 'Oversigt') continue;
    const store = sheetName;

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
    if (rows.length === 0) continue;

    // Row 1 of each sheet is the store title (A1), so sheet_to_json uses it as
    // the key for column A. Find that key (the only non-__EMPTY key).
    const nameKey = Object.keys(rows[0]).find(k => !k.startsWith('__EMPTY'));
    if (!nameKey) continue;

    for (const row of rows) {
      const name = String(row[nameKey] || '').trim();
      // First data row is the column-header row ("Produktnavn", etc.) — skip it.
      if (!name || name === 'Produktnavn') continue;

      const weight = String(row['__EMPTY_1'] || '').trim();
      const price  = String(row['__EMPTY_2'] || '').trim();

      // Build the label that will appear in the prompt and that Claude should
      // echo back verbatim in tilbudsvarer.
      const parts = [name, weight, price].filter(Boolean);
      const label = `${parts.join(' ')} (${store})`;

      if (productMap.has(label)) continue; // deduplicate
      products.push(label);
      productMap.set(label, { name, price, store });
    }
  }

  return { products, productMap };
}

// ── 2. Fallback: fetch live deals from Rema 1000 public API ──────────────────

const REMA_BASE = 'https://cphapp.rema1000.dk/api/v3';
const FOOD_SLUGS = new Set([
  'frugt-gront', 'kod-fisk-fjerkrae', 'kol', 'frost', 'mejeri', 'ost-mv', 'kolonial',
]);

async function fetchJSON(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Spotkokken/1.0', Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function fetchProductsFromRema() {
  console.log('Henter aktuelle tilbud fra Rema 1000…');
  const deptsData = await fetchJSON(`${REMA_BASE}/departments`);
  const foodDepts = (deptsData.data || []).filter(d => FOOD_SLUGS.has(d.slug));

  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  const productArrays = await Promise.all(
    foodDepts.map(dept =>
      fetchJSON(`${REMA_BASE}/departments/${dept.id}/products`)
        .then(d => d.data || [])
        .catch(() => [])
    )
  );

  const products = [];
  const productMap = new Map();

  for (const items of productArrays) {
    for (const product of items) {
      const prices = product.prices || [];
      const activeIdx = prices.findIndex(p => {
        const start = p.starting_at ? Date.parse(p.starting_at) : 0;
        const end   = p.ending_at   ? Date.parse(p.ending_at)   : Infinity;
        return start <= now && end >= now;
      });
      if (activeIdx === -1) continue;

      const active = prices[activeIdx];
      if (active.is_campaign) {
        // include
      } else if (active.is_advertised) {
        const end = active.ending_at ? Date.parse(active.ending_at) : Infinity;
        if (end - now > THIRTY_DAYS) continue;
      } else {
        continue;
      }

      const name = [product.name, product.underline].filter(Boolean).join(' – ');
      if (!name) continue;

      const price = `${active.price} kr.`;
      const store = 'Rema 1000';
      const label = `${name} ${price} (${store})`;

      if (productMap.has(label)) continue;
      products.push(label);
      productMap.set(label, { name, price, store });
    }
  }

  return { products, productMap };
}

// ── 3. Build Claude prompt ────────────────────────────────────────────────────

function buildPrompt(batchNum, batchSize, productList) {
  const start = (batchNum - 1) * batchSize + 1;
  const end   = batchNum * batchSize;
  return `Du er en kreativ opskriftsforfatter. Her er en liste over varer, der er på tilbud i danske supermarkeder denne uge:

${productList.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Generer opskrifter nr. ${start}–${end} (${batchSize} opskrifter) fra et udvalg af verdens køkkener, der bruger disse tilbudsvarer som primære ingredienser. Hver opskrift skal bruge mindst 2–3 af tilbudsvarerne som hovedingredienser. Gør opskrifterne varierede på tværs af verdenskøkkener, tilberedningstid og sværhedsgrad – tænk italiensk, asiatisk, mellemøstlig, nordisk, mexicansk, fransk og mere. Skriv alle opskrifttitler og instruktioner på dansk.

For hver opskrift returner følgende JSON-felter:
- titel: opskriftens navn på dansk
- beskrivelse: 2–3 appetitlige sætninger på dansk
- ingredienser: array af strenge med præcise mængder, f.eks. ["500 g hakket oksekød", "2 fed hvidløg"]
- fremgangsmåde: array med mindst 5 detaljerede trin på dansk
- tilberedningstid: streng, f.eks. "45 min"
- antal_personer: tal
- køkken: ét af disse: "Nordisk", "Italiensk", "Fransk", "Asiatisk", "Indisk", "Middelhavet", "Mellemøstlig", "Mexicansk", "Amerikansk"
- kostfiltre: array – inkluder kun de relevante af: "vegetar", "veganer", "glutenfri", "mælkefri"
- sværhedsgrad: "let", "mellem" eller "svær"
- kokkens_tip: ét nyttigt tip på dansk
- tilbudsvarer: array af de varer fra listen, der bruges i opskriften — kopier dem præcis som de fremgår af listen ovenfor, f.eks. ["Hakket oksekød 400 g 37,95 kr. (Netto)", "Kartofler 1 kg 12 kr. (Bilka)"]

Returner KUN et rent JSON-array med ${batchSize} opskrifter – ingen markdown, ingen forklaring.`;
}

// ── 4. Normalize to App.jsx format ───────────────────────────────────────────

const CUISINE_MAP = {
  'Nordisk':      '🇩🇰 Nordisk',
  'Dansk':        '🇩🇰 Nordisk',
  'Italiensk':    '🇮🇹 Italiensk',
  'Fransk':       '🇫🇷 Fransk',
  'Asiatisk':     '🇯🇵 Asiatisk',
  'Kinesisk':     '🇯🇵 Asiatisk',
  'Japansk':      '🇯🇵 Asiatisk',
  'Indisk':       '🇮🇳 Indisk',
  'Middelhavet':  '🇬🇷 Middelhavet',
  'Mellemøstlig': '🇲🇦 Mellemøstlig',
  'Mexicansk':    '🇲🇽 Mexicansk',
  'Amerikansk':   '🇺🇸 Amerikansk',
};

const CUISINE_EMOJI = {
  '🇩🇰 Nordisk':      '🌿',
  '🇮🇹 Italiensk':    '🍝',
  '🇫🇷 Fransk':       '🥐',
  '🇯🇵 Asiatisk':     '🥢',
  '🇮🇳 Indisk':       '🍛',
  '🇬🇷 Middelhavet':  '🫒',
  '🇲🇦 Mellemøstlig': '🧆',
  '🇲🇽 Mexicansk':    '🌮',
  '🇺🇸 Amerikansk':   '🍔',
};

function parseDealItemFallback(label) {
  // Fallback parser when Claude returns a string not in our productMap.
  // Format: "Product name weight price (Store)"
  const storeMatch = label.match(/\(([^)]+)\)\s*$/);
  const store = storeMatch ? storeMatch[1].trim() : 'Tilbud';
  const withoutStore = label.replace(/\s*\([^)]*\)\s*$/, '').trim();
  const priceMatch = withoutStore.match(/(\d[\d.,]*\s*kr\.?)\s*$/i);
  const price = priceMatch ? priceMatch[1].trim() : '';
  const name  = priceMatch
    ? withoutStore.slice(0, withoutStore.lastIndexOf(priceMatch[1])).trim()
    : withoutStore;
  return { name, price, store };
}

function normalizeRecipe(raw, index, productMap) {
  const rawCuisine = raw.køkken || '';
  const cuisine  = CUISINE_MAP[rawCuisine] || '🌍 Verden';
  const emoji    = CUISINE_EMOJI[cuisine] || '🍽️';
  const category = cuisine.replace(/^\S+\s*/, '');

  // Map tilbudsvarer labels → { name, price, store }
  const dealItems = (raw.tilbudsvarer || []).map(label => {
    const hit = productMap.get(label.trim());
    return hit ?? parseDealItemFallback(label);
  });

  const ingredients = (raw.ingredienser || []).map(text => ({
    text: String(text),
    dealItem: null,
  }));

  return {
    id:             1000 + index,
    title:          raw.titel || `Opskrift ${index + 1}`,
    emoji,
    time:           raw.tilberedningstid || '30 min',
    servings_count: Number(raw.antal_personer) || 4,
    category,
    cuisine,
    description:    raw.beskrivelse || '',
    ingredients,
    steps:          Array.isArray(raw.fremgangsmåde) ? raw.fremgangsmåde : [],
    tip:            raw.kokkens_tip || '',
    dealItems,
    dietaryFilters: Array.isArray(raw.kostfiltre) ? raw.kostfiltre : [],
    difficulty:     raw.sværhedsgrad || 'mellem',
  };
}

// ── 5. Fuzzy ingredient → store matcher ──────────────────────────────────────

function stripLeadingAmount(text) {
  return text
    .replace(/^\s*\d+[\d.,/]*\s*(?:g|kg|l|dl|cl|ml|stk\.?|pk\.?|pose|bundt|fed|tsk\.?|spsk\.?|dåse|bakke|potte|karton|skiver?|nip|kvist|håndfuld)\.?\s*/i, '')
    .replace(/^\s*\d+\s*(?:×|x)\s*/i, '')
    .trim();
}

function matchIngredientToProduct(ingText, productList) {
  const cleaned = stripLeadingAmount(ingText).toLowerCase();
  if (cleaned.length < 3) return null;
  for (const product of productList) {
    const nameLower = product.name.toLowerCase();
    if (nameLower.includes(cleaned) || cleaned.includes(nameLower)) {
      return product;
    }
  }
  return null;
}

// ── 6. Call Claude and parse batch ───────────────────────────────────────────

async function generateBatch(client, batchNum, batchSize, productList) {
  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    messages: [{ role: 'user', content: buildPrompt(batchNum, batchSize, productList) }],
  });

  const message = await stream.finalMessage();
  const textBlock = message.content.find(b => b.type === 'text');
  if (!textBlock) {
    const types = message.content.map(b => b.type).join(', ');
    throw new Error(`Batch ${batchNum}: intet tekstsvar fra API (bloktyper: ${types})`);
  }

  let text = textBlock.text.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  const recipes = JSON.parse(text);
  if (!Array.isArray(recipes)) throw new Error(`Batch ${batchNum}: svar er ikke et JSON-array`);
  return recipes;
}

// ── 7. Main ──────────────────────────────────────────────────────────────────

async function main() {
  const client = new Anthropic();

  let { products, productMap } = readProductsFromXlsx();

  if (products.length === 0) {
    console.log('Xlsx-filen er tom — henter live-tilbud fra Rema 1000.\n');
    ({ products, productMap } = await fetchProductsFromRema());
  }

  if (products.length === 0) {
    throw new Error('Ingen tilbudsvarer fundet. Udfyld xlsx-filen eller kontrollér API-forbindelsen.');
  }

  console.log(`Fandt ${products.length} tilbudsvarer fra ${new Set([...productMap.values()].map(p => p.store)).size} butikker. Genererer opskrifter...\n`);

  const BATCHES   = 5;
  const PER_BATCH = 10;
  const rawRecipes = [];

  for (let batch = 1; batch <= BATCHES; batch++) {
    process.stdout.write(`Batch ${batch}/${BATCHES} – kalder Claude API...`);
    const recipes = await generateBatch(client, batch, PER_BATCH, products);
    rawRecipes.push(...recipes);
    console.log(` faerdig — ${recipes.length} opskrifter (total: ${rawRecipes.length})`);
  }

  const normalized = rawRecipes.map((r, i) => normalizeRecipe(r, i, productMap));

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(normalized, null, 2), 'utf8');
  console.log(`\nFaerdigt! ${normalized.length} opskrifter gemt til ${path.relative(ROOT, OUT_PATH)}`);

  // ── Annotate ingredients with store and price ─────────────────────────────
  console.log('\nMatcher ingredienser mod tilbudsvarer...');
  const productList = [...productMap.values()];
  let matchCount = 0;

  for (const recipe of normalized) {
    for (const ing of recipe.ingredients) {
      const match = matchIngredientToProduct(ing.text, productList);
      if (match) {
        ing.store = match.store;
        ing.price = match.price;
        matchCount++;
      }
    }
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(normalized, null, 2), 'utf8');
  console.log(`${matchCount} ingredienser matchet mod tilbudsvarer. Opdateret JSON gemt.`);
}

main().catch(err => {
  console.error('\nFejl:', err.message);
  process.exit(1);
});
