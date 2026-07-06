import Anthropic from '@anthropic-ai/sdk';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Load .env so VITE_CLAUDE_KEY works without manual env setup
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

// Canonical store names — must match CHAIN_ORDER in App.jsx exactly
const CANONICAL_STORES = [
  'Netto',
  'Føtex',
  'Bilka',
  'Rema 1000',
  'Coop 365',
  'SuperBrugsen / Kvickly',
  "Dagli'Brugsen / Brugsen",
  'Meny',
  'Spar',
  'Eurospar',
  'Lidl',
  'Aldi',
  'Fakta',
  'Irma',
];

// Maps xlsx sheet names → canonical store names
const SHEET_NAME_MAP = {
  'Netto':                    'Netto',
  'Føtex':                    'Føtex',
  'Bilka':                    'Bilka',
  'Rema 1000':                'Rema 1000',
  'Coop 365':                 'Coop 365',
  'Coop 365discount':         'Coop 365',
  'SuperBrugsen / Kvickly':   'SuperBrugsen / Kvickly',
  'SuperBrugsen  Kvickly':    'SuperBrugsen / Kvickly',
  "Dagli'Brugsen / Brugsen":  "Dagli'Brugsen / Brugsen",
  "Dagli'Brugsen":            "Dagli'Brugsen / Brugsen",
  'Meny':                     'Meny',
  'Spar':                     'Spar',
  'Eurospar':                 'Eurospar',
  'Lidl':                     'Lidl',
  'Aldi':                     'Aldi',
  'Fakta':                    'Fakta',
  'Irma':                     'Irma',
};

// ── 1. Read products ──────────────────────────────────────────────────────────

function readProducts() {
  if (!fs.existsSync(XLSX_PATH)) return [];

  const workbook = XLSX.readFile(XLSX_PATH);
  const products = [];

  for (const sheetName of workbook.SheetNames) {
    if (sheetName === 'Oversigt') continue;

    const store = SHEET_NAME_MAP[sheetName];
    if (!store) {
      console.warn(`  Ukendt sheet "${sheetName}" — springes over`);
      continue;
    }

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
    if (rows.length === 0) continue;

    const nameKey = Object.keys(rows[0]).find(k => !k.startsWith('__EMPTY'));
    if (!nameKey) continue;

    for (const row of rows) {
      const name   = String(row[nameKey]     || '').trim();
      const weight = String(row['__EMPTY_1'] || '').trim();
      const price  = String(row['__EMPTY_2'] || '').trim();

      if (!name || name === 'Produktnavn') continue;

      products.push({ name, weight, price, store });
    }
  }

  return products;
}

// ── 2. Build prompt ───────────────────────────────────────────────────────────

function buildPrompt(batchSize, products) {
  const list = products
    .map((p, i) => `${i + 1}. ${p.name}${p.weight ? ' ' + p.weight : ''}${p.price ? ' - ' + p.price : ''} (${p.store})`)
    .join('\n');

  return `You are a recipe writer. Here is a list of products on sale at Danish supermarkets this week — each product has a name, price and store. Generate ${batchSize} diverse recipes from any world cuisine. Each recipe must use 3-5 products from the sale list as the main ingredients — these are the deal ingredients. Recipes may also use basic pantry staples that everyone has at home like salt, pepper, olive oil, water, flour, sugar, vinegar, dried spices — these pantry ingredients do NOT need a store assigned. Every deal ingredient MUST have the exact store name and price from the list. Return clean JSON, no markdown. Each recipe: { title (Danish), description (2-3 sentences Danish), ingredients: [{ text, store, price, isPantry }], steps: [strings in Danish], time, servings, cuisine, dietary: [], difficulty, tip, dealItems: [{ name, store, price }] }

Available products:
${list}

The store name for every deal ingredient MUST be one of these exact strings (copy exactly, including special characters):
${CANONICAL_STORES.join('\n')}

Return a JSON array of exactly ${batchSize} recipes.`;
}

// ── 3. Call Claude ────────────────────────────────────────────────────────────

