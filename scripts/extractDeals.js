#!/usr/bin/env node
/**
 * extractDeals.js — Extract food deals from a supermarket PDF tilbudsavis.
 *
 * Usage:   node scripts/extractDeals.js <path-to-pdf>
 * Env:     ANTHROPIC_API_KEY — Claude API key
 *
 * No external tools required — uses pdf-to-img (pdfjs-dist + prebuilt canvas).
 */

import { pdf } from "pdf-to-img";
import Anthropic from "@anthropic-ai/sdk";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Column definitions ───────────────────────────────────────────────────────

const COLUMNS = [
  "Varenavn",
  "Brand",
  "Variant/Type",
  "Vægt/Mængde",
  "Pris (kr.)",
  "Pris pr. kg/L",
  "Pr. enhed",
  "Oprindelse",
  "Certificeringer & Mærker",
  "Forslag til brug",
  "Kategori",
  "Noter",
];

const COL_KEYS = [
  "varenavn",
  "brand",
  "variant",
  "vaegt",
  "pris",
  "pris_pr_kgL",
  "pr_enhed",
  "oprindelse",
  "certifiseringer",
  "forslag_til_brug",
  "kategori",
  "noter",
];

// ── Category → background colour (RRGGBB, no #) ─────────────────────────────

const CATEGORY_COLORS = {
  "Kød & Fjerkræ":       "FFCDD2",  // light red
  "Fisk & Skaldyr":      "BBDEFB",  // light blue
  "Grøntsager & Frugt":  "C8E6C9",  // light green
  "Mejeri & Æg":         "FFF9C4",  // light yellow
  "Pålæg & Ost":         "FFE0B2",  // light orange
  "Brød & Bageri":       "D7CCC8",  // light brown
  "Frost":               "B3E5FC",  // lighter blue
  "Kolonial & Tørvarer": "E1BEE7",  // light purple
  "Snacks & Sødt":       "F8BBD0",  // light pink
  "Færdigretter":        "C5CAE9",  // light indigo
  "Krydderier & Saucer": "B2DFDB",  // light teal
  "Dressing & Olier":    "F0F4C3",  // light lime
  "Andet fødevare":      "EEEEEE",  // light grey
};

const CATEGORY_ORDER = Object.keys(CATEGORY_COLORS);

// Slightly darker shade for category section header rows
function darkenHex(hex) {
  const amt = 28;
  const r = Math.max(0, parseInt(hex.slice(0, 2), 16) - amt).toString(16).padStart(2, "0");
  const g = Math.max(0, parseInt(hex.slice(2, 4), 16) - amt).toString(16).padStart(2, "0");
  const b = Math.max(0, parseInt(hex.slice(4, 6), 16) - amt).toString(16).padStart(2, "0");
  return r + g + b;
}

// ── Extraction prompt ────────────────────────────────────────────────────────

const EXTRACTION_PROMPT = `\
You are analyzing a page from a Danish supermarket promotional leaflet (tilbudsavis).
Your task: extract every individual food product visible on this page.

━━ CRITICAL SPLITTING RULE ━━
If a listing shows multiple product variants at the same price — whether shown as
multiple product images side by side, text saying "eller", a stack of different products,
or a variety described in the text — create ONE SEPARATE ROW per individual variant.
Each row gets the same price and brand but a UNIQUE SPECIFIC PRODUCT NAME that includes
the variant. NEVER merge multiple distinct products into a single row.

Splitting examples:
• 8 different pasta shapes shown together = 8 rows, one per shape with its exact name
• "Nakkefilet eller røget bacon" = 2 rows: "Nakkefilet" and "Røget bacon"
• 6 Buko cheese varieties = 6 rows with specific variety names (Naturel, Hvidløg, etc.)
• 3 Jensen's sauces = 3 rows with specific sauce names
• "Vælg mellem 12 varianter" = list the most visible variants individually (min 3-4 rows)

━━ FIELDS TO EXTRACT per product ━━
Return a JSON object for each with these exact keys:
  varenavn        — exact product name including variant (be specific, not generic)
  brand           — brand/manufacturer name (e.g. "Lurpak", "Danish Crown", "Arla")
  variant         — specific variant, flavour, or type
  vaegt           — weight or quantity (e.g. "500g", "1L", "6-pak")
  pris            — price in DKK as a number (e.g. 19.95 or 20), null if unclear
  pris_pr_kgL     — price per kg or liter if shown on page (e.g. "59.90 kr./kg"), null if not shown
  pr_enhed        — unit label (e.g. "pr. stk.", "pr. pk.", "pr. liter"), null if not shown
  oprindelse      — country of origin if shown (e.g. "Danmark", "Norge"), null if not shown
  certifiseringer — comma-separated certifications visible (Dansk, Økologisk, ASC, MSC, SPOT,
                    PRIS CHOK, Nøglehullet, Rainforest Alliance, etc.), null if none
  forslag_til_brug — suggested use or serving idea shown on page, null if not shown
  kategori        — EXACTLY one of: "Kød & Fjerkræ", "Fisk & Skaldyr", "Grøntsager & Frugt",
                    "Mejeri & Æg", "Pålæg & Ost", "Brød & Bageri", "Frost",
                    "Kolonial & Tørvarer", "Snacks & Sødt", "Færdigretter",
                    "Krydderier & Saucer", "Dressing & Olier", "Andet fødevare"
  noter           — extra notes (e.g. "Spar 20 kr.", "Maks 3 pr. kunde", "Gælder til 22/6"), null if none

━━ EXCLUDE COMPLETELY (return nothing for these) ━━
• Wine, beer, spirits, cider, and all alcohol
• Soft drinks, juice, water, energy drinks, sports drinks
• Candy, chocolate, chewing gum, liquorice, sweets
• Cleaning products, dish soap, laundry products, household chemicals
• Toiletries, shampoo, toothpaste, personal care, cosmetics, diapers
• Pet food, pet supplies
• Non-food household items, batteries, light bulbs
• Clothing, shoes, textiles, toys, games, electronics
• Magazines, books, stationery

━━ OUTPUT FORMAT ━━
Return ONLY a valid JSON array — no markdown, no code fences, no explanation, no comments.
Just the raw JSON array starting with [ and ending with ].
If no eligible food products are visible on this page, return exactly: []`;

