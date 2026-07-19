import Anthropic from '@anthropic-ai/sdk';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Load .env
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

const XLSX_PATH    = path.join(ROOT, 'src', 'data', 'tilbudsaviser.xlsx');
const OUT_PATH     = path.join(ROOT, 'src', 'data', 'weeklyRecipes.json');
const ARCHIVE_PATH = path.join(__dirname, 'output', 'archived_recipes.json');

// Chains to target for even distribution
const PRIMARY_CHAINS = ['Rema 1000', 'Netto', 'Coop 365'];
const TARGET_PER_CHAIN = 10;
// Minimum deal items a recipe must use to count as a strong match
const MIN_DEAL_ITEMS = 3;

// Canonical store names — must match CHAIN_ORDER in App.jsx exactly
const CANONICAL_STORES = [
  'Netto', 'Føtex', 'Bilka', 'Rema 1000', 'Coop 365',
  'SuperBrugsen / Kvickly', "Dagli'Brugsen / Brugsen",
  'Meny', 'Spar', 'Lidl',
];

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
  'Lidl':                     'Lidl',
};

// ── 1. Read products ──────────────────────────────────────────────────────────

function readProducts() {
  if (!fs.existsSync(XLSX_PATH)) return [];
  const workbook = XLSX.readFile(XLSX_PATH);
  const products = [];

  for (const sheetName of workbook.SheetNames) {
    if (sheetName === 'Oversigt') continue;
    const store = SHEET_NAME_MAP[sheetName];
    if (!store) { console.warn(`  Ukendt sheet "${sheetName}" — springes over`); continue; }

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

// ── 2. Prompts ────────────────────────────────────────────────────────────────

function formatProductList(products) {
  return products
    .map((p, i) => `${i + 1}. ${p.name}${p.weight ? ' ' + p.weight : ''}${p.price ? ' - ' + p.price : ''} (${p.store})`)
    .join('\n');
}

const BASE_INSTRUCTIONS = `You are a recipe writer. Generate diverse recipes from any world cuisine. Each recipe must use ${MIN_DEAL_ITEMS}-5 products from the sale list as the main deal ingredients. Recipes may also use basic pantry staples (salt, pepper, olive oil, flour, sugar, dried spices etc.) — mark these isPantry:true with no store/price. Every deal ingredient MUST have the exact store name and price from the list. Return clean JSON array only, no markdown. Each recipe: { title (Danish), description (2-3 sentences Danish), ingredients: [{ text, store, price, isPantry }], steps: [strings in Danish], time, servings, cuisine, dietary: [], difficulty, tip, dealItems: [{ name, store, price }] }

The store name in every deal ingredient MUST be one of these exact strings:
${CANONICAL_STORES.join('\n')}`;

// Chain-focused prompt: Claude is asked to use ONLY products from a single chain
function buildChainPrompt(count, chain, chainProducts) {
  return `${BASE_INSTRUCTIONS}

Generate exactly ${count} recipes that each use ${MIN_DEAL_ITEMS}-5 products from ${chain}'s sale list below. All deal ingredients must come from ${chain} — do not mix in products from other stores.

${chain} products on sale this week:
${formatProductList(chainProducts)}

Return a JSON array of exactly ${count} recipes.`;
}

// Multi-chain prompt: encourages using products from at least two primary chains
function buildMultiChainPrompt(count, primaryProducts) {
  return `${BASE_INSTRUCTIONS}

Generate exactly ${count} recipes where each recipe uses deal ingredients from AT LEAST two different stores. Mix products from different chains in a single recipe where it makes culinary sense.

Products on sale this week:
${formatProductList(primaryProducts)}

Return a JSON array of exactly ${count} recipes.`;
}

// Fallback prompt for the remaining/other chains (non-primary)
function buildOtherPrompt(count, products) {
  return `${BASE_INSTRUCTIONS}

Generate exactly ${count} diverse recipes from any world cuisine using the sale products below.

Available products:
${formatProductList(products)}

Return a JSON array of exactly ${count} recipes.`;
}

// ── 3. Call Claude ────────────────────────────────────────────────────────────

async function generateBatch(client, label, count, prompt) {
  if (count <= 0) return [];
  process.stdout.write(`  ${label}: kalder Claude API (${count} opskrifter)...`);

  const stream = client.messages.stream({
    model:      'claude-sonnet-4-6',
    max_tokens: 16000,
    messages:   [{ role: 'user', content: prompt }],
  });

  const message   = await stream.finalMessage();
  const textBlock = message.content.find(b => b.type === 'text');
  if (!textBlock) throw new Error(`${label}: no text block in response`);

  let text = textBlock.text.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  const recipes = JSON.parse(text);
  if (!Array.isArray(recipes)) throw new Error(`${label}: response is not a JSON array`);
  console.log(` færdig — ${recipes.length} opskrifter`);
  return recipes;
}

// ── 4. Normalize ──────────────────────────────────────────────────────────────

const CUISINE_MAP = {
  'Nordisk': '🇩🇰 Nordisk', 'Dansk': '🇩🇰 Nordisk',
  'Italiensk': '🇮🇹 Italiensk', 'Fransk': '🇫🇷 Fransk',
  'Asiatisk': '🇯🇵 Asiatisk', 'Kinesisk': '🇯🇵 Asiatisk',
  'Japansk': '🇯🇵 Asiatisk', 'Indisk': '🇮🇳 Indisk',
  'Middelhavet': '🇬🇷 Middelhavet', 'Mellemøstlig': '🇲🇦 Mellemøstlig',
  'Mexicansk': '🇲🇽 Mexicansk', 'Amerikansk': '🇺🇸 Amerikansk',
  'Nordic': '🇩🇰 Nordisk', 'Scandinavian': '🇩🇰 Nordisk',
  'Italian': '🇮🇹 Italiensk', 'French': '🇫🇷 Fransk',
  'Asian': '🇯🇵 Asiatisk', 'Chinese': '🇯🇵 Asiatisk',
  'Japanese': '🇯🇵 Asiatisk', 'Korean': '🇯🇵 Asiatisk',
  'Thai': '🇯🇵 Asiatisk', 'Indian': '🇮🇳 Indisk',
  'Mediterranean': '🇬🇷 Middelhavet', 'Middle Eastern': '🇲🇦 Mellemøstlig',
  'Mexican': '🇲🇽 Mexicansk', 'American': '🇺🇸 Amerikansk',
};

const CUISINE_EMOJI = {
  '🇩🇰 Nordisk': '🌿', '🇮🇹 Italiensk': '🍝', '🇫🇷 Fransk': '🥐',
  '🇯🇵 Asiatisk': '🥢', '🇮🇳 Indisk': '🍛', '🇬🇷 Middelhavet': '🫒',
  '🇲🇦 Mellemøstlig': '🧆', '🇲🇽 Mexicansk': '🌮', '🇺🇸 Amerikansk': '🍔',
};

function normalizeRecipe(raw, index) {
  const cuisine  = CUISINE_MAP[raw.cuisine] || '🌍 Verden';
  const emoji    = CUISINE_EMOJI[cuisine]   || '🍽️';
  const category = cuisine.replace(/^\S+\s*/, '');

  return {
    id:             1000 + index,
    title:          raw.title        || `Opskrift ${index + 1}`,
    emoji,
    time:           raw.time         || '30 min',
    servings_count: Number(raw.servings) || 4,
    category,
    cuisine,
    description:    raw.description  || '',
    ingredients: (raw.ingredients || []).map(ing => ({
      text:     String(ing.text  || ''),
      store:    ing.isPantry ? null : (ing.store || null),
      price:    ing.isPantry ? null : (ing.price || null),
      isPantry: !!(ing.isPantry),
    })),
    steps:          Array.isArray(raw.steps) ? raw.steps : [],
    tip:            raw.tip          || '',
    dealItems: (raw.dealItems || []).map(di => ({
      name:  String(di.name  || ''),
      store: String(di.store || ''),
      price: String(di.price || ''),
    })),
    dietaryFilters: Array.isArray(raw.dietary) ? raw.dietary : [],
    difficulty:     raw.difficulty   || 'mellem',
  };
}

// ── 5. Chain analysis helpers ─────────────────────────────────────────────────

// Returns which PRIMARY_CHAINS a recipe draws deal ingredients from
function recipePrimaryChains(r) {
  const stores = new Set((r.dealItems || []).map(d => d.store));
  return PRIMARY_CHAINS.filter(c => stores.has(c));
}

// Returns number of deal items from a specific chain
function chainDealScore(r, chain) {
  return (r.dealItems || []).filter(d => d.store === chain).length;
}

function printChainSummary(recipes, label = 'Opsummering') {
  console.log(`\n${'─'.repeat(55)}`);
  console.log(`${label} — per kæde (mål: ${TARGET_PER_CHAIN} per kæde)`);
  console.log('─'.repeat(55));

  for (const chain of PRIMARY_CHAINS) {
    const singles = recipes.filter(r => {
      const chains = recipePrimaryChains(r);
      return chains.length === 1 && chains[0] === chain;
    });
    const multis = recipes.filter(r => {
      const chains = recipePrimaryChains(r);
      return chains.length > 1 && chains.includes(chain);
    });
    const total = singles.length + multis.length;
    const met = total >= TARGET_PER_CHAIN ? '✓' : `✗ (mangler ${TARGET_PER_CHAIN - total})`;
    console.log(`  ${chain.padEnd(12)} ${String(total).padStart(2)}/${TARGET_PER_CHAIN}  ${met}  (single: ${singles.length}, multi: ${multis.length})`);
  }

  const nonPrimary = recipes.filter(r => recipePrimaryChains(r).length === 0);
  console.log(`\n  Andre butikker: ${nonPrimary.length} opskrifter`);
  console.log(`  Total: ${recipes.length} opskrifter`);
  console.log('─'.repeat(55));
}

// ── 6. Rebalance mode ─────────────────────────────────────────────────────────

function rebalance() {
  if (!fs.existsSync(OUT_PATH)) {
    console.error('weeklyRecipes.json ikke fundet — kør genereringen først.');
    process.exit(1);
  }

  const all = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'));
  console.log(`\nLæser ${all.length} eksisterende opskrifter...\n`);

  // Print current state
  printChainSummary(all, 'Nuværende fordeling');

  // Separate recipes by category
  const multiChain = all.filter(r => recipePrimaryChains(r).length > 1);
  const otherRecipes = all.filter(r => recipePrimaryChains(r).length === 0);

  // Per chain: collect single-chain recipes sorted by deal score (desc)
  const singleByChain = {};
  for (const chain of PRIMARY_CHAINS) {
    singleByChain[chain] = all
      .filter(r => {
        const chains = recipePrimaryChains(r);
        return chains.length === 1 && chains[0] === chain;
      })
      .sort((a, b) => chainDealScore(b, chain) - chainDealScore(a, chain));
  }

  // Multi-chain coverage per primary chain
  const multiCount = {};
  for (const chain of PRIMARY_CHAINS) {
    multiCount[chain] = multiChain.filter(r => recipePrimaryChains(r).includes(chain)).length;
  }

  // Decide how many single-chain recipes to keep per chain
  const kept = [...otherRecipes, ...multiChain];
  const archived = [];

  for (const chain of PRIMARY_CHAINS) {
    const neededSingle = Math.max(0, TARGET_PER_CHAIN - multiCount[chain]);
    const singles = singleByChain[chain];
    const toKeep = singles.slice(0, neededSingle);
    const toArchive = singles.slice(neededSingle);

    kept.push(...toKeep);
    archived.push(...toArchive);

    if (toArchive.length > 0) {
      console.log(`  ${chain}: beholder ${toKeep.length} single-chain, arkiverer ${toArchive.length}`);
    } else if (singles.length < neededSingle) {
      console.log(`  ${chain}: kun ${singles.length}/${neededSingle} single-chain opskrifter — mål ikke nået`);
    } else {
      console.log(`  ${chain}: ${toKeep.length} single-chain opskrifter beholdt`);
    }
  }

  // Re-assign IDs
  kept.forEach((r, i) => { r.id = 1000 + i; });

  // Save archived recipes
  if (archived.length > 0) {
    fs.mkdirSync(path.dirname(ARCHIVE_PATH), { recursive: true });
    let existing = [];
    if (fs.existsSync(ARCHIVE_PATH)) {
      try { existing = JSON.parse(fs.readFileSync(ARCHIVE_PATH, 'utf8')); } catch {}
    }
    fs.writeFileSync(ARCHIVE_PATH, JSON.stringify([...existing, ...archived], null, 2), 'utf8');
    console.log(`\n  ${archived.length} arkiverede opskrifter gemt til scripts/output/archived_recipes.json`);
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(kept, null, 2), 'utf8');
  printChainSummary(kept, 'Efter rebalancering');
}

// ── 7. Main (generation) ──────────────────────────────────────────────────────

async function main() {
  const client = new Anthropic();

  const products = readProducts();
  if (products.length === 0) throw new Error('Ingen produkter fundet — tjek xlsx-filen.');

  // Group by store
  const byStore = {};
  for (const p of products) {
    if (!byStore[p.store]) byStore[p.store] = [];
    byStore[p.store].push(p);
  }

  const storeSet = new Set(products.map(p => p.store));
  console.log(`Fandt ${products.length} produkter fra ${storeSet.size} butikker: ${[...storeSet].join(', ')}\n`);

  const allRaw = [];

  // ── Per-chain generation for primary chains ──────────────────────────────
  console.log(`Genererer opskrifter per kæde (mål: ${TARGET_PER_CHAIN} per kæde):\n`);

  for (const chain of PRIMARY_CHAINS) {
    const chainProducts = byStore[chain] || [];

    if (chainProducts.length === 0) {
      console.log(`  ${chain}: ingen produkter i xlsx denne uge — springer over`);
      continue;
    }

    // How many recipes can we feasibly generate with good matches?
    // Assume each recipe uses ~3-4 deal items; allow some overlap
    const maxFeasible = Math.min(TARGET_PER_CHAIN, Math.ceil(chainProducts.length / 2));

    if (chainProducts.length < MIN_DEAL_ITEMS) {
      console.log(`  ${chain}: kun ${chainProducts.length} produkt(er) — for få til gode matches (behøver min. ${MIN_DEAL_ITEMS})`);
      continue;
    }

    const count = maxFeasible;
    const prompt = buildChainPrompt(count, chain, chainProducts);
    const recipes = await generateBatch(client, chain, count, prompt);
    allRaw.push(...recipes);

    if (count < TARGET_PER_CHAIN) {
      console.log(`  ⚠️  ${chain}: mål ikke nået — ${count}/${TARGET_PER_CHAIN} (kun ${chainProducts.length} produkter i xlsx)`);
    }
  }

  // ── Multi-chain recipes using all primary chain products ─────────────────
  const primaryProducts = PRIMARY_CHAINS.flatMap(c => byStore[c] || []);
  if (primaryProducts.length >= MIN_DEAL_ITEMS * 2) {
    console.log('');
    const multiCount = 5;
    const prompt = buildMultiChainPrompt(multiCount, primaryProducts);
    const recipes = await generateBatch(client, 'Multi-kæde', multiCount, prompt);
    allRaw.push(...recipes);
  }

  // ── Remaining non-primary chains (Bilka, Lidl, etc.) ────────────────────
  const otherProducts = products.filter(p => !PRIMARY_CHAINS.includes(p.store));
  if (otherProducts.length >= MIN_DEAL_ITEMS) {
    console.log('');
    const otherCount = 10;
    const prompt = buildOtherPrompt(otherCount, otherProducts);
    const recipes = await generateBatch(client, 'Andre butikker', otherCount, prompt);
    allRaw.push(...recipes);
  }

  // ── Normalize and save ────────────────────────────────────────────────────
  const normalized = allRaw.map((r, i) => normalizeRecipe(r, i));

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(normalized, null, 2), 'utf8');

  printChainSummary(normalized, 'Genereringsresultat');
  console.log(`\nFærdigt! ${normalized.length} opskrifter gemt til ${path.relative(ROOT, OUT_PATH)}\n`);
}

// ── Entry point ───────────────────────────────────────────────────────────────

const mode = process.argv[2];
if (mode === '--rebalance') {
  rebalance();
} else {
  main().catch(err => {
    console.error('\nFejl:', err.message);
    process.exit(1);
  });
}
