// One-off analysis: which recipes does Pexels struggle to match?
// Reuses the app's real buildPhotoQuery (extracted from App.jsx, no copy) and
// hits Pexels live, replicating the server's alt-text scoring, to find the
// "best available match" score per recipe. Low score / weak query = niche =
// good candidate for an AI-generated photo.
//
// Run: node scripts/analyze_niche_photos.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// --- Load PEXELS_API_KEY from .env (no dependency on dotenv) ---
const env = fs.readFileSync(path.join(root, '.env'), 'utf8');
const KEY = (env.match(/^PEXELS_API_KEY=(.+)$/m) || [])[1]?.trim();
if (!KEY) throw new Error('PEXELS_API_KEY not found in .env');

// --- Extract buildPhotoQuery + tables from App.jsx so logic can't drift ---
const app = fs.readFileSync(path.join(root, 'src', 'App.jsx'), 'utf8');
const start = app.indexOf('const PHOTO_PHRASES = [');
const retIdx = app.indexOf('return `${q} food`.trim();');
const end = app.indexOf('}', app.indexOf('.trim();', retIdx)) + 1;
if (start < 0 || retIdx < 0 || end <= 0) throw new Error('Could not locate query logic in App.jsx');
const src = app.slice(start, end);
const buildPhotoQuery = new Function(`${src}\nreturn buildPhotoQuery;`)();

// --- Load recipes ---
const raw = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'weeklyRecipes.json'), 'utf8'));
const recipes = Array.isArray(raw) ? raw : (raw.recipes || Object.values(raw).find(Array.isArray));

// --- Mirror of the server's scoring (api/pexels.js) ---
const NON_FOOD = ['person','people','woman','women','man ',' men ','girl','boy','child','kid','portrait','wedding','model','fashion','office','desk','laptop','computer','phone','building','cityscape','street','car ','landscape','mountain','beach','flower','animal','dog','cat','sky','forest','field','farm','grocery','supermarket','shopping','menu','text','signage','poster'];
const FOOD_HINTS = ['food','dish','meal','plate','bowl','cuisine','delicious','tasty','cooked','homemade','fresh','served','sauce','grilled','baked','roasted','fried','dinner','lunch','breakfast','restaurant','kitchen','ingredient','cooking','salad','soup','dessert','snack'];

function topScore(query, photos) {
  const tokens = query.toLowerCase().replace(/\bfood\b/g, ' ').split(/\s+/).filter(w => w.length > 2);
  let best = -Infinity;
  photos.forEach((p, i) => {
    const alt = ` ${(p.alt || '').toLowerCase().trim()} `;
    const posBias = i * 0.05;
    let score;
    if (alt.trim() === '') score = -0.5 - posBias;
    else if (NON_FOOD.some(w => alt.includes(w)) && !FOOD_HINTS.some(w => alt.includes(w))) score = -100 - posBias;
    else {
      score = 0;
      tokens.forEach((tok, ti) => { if (alt.includes(tok)) score += Math.max(1, 4 - ti); });
      if (FOOD_HINTS.some(w => alt.includes(w))) score += 1;
      score -= posBias;
    }
    if (score > best) best = score;
  });
  return best === -Infinity ? -100 : best;
}

// Count how many mapped keywords the query carries (weak query = few keywords).
function keywordCount(query) {
  return query.toLowerCase().replace(/\bfood\b/g, ' ').trim().split(/\s+/).filter(Boolean).length;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

const results = [];
for (const r of recipes) {
  const query = buildPhotoQuery(r);
  let photos = [];
  try {
    const resp = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=24&orientation=landscape`, { headers: { Authorization: KEY } });
    if (resp.ok) photos = (await resp.json())?.photos || [];
  } catch { /* leave photos empty */ }
  const score = topScore(query, photos);
  const kw = keywordCount(query);
  const safetyNet = / food dish food$| food dish$/.test(query) || query === 'food dish food';
  results.push({ id: r.id, title: r.title, category: r.category, query, score, kw, n: photos.length, safetyNet });
  await sleep(120); // stay well under Pexels rate limits
}

// --- Classify niche: weak best-match, safety-net query, or too few results ---
const niche = results.filter(x => x.score < 4 || x.kw <= 1 || x.safetyNet || x.n < 6);
niche.sort((a, b) => a.score - b.score);

console.log(`\nAnalyzed ${results.length} recipes.`);
console.log(`Niche (weak Pexels match) : ${niche.length}`);
console.log(`Well-covered by Pexels    : ${results.length - niche.length}\n`);
console.log('--- Niche recipes (worst match first) ---');
console.log('score  kw  n   id     category        title  ->  query');
for (const x of niche) {
  console.log(`${x.score.toFixed(1).padStart(5)} ${String(x.kw).padStart(3)} ${String(x.n).padStart(3)}  ${String(x.id).padEnd(6)} ${(x.category||'').padEnd(14)} ${x.title.slice(0,42)}  ->  ${x.query}`);
}

fs.writeFileSync(path.join(root, 'scripts', 'niche_photos.json'), JSON.stringify({ generatedAt: new Date().toISOString(), total: results.length, niche: niche.map(x => ({ id: x.id, title: x.title, category: x.category, query: x.query, score: x.score })) }, null, 2));
console.log(`\nWrote scripts/niche_photos.json (${niche.length} recipes).`);