// ── Utilities ────────────────────────────────────────────────────────────────

function getWeekInfo() {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return {
    week: Math.ceil(((d - yearStart) / 86400000 + 1) / 7),
    year: d.getUTCFullYear(),
  };
}

function extractJSON(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith("[")) return JSON.parse(trimmed);
  // Extract from markdown code fence
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return JSON.parse(fenced[1].trim());
  // Find first [...] block anywhere in the text
  const match = trimmed.match(/\[[\s\S]*\]/);
  if (match) return JSON.parse(match[0]);
  throw new Error("No JSON array found in Claude response");
}

function dedupeKey(p) {
  const name  = (p.varenavn || "").toLowerCase().trim();
  const brand = (p.brand    || "").toLowerCase().trim();
  const price = String(p.pris ?? "").trim();
  const wt    = (p.vaegt   || "").toLowerCase().trim();
  return `${name}|${brand}|${price}|${wt}`;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Step 2 — PDF → page image buffers (pure JS, no external tools) ───────────

async function convertPDFToImages(pdfPath) {
  console.log("📄 Rasterising PDF pages…");
  const doc = await pdf(pdfPath, { scale: 2.8 }); // ~200 DPI equivalent
  const pages = [];
  for await (const pageBuffer of doc) {
    pages.push(pageBuffer); // each is a PNG Buffer
  }
  console.log(`   ✓ ${pages.length} page${pages.length !== 1 ? "s" : ""} extracted`);
  return pages;
}

// ── Step 3 — Analyse each page with Claude ───────────────────────────────────

async function analysePage(client, pageBuffer, pageNum, total) {
  const base64 = pageBuffer.toString("base64");

  const label = `   Page ${String(pageNum).padStart(2)}/${total}`;
  process.stdout.write(`${label}  →  `);

  const MAX_RETRIES = 2;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: "image/png", data: base64 },
              },
              {
                type: "text",
                text: EXTRACTION_PROMPT,
              },
            ],
          },
        ],
      });

      const raw      = response.content[0].text;
      const products = extractJSON(raw);
      process.stdout.write(`${products.length} products\n`);
      return products;

    } catch (err) {
      if (attempt < MAX_RETRIES) {
        process.stdout.write(`(retry ${attempt + 1})… `);
        await sleep(2000 * (attempt + 1));
      } else {
        process.stdout.write(`FAILED — ${err.message}\n`);
        return [];
      }
    }
  }
  return [];
}

// ── Step 5 — Build Excel ─────────────────────────────────────────────────────

function makeStyle(bgHex, opts = {}) {
  return {
    fill: { patternType: "solid", fgColor: { rgb: "FF" + bgHex.toUpperCase() } },
    ...(opts.bold || opts.italic
      ? { font: { bold: !!opts.bold, italic: !!opts.italic, color: { rgb: opts.fontColor || "FF111111" } } }
      : {}),
    alignment: { vertical: "center", wrapText: true },
  };
}