async function generateBatch(client, batchNum, batchSize, products) {
  const stream = client.messages.stream({
    model:      'claude-sonnet-4-6',
    max_tokens: 16000,
    messages:   [{ role: 'user', content: buildPrompt(batchSize, products) }],
  });

  const message   = await stream.finalMessage();
  const textBlock = message.content.find(b => b.type === 'text');
  if (!textBlock) throw new Error(`Batch ${batchNum}: no text block in response`);

  let text = textBlock.text.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  const recipes = JSON.parse(text);
  if (!Array.isArray(recipes)) throw new Error(`Batch ${batchNum}: response is not a JSON array`);
  return recipes;
}

// ── 4. Normalize to App format ────────────────────────────────────────────────

const CUISINE_MAP = {
  // Danish
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
  // English (Claude may return these)
  'Nordic':         '🇩🇰 Nordisk',
  'Scandinavian':   '🇩🇰 Nordisk',
  'Italian':        '🇮🇹 Italiensk',
  'French':         '🇫🇷 Fransk',
  'Asian':          '🇯🇵 Asiatisk',
  'Chinese':        '🇯🇵 Asiatisk',
  'Japanese':       '🇯🇵 Asiatisk',
  'Korean':         '🇯🇵 Asiatisk',
  'Thai':           '🇯🇵 Asiatisk',
  'Indian':         '🇮🇳 Indisk',
  'Mediterranean':  '🇬🇷 Middelhavet',
  'Middle Eastern': '🇲🇦 Mellemøstlig',
  'Mexican':        '🇲🇽 Mexicansk',
  'American':       '🇺🇸 Amerikansk',
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

function normalizeRecipe(raw, index) {
  const cuisine  = CUISINE_MAP[raw.cuisine] || '🌍 Verden';
  const emoji    = CUISINE_EMOJI[cuisine]   || '🍽️';
  const category = cuisine.replace(/^\S+\s*/, '');

  const ingredients = (raw.ingredients || []).map(ing => ({
    text:     String(ing.text  || ''),
    store:    ing.isPantry ? null : (ing.store || null),
    price:    ing.isPantry ? null : (ing.price || null),
    isPantry: !!(ing.isPantry),
  }));

  const dealItems = (raw.dealItems || []).map(di => ({
    name:  String(di.name  || ''),
    store: String(di.store || ''),
    price: String(di.price || ''),
  }));

  return {
    id:             1000 + index,
    title:          raw.title        || `Opskrift ${index + 1}`,
    emoji,
    time:           raw.time         || '30 min',
    servings_count: Number(raw.servings) || 4,
    category,
    cuisine,
    description:    raw.description  || '',
    ingredients,
    steps:          Array.isArray(raw.steps) ? raw.steps : [],
    tip:            raw.tip          || '',
    dealItems,
    dietaryFilters: Array.isArray(raw.dietary) ? raw.dietary : [],
    difficulty:     raw.difficulty   || 'mellem',
  };
}

// ── 5. Main ───────────────────────────────────────────────────────────────────

async function main() {
  const client = new Anthropic();

  const products = readProducts();
  if (products.length === 0) {
    throw new Error('Ingen produkter fundet — tjek xlsx-filen.');
  }

  const storeSet = new Set(products.map(p => p.store));
  console.log(`Fandt ${products.length} produkter fra ${storeSet.size} butikker: ${[...storeSet].join(', ')}\n`);

  const BATCHES   = 5;
  const PER_BATCH = 10;
  const rawRecipes = [];

  for (let batch = 1; batch <= BATCHES; batch++) {
    process.stdout.write(`Batch ${batch}/${BATCHES} – kalder Claude API...`);
    const recipes = await generateBatch(client, batch, PER_BATCH, products);
    rawRecipes.push(...recipes);
    console.log(` færdig — ${recipes.length} opskrifter (total: ${rawRecipes.length})`);
  }

  const normalized = rawRecipes.map((r, i) => normalizeRecipe(r, i));

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(normalized, null, 2), 'utf8');
  console.log(`\nFærdigt! ${normalized.length} opskrifter gemt til ${path.relative(ROOT, OUT_PATH)}`);
}

main().catch(err => {
  console.error('\nFejl:', err.message);
  process.exit(1);
});
