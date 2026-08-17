/**
 * Generates ~80 new recipes across all 10 chains and appends them to
 * src/data/weeklyRecipes.json.
 *
 * Usage:
 *   node scripts/generate-recipes.mjs
 *
 * Requires VITE_CLAUDE_KEY in .env (read via --env-file flag or dotenv).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "../src/data/weeklyRecipes.json");

// Load env manually (no dotenv dependency required — Node 20+ has --env-file)
function loadEnv() {
  const envPath = path.join(__dirname, "../.env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}
loadEnv();

const API_KEY = process.env.VITE_CLAUDE_KEY;
if (!API_KEY) { console.error("VITE_CLAUDE_KEY not set"); process.exit(1); }

// Typical deal packages per chain — 8 deal batches per chain, 2-3 items each.
// Items represent realistic weekly tilbudsavis offers.
const CHAIN_DEALS = {
  "Netto": [
    [{ name: "Hakket oksekød 400g", price: "22 kr." }, { name: "Løg 1 kg", price: "6 kr." }],
    [{ name: "Kyllingefilet 600g", price: "28 kr." }, { name: "Peberfrugt 3-pak", price: "12 kr." }],
    [{ name: "Svinekam u. ben 1 kg", price: "39 kr." }, { name: "Kartofler 2 kg", price: "10 kr." }],
    [{ name: "Laksesteak 400g", price: "35 kr." }, { name: "Citron 4-pak", price: "8 kr." }],
    [{ name: "Karbonader 400g", price: "19 kr." }, { name: "Pasta 500g", price: "6 kr." }],
    [{ name: "Kyllingelår 1 kg", price: "24 kr." }, { name: "Dåsetomater 400g", price: "5 kr." }],
    [{ name: "Oksesteg 800g", price: "49 kr." }, { name: "Gulerødder 1 kg", price: "7 kr." }],
    [{ name: "Rejer, pillede 200g", price: "25 kr." }, { name: "Spaghetti 500g", price: "5 kr." }],
  ],
  "Rema 1000": [
    [{ name: "Hakket oksekød 500g", price: "24 kr." }, { name: "Gulerødder 1 kg", price: "7 kr." }],
    [{ name: "Kyllingefilet 600g", price: "26 kr." }, { name: "Broccoli 500g", price: "10 kr." }],
    [{ name: "Laks filet 400g", price: "39 kr." }, { name: "Spinat frisk 200g", price: "12 kr." }],
    [{ name: "Svinekød i tern 500g", price: "28 kr." }, { name: "Champignoner 500g", price: "14 kr." }],
    [{ name: "Farsbrød 600g", price: "32 kr." }, { name: "Kartofler 2,5 kg", price: "12 kr." }],
    [{ name: "Kyllingelår 1 kg", price: "29 kr." }, { name: "Tomater 500g", price: "10 kr." }],
    [{ name: "Oksemørbrad 400g", price: "55 kr." }, { name: "Fløde 38% 0,5L", price: "18 kr." }],
    [{ name: "Torsk filet 400g", price: "35 kr." }, { name: "Ærter frosne 750g", price: "9 kr." }],
  ],
  "Bilka": [
    [{ name: "Oksehøjreb 1 kg", price: "79 kr." }, { name: "Smør 200g", price: "14 kr." }],
    [{ name: "Hel kylling 1,5 kg", price: "45 kr." }, { name: "Citroner 4-pak", price: "9 kr." }],
    [{ name: "Svinekotelet 800g", price: "42 kr." }, { name: "Æbler 1 kg", price: "15 kr." }],
    [{ name: "Havtaske 500g", price: "59 kr." }, { name: "Kokosmælk 400ml", price: "9 kr." }],
    [{ name: "Lammekølle 1,2 kg", price: "89 kr." }, { name: "Rosmarin frisk", price: "10 kr." }],
    [{ name: "Kyllingebryst 800g", price: "44 kr." }, { name: "Parmesanost 100g", price: "22 kr." }],
    [{ name: "Hakket svinekød 500g", price: "22 kr." }, { name: "Tortilla wraps 8-pak", price: "12 kr." }],
    [{ name: "Reje cocktail 200g", price: "29 kr." }, { name: "Avocado 2-pak", price: "16 kr." }],
  ],
  "Føtex": [
    [{ name: "Laks filet 400g", price: "42 kr." }, { name: "Fennikel 2-pak", price: "14 kr." }],
    [{ name: "Kyllingebryst 600g", price: "39 kr." }, { name: "Mozzarella 125g", price: "14 kr." }],
    [{ name: "Oksefars 400g", price: "26 kr." }, { name: "Tomatpuré 70g", price: "6 kr." }],
    [{ name: "Torskeryg 500g", price: "45 kr." }, { name: "Ærter frosne 750g", price: "10 kr." }],
    [{ name: "Entrecote 300g", price: "55 kr." }, { name: "Smør 200g", price: "16 kr." }],
    [{ name: "Kyllingelår 1 kg", price: "32 kr." }, { name: "Kokosmælk 400ml", price: "10 kr." }],
    [{ name: "Tunfisk i vand 3-pak", price: "18 kr." }, { name: "Pasta 500g", price: "7 kr." }],
    [{ name: "Svinekam med svær 1 kg", price: "49 kr." }, { name: "Rødkål 1 kg", price: "12 kr." }],
  ],
  "Coop 365": [
    [{ name: "Hakket oksekød 500g", price: "26 kr." }, { name: "Løg 1 kg", price: "7 kr." }],
    [{ name: "Kyllingefilet 600g", price: "32 kr." }, { name: "Peberfrugt mix 3-pak", price: "15 kr." }],
    [{ name: "Svinekød strimler 400g", price: "28 kr." }, { name: "Nudler 500g", price: "8 kr." }],
    [{ name: "Laks filet 400g", price: "40 kr." }, { name: "Dild frisk", price: "8 kr." }],
    [{ name: "Kyllingelår 1 kg", price: "28 kr." }, { name: "Dåsetomater 400g", price: "6 kr." }],
    [{ name: "Farsbrød 500g", price: "30 kr." }, { name: "Kartofler 2 kg", price: "10 kr." }],
    [{ name: "Pasta penne 500g", price: "7 kr." }, { name: "Ricotta 250g", price: "16 kr." }],
    [{ name: "Krebsehaler 200g", price: "22 kr." }, { name: "Ris 1 kg", price: "10 kr." }],
  ],
  "SuperBrugsen": [
    [{ name: "Oksesteg 800g", price: "55 kr." }, { name: "Rodfrugter mix 750g", price: "18 kr." }],
    [{ name: "Laks hel side 800g", price: "89 kr." }, { name: "Fløde 38% 0,5L", price: "19 kr." }],
    [{ name: "Kylling hel 1,5 kg", price: "48 kr." }, { name: "Timian frisk", price: "9 kr." }],
    [{ name: "Hakket svinekød 500g", price: "24 kr." }, { name: "Tortillas 8-pak", price: "13 kr." }],
    [{ name: "Kyllingefilet 600g", price: "36 kr." }, { name: "Parmesanost 100g", price: "24 kr." }],
    [{ name: "Torsk filet 400g", price: "42 kr." }, { name: "Rødkål 750g", price: "14 kr." }],
    [{ name: "Svinekotelet 800g", price: "44 kr." }, { name: "Champignoner 500g", price: "16 kr." }],
    [{ name: "Oksefars 400g", price: "28 kr." }, { name: "Courgetter 2-pak", price: "12 kr." }],
  ],
  "Dagli'Brugsen / Brugsen": [
    [{ name: "Kyllingefilet 400g", price: "30 kr." }, { name: "Grøntsagsblanding frossen 750g", price: "14 kr." }],
    [{ name: "Hakket oksekød 400g", price: "26 kr." }, { name: "Lasagneplader 250g", price: "10 kr." }],
    [{ name: "Laksesteak 350g", price: "36 kr." }, { name: "Kartofler 1,5 kg", price: "10 kr." }],
    [{ name: "Svinekød i tern 400g", price: "28 kr." }, { name: "Bouillon terning 6-pak", price: "9 kr." }],
    [{ name: "Kyllingelår 800g", price: "26 kr." }, { name: "Peberfrugt 2-pak", price: "12 kr." }],
    [{ name: "Oksemørbrad 300g", price: "52 kr." }, { name: "Smør 200g", price: "15 kr." }],
    [{ name: "Torsk filet 300g", price: "34 kr." }, { name: "Ærter frosne 500g", price: "9 kr." }],
    [{ name: "Hakket svinekød 500g", price: "22 kr." }, { name: "Dåsetomater 2-pak", price: "12 kr." }],
  ],
  "Meny": [
    [{ name: "Hummerhaler 200g", price: "89 kr." }, { name: "Fløde 38% 0,5L", price: "20 kr." }],
    [{ name: "Entrecote dry aged 300g", price: "75 kr." }, { name: "Smør 200g", price: "18 kr." }],
    [{ name: "Laks vild Alaska 500g", price: "65 kr." }, { name: "Asparges grønne 500g", price: "28 kr." }],
    [{ name: "Kylling fransk 1,4 kg", price: "68 kr." }, { name: "Estragon frisk", price: "14 kr." }],
    [{ name: "Kæmpe rejer 300g", price: "69 kr." }, { name: "Kokosmælk 400ml", price: "12 kr." }],
    [{ name: "Svinekam iberiansk 600g", price: "59 kr." }, { name: "Æbler sæson 1 kg", price: "18 kr." }],
    [{ name: "Torsk skrei 500g", price: "55 kr." }, { name: "Spinat baby 200g", price: "22 kr." }],
    [{ name: "Oksehøjreb 1 kg", price: "99 kr." }, { name: "Rødvin til madlavning 75 cl", price: "35 kr." }],
  ],
  "Spar": [
    [{ name: "Kyllingefilet 500g", price: "30 kr." }, { name: "Ris basmati 1 kg", price: "16 kr." }],
    [{ name: "Hakket oksekød 500g", price: "28 kr." }, { name: "Tomater 500g", price: "10 kr." }],
    [{ name: "Laks filet 350g", price: "38 kr." }, { name: "Citron 4-pak", price: "10 kr." }],
    [{ name: "Svinekam u. ben 800g", price: "44 kr." }, { name: "Kartofler 2 kg", price: "12 kr." }],
    [{ name: "Kyllingelår 1 kg", price: "30 kr." }, { name: "Kokosmælk 400ml", price: "10 kr." }],
    [{ name: "Hakket svinekød 400g", price: "22 kr." }, { name: "Pasta 500g", price: "7 kr." }],
    [{ name: "Torsk filet 350g", price: "36 kr." }, { name: "Broccoli 500g", price: "11 kr." }],
    [{ name: "Oksefars 500g", price: "30 kr." }, { name: "Champignoner 400g", price: "14 kr." }],
  ],
  "Lidl": [
    [{ name: "Kyllingelår marineret 800g", price: "26 kr." }, { name: "Majskolber 2-pak", price: "10 kr." }],
    [{ name: "Svinekød grillsteg 1 kg", price: "39 kr." }, { name: "Grøntsagsblanding asiatisk 750g", price: "15 kr." }],
    [{ name: "Laks Atlantisk 500g", price: "38 kr." }, { name: "Dild frisk", price: "7 kr." }],
    [{ name: "Oksefars 500g", price: "27 kr." }, { name: "Fuldkornspasta 500g", price: "8 kr." }],
    [{ name: "Kyllingebryst 2-pak 500g", price: "30 kr." }, { name: "Pesto grøn 190g", price: "14 kr." }],
    [{ name: "Rejer pillede 250g", price: "28 kr." }, { name: "Nudler risnudler 250g", price: "12 kr." }],
    [{ name: "Kalkun hakket 500g", price: "28 kr." }, { name: "Squash 2-pak", price: "10 kr." }],
    [{ name: "Torsk filet frossen 400g", price: "32 kr." }, { name: "Kartoffelmos pose 100g", price: "8 kr." }],
  ],
};

const CUISINE_MAP = {
  "🇩🇰 Nordisk": ["Nordisk", "Dansk"],
  "🇮🇹 Italiensk": ["Italiensk", "Pasta", "Risotto"],
  "🇯🇵 Asiatisk": ["Asiatisk", "Wok", "Nudler"],
  "🇮🇳 Indisk": ["Indisk", "Curry"],
  "🇬🇷 Middelhavet": ["Middelhavet", "Græksk"],
  "🇲🇦 Mellemøstlig": ["Mellemøstlig"],
  "🇲🇽 Mexicansk": ["Mexicansk", "Tacos"],
  "🇺🇸 Amerikansk": ["Amerikansk", "Burger"],
};

async function callClaude(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.content?.[0]?.text || "").trim();
}

async function generateForChain(chain, dealBatch, nextId) {
  const dealLines = dealBatch.map(d => `- ${d.name} (${d.price})`).join("\n");

  const prompt = `Du er en opskriftsgenerator for en dansk madapp. Generer PRÆCIS 1 lækker dansk opskrift der bruger disse tilbudsvarer som HOVEDELEMENTER.

Tilbudsvarer fra ${chain}:
${dealLines}

Returner KUN gyldig JSON (ingen markdown, ingen forklaring) med denne præcise struktur:
{
  "title": "...",
  "emoji": "🍗",
  "time": "30 minutter",
  "servings_count": 4,
  "category": "Kylling",
  "cuisine": "🇩🇰 Nordisk",
  "description": "2-3 sætninger der beskriver retten appetitligt på dansk.",
  "ingredients": [
    { "text": "Kyllingefilet 600g", "store": "${chain}", "price": "XX kr.", "isPantry": false },
    { "text": "1 løg", "store": null, "price": "4 kr.", "isPantry": false },
    { "text": "2 fed hvidløg", "store": null, "price": "4 kr.", "isPantry": false },
    { "text": "Salt og peber", "store": null, "price": null, "isPantry": true }
  ],
  "dealItems": [
    { "name": "Kyllingefilet 600g", "store": "${chain}", "price": "XX kr." }
  ],
  "steps": [
    "Konkret trin 1.",
    "Konkret trin 2."
  ],
  "tip": "En kort praktisk tip."
}

REGLER:
- cuisine skal være en af: 🇩🇰 Nordisk, 🇮🇹 Italiensk, 🇯🇵 Asiatisk, 🇮🇳 Indisk, 🇬🇷 Middelhavet, 🇲🇦 Mellemøstlig, 🇲🇽 Mexicansk, 🇺🇸 Amerikansk
- KUN ægte basisvarer må have isPantry:true — dvs. salt, peber, madolie/olivenolie, vand, sukker, mel, eddike, bouillon/fond og TØRREDE krydderier/urter. Disse har altid store:null og price:null.
- ALT andet du skal købe (løg, hvidløg, citron, smør, fløde, mælk, æg, kartofler, gulerødder, ingefær, friske urter, dåsetomater, honning, sojasauce osv.) har isPantry:false.
  - Er varen på tilbudslisten ovenfor: sæt store til butikken og price til tilbudsprisen, og medtag den i dealItems.
  - Ellers (helt almindelig ikke-tilbudsvare): sæt store:null og price til et realistisk skøn i hele kroner (fx løg 4 kr., hvidløg 4 kr., citron 4 kr., smør 8 kr., fløde 12 kr., æg 6 kr., dåsetomater 6 kr.). Medtag den IKKE i dealItems.
- dealItems indeholder KUN tilbudsvarerne (dem med en store)
- ingredients inkluderer ALLE varer (tilbud + basisvarer uden tilbud + pantry)
- Minimum 5 konkrete steps
- Opskriften skal passe til en dansk familiemiddag`;

  const raw = await callClaude(prompt);
  const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

  let recipe;
  try {
    recipe = JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error(`No JSON found for ${chain}: ${text.slice(0, 200)}`);
    recipe = JSON.parse(m[0]);
  }

  recipe.id = nextId;
  return recipe;
}

async function main() {
  const existing = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const existingIds = new Set(existing.map(r => r.id));
  let nextId = Math.max(...existing.map(r => r.id)) + 1;

  const newRecipes = [];
  const chains = Object.keys(CHAIN_DEALS);

  for (const chain of chains) {
    const batches = CHAIN_DEALS[chain];
    console.log(`\n── ${chain} (${batches.length} recipes)`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      process.stdout.write(`  [${i + 1}/${batches.length}] ${batch[0].name}... `);

      try {
        const recipe = await generateForChain(chain, batch, nextId);
        newRecipes.push(recipe);
        nextId++;
        console.log(`✓ ${recipe.title}`);
      } catch (err) {
        console.error(`✗ ${err.message}`);
      }

      // Avoid rate limits
      if (i < batches.length - 1) await new Promise(r => setTimeout(r, 800));
    }
  }

  const merged = [...existing, ...newRecipes];
  fs.writeFileSync(DATA_PATH, JSON.stringify(merged, null, 2), "utf8");
  console.log(`\n✅ Done. Added ${newRecipes.length} recipes. Total: ${merged.length}`);
}

main().catch(err => { console.error(err); process.exit(1); });