function buildExcel(products, outputPath) {
  // Group by category preserving CATEGORY_ORDER
  const byCategory = new Map(CATEGORY_ORDER.map(c => [c, []]));
  for (const p of products) {
    const cat = CATEGORY_ORDER.includes(p.kategori) ? p.kategori : "Andet fødevare";
    byCategory.get(cat).push(p);
  }

  const ws      = {};
  const merges  = [];
  let   rowIdx  = 0;  // 0-based row counter for sheet ref

  // ── Column header row ──────────────────────────────────────────────────────
  const headerBg = "1B5E20";  // dark green
  COLUMNS.forEach((col, ci) => {
    const ref = XLSX.utils.encode_cell({ r: rowIdx, c: ci });
    ws[ref] = {
      v: col,
      t: "s",
      s: {
        fill:      { patternType: "solid", fgColor: { rgb: "FF" + headerBg } },
        font:      { bold: true, color: { rgb: "FFFFFFFF" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border:    { bottom: { style: "medium", color: { rgb: "FF000000" } } },
      },
    };
  });
  rowIdx++;

  // ── Category sections ──────────────────────────────────────────────────────
  for (const [cat, rows] of byCategory) {
    if (rows.length === 0) continue;

    const baseBg   = CATEGORY_COLORS[cat] || "EEEEEE";
    const darkBg   = darkenHex(baseBg);
    const sectionBg = "FF" + darkBg;

    // Section header — merged across all columns
    COLUMNS.forEach((_, ci) => {
      const ref = XLSX.utils.encode_cell({ r: rowIdx, c: ci });
      ws[ref] = {
        v: ci === 0 ? `▸  ${cat.toUpperCase()}  —  ${rows.length} vare${rows.length !== 1 ? "r" : ""}` : "",
        t: "s",
        s: {
          fill:      { patternType: "solid", fgColor: { rgb: sectionBg } },
          font:      { bold: true, italic: true, color: { rgb: "FF222222" } },
          alignment: { vertical: "center" },
        },
      };
    });
    merges.push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: COLUMNS.length - 1 } });
    rowIdx++;

    // Product rows
    for (const p of rows) {
      COL_KEYS.forEach((key, ci) => {
        const raw = p[key] ?? "";
        const isPrice = key === "pris";
        const val     = isPrice && raw !== "" && raw !== null ? Number(raw) : String(raw ?? "");
        const ref     = XLSX.utils.encode_cell({ r: rowIdx, c: ci });

        const s = makeStyle(baseBg);
        if (key === "varenavn") {
          s.font = { bold: true, color: { rgb: "FF111111" } };
        }

        ws[ref] = { v: val, t: isPrice && typeof val === "number" ? "n" : "s", s };
      });
      rowIdx++;
    }
  }

  // Sheet metadata
  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rowIdx - 1, c: COLUMNS.length - 1 } });
  ws["!merges"] = merges;
  ws["!cols"] = [
    { wch: 40 },  // Varenavn
    { wch: 18 },  // Brand
    { wch: 22 },  // Variant
    { wch: 13 },  // Vægt
    { wch: 10 },  // Pris
    { wch: 15 },  // Pris pr. kg/L
    { wch: 12 },  // Pr. enhed
    { wch: 13 },  // Oprindelse
    { wch: 30 },  // Certificeringer
    { wch: 32 },  // Forslag til brug
    { wch: 22 },  // Kategori
    { wch: 32 },  // Noter
  ];
  ws["!rows"] = [{ hpx: 26 }];  // taller header row

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tilbud");

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  XLSX.writeFile(wb, outputPath, { cellStyles: true, bookType: "xlsx" });
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const pdfPath = process.argv[2];

  if (!pdfPath) {
    console.error("Usage: node scripts/extractDeals.js <path-to-pdf>");
    process.exit(1);
  }
  if (!fs.existsSync(pdfPath)) {
    console.error(`❌  File not found: ${pdfPath}`);
    process.exit(1);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("❌  ANTHROPIC_API_KEY environment variable is not set.");
    process.exit(1);
  }

  const { week, year } = getWeekInfo();
  const weekStr    = String(week).padStart(2, "0");
  const outputPath = path.join(__dirname, "output", `deals_uge_${weekStr}_${year}.xlsx`);

  console.log(`\n🛒  Spotkøkken — Deal Extractor`);
  console.log(`    PDF:    ${path.resolve(pdfPath)}`);
  console.log(`    Output: ${outputPath}\n`);

  const client = new Anthropic({ apiKey });

  // ── Step 2: PDF → image buffers ─────────────────────────────────────────
  const pages = await convertPDFToImages(pdfPath);
  const total = pages.length;

  // ── Step 3: Analyse each page ────────────────────────────────────────────
  console.log(`\n🔍  Analysing ${total} page${total !== 1 ? "s" : ""} with Claude…\n`);

  const rawProducts = [];
  for (let i = 0; i < pages.length; i++) {
    const products = await analysePage(client, pages[i], i + 1, total);
    rawProducts.push(...products);
    if (i < pages.length - 1) await sleep(300);
  }

  // ── Step 4: Deduplicate ──────────────────────────────────────────────────
  const seen   = new Set();
  const unique = [];
  for (const p of rawProducts) {
    const key = dedupeKey(p);
    if (!seen.has(key)) { seen.add(key); unique.push(p); }
  }
  const dupes = rawProducts.length - unique.length;

  // ── Step 5: Export to Excel ──────────────────────────────────────────────
  console.log(`\n📊  Writing Excel…`);
  buildExcel(unique, outputPath);

  console.log(`\n✅  Done!\n`);
  console.log(`    Pages processed:    ${total}`);
  console.log(`    Variants extracted: ${rawProducts.length}`);
  console.log(`    Duplicates removed: ${dupes}`);
  console.log(`    Unique products:    ${unique.length}`);
  console.log(`    Saved to:           ${outputPath}\n`);
}

main().catch(err => {
  console.error(`\n❌  Fatal: ${err.message}`);
  process.exit(1);
});
