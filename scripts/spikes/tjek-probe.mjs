/**
 * Spike: Tjek (eTilbudsavis) API connectivity and shape probe.
 * Run: node scripts/spikes/tjek-probe.mjs
 *
 * Confirms:
 *  - Base URL, auth header, whether key is required
 *  - Dealer IDs for key chains
 *  - Catalog field names
 *  - Offer field names
 *  - Catalog pages image URL field name
 */

import "dotenv/config";

const BASE = "https://api.etilbudsavis.dk/v2";
const API_KEY = process.env.TJEK_API_KEY ?? "";

const CHAINS_OF_INTEREST = new Set([
  "netto", "føtex", "foetex", "bilka", "lidl", "rema", "meny",
  "superbrugsen", "kvickly", "coop", "dagli", "spar", "aldi",
]);

function matchesChain(name = "") {
  const lower = name.toLowerCase();
  return [...CHAINS_OF_INTEREST].some(c => lower.includes(c));
}

async function probe(label, url) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`PROBE: ${label}`);
  console.log(`URL:   ${url}`);
  const headers = { Accept: "application/json" };
  if (API_KEY) headers["X-Api-Key"] = API_KEY;
  // Always send header even if empty, per task spec
  headers["X-Api-Key"] = API_KEY;

  let res;
  try {
    res = await fetch(url, { headers });
  } catch (e) {
    console.log(`NETWORK ERROR: ${e.message}`);
    return null;
  }

  console.log(`HTTP: ${res.status} ${res.statusText}`);

  let body;
  const text = await res.text();
  try {
    body = JSON.parse(text);
  } catch {
    console.log(`BODY (not JSON, first 1500 chars):\n${text.slice(0, 1500)}`);
    return null;
  }

  const pretty = JSON.stringify(body, null, 2);
  console.log(`BODY (first 1500 chars):\n${pretty.slice(0, 1500)}`);
  if (pretty.length > 1500) console.log("... [truncated]");

  return { status: res.status, body };
}

// --- STEP 1: Dealers ---
const CHAINS_WANTED = [
  "Netto", "Føtex", "Bilka", "Lidl", "Rema 1000",
  "Meny", "SuperBrugsen", "Kvickly", "Coop 365", "Dagli'Brugsen", "Spar", "Aldi",
];

const foundDealers = {};  // key -> { id, name }

async function probeAllDealers() {
  // First try with query=Netto to understand response shape
  const r1 = await probe("GET /dealers?query=Netto", `${BASE}/dealers?query=Netto`);
  if (r1?.body) {
    const arr = Array.isArray(r1.body) ? r1.body : [];
    for (const d of arr) {
      console.log(`  Dealer: id=${d.id} name=${d.name ?? d.website ?? JSON.stringify(d).slice(0,60)}`);
    }
  }

  // Now fetch all dealers (no query filter) to get comprehensive list
  const r2 = await probe("GET /dealers (all)", `${BASE}/dealers`);
  if (r2?.body) {
    const arr = Array.isArray(r2.body) ? r2.body : [];
    console.log(`\nTotal dealers returned: ${arr.length}`);
    console.log("\nDealers matching chains of interest:");
    for (const d of arr) {
      const name = d.name ?? d.website ?? "";
      if (matchesChain(name)) {
        console.log(`  id=${d.id}  name="${name}"  website="${d.website ?? ""}"`);
      }
    }

    // Build foundDealers lookup
    for (const d of arr) {
      const name = (d.name ?? "").toLowerCase();
      if (name.includes("netto") && !name.includes("netto ")) foundDealers.netto = { id: d.id, name: d.name };
      else if (name === "netto") foundDealers.netto = { id: d.id, name: d.name };
      if (name.includes("netto")) foundDealers.netto = { id: d.id, name: d.name };
      if (name.includes("føtex") || name.includes("foetex")) foundDealers.foetex = { id: d.id, name: d.name };
      if (name.includes("bilka")) foundDealers.bilka = { id: d.id, name: d.name };
      if (name.includes("lidl")) foundDealers.lidl = { id: d.id, name: d.name };
      if (name.includes("rema")) foundDealers.rema1000 = { id: d.id, name: d.name };
      if (name === "meny" || name.includes("meny")) foundDealers.meny = { id: d.id, name: d.name };
      if (name.includes("superbrugsen")) foundDealers.superbrugsen = { id: d.id, name: d.name };
      if (name.includes("kvickly")) foundDealers.kvickly = { id: d.id, name: d.name };
      if (name.includes("coop 365") || name.includes("coop365") || name.includes("365discount")) foundDealers.coop365 = { id: d.id, name: d.name };
      if (name.includes("dagli") || name.includes("dagli'brugsen")) foundDealers.daglibrugsen = { id: d.id, name: d.name };
      if (name === "spar" || name.includes("spar")) foundDealers.spar = { id: d.id, name: d.name };
      if (name.includes("aldi")) foundDealers.aldi = { id: d.id, name: d.name };
    }

    // Also try pagination - check if there's a next page
    if (arr.length === 0) {
      // Try with limit param
      await probe("GET /dealers?limit=100", `${BASE}/dealers?limit=100`);
    }
  }

  console.log("\n--- FOUND DEALER IDs SUMMARY ---");
  for (const [key, val] of Object.entries(foundDealers)) {
    console.log(`  ${key}: id="${val.id}" name="${val.name}"`);
  }
  const wantedKeys = ["netto","foetex","bilka","lidl","rema1000","meny","superbrugsen","kvickly","coop365","daglibrugsen","spar","aldi"];
  const missing = wantedKeys.filter(k => !foundDealers[k]);
  if (missing.length) console.log(`  NOT FOUND: ${missing.join(", ")}`);
}

async function probeCatalogs() {
  // Find a dealer ID to test with - prefer Netto
  const testDealer = foundDealers.netto ?? foundDealers.lidl ?? Object.values(foundDealers)[0];
  if (!testDealer) {
    console.log("\nSKIPPING catalog probe - no dealer IDs found");
    return null;
  }
  const r = await probe(`GET /catalogs?dealer_ids=${testDealer.id} (${testDealer.name})`,
    `${BASE}/catalogs?dealer_ids=${encodeURIComponent(testDealer.id)}`);
  if (!r?.body) return null;

  const arr = Array.isArray(r.body) ? r.body : [];
  if (arr.length === 0) {
    console.log("No catalogs returned for this dealer");
    return null;
  }

  const first = arr[0];
  console.log("\n--- CATALOG FIELD NAMES ---");
  console.log("Keys:", Object.keys(first).join(", "));
  console.log("id:", first.id);
  console.log("label:", first.label);
  console.log("dealer_id:", first.dealer_id);
  console.log("run_from:", first.run_from);
  console.log("run_till:", first.run_till);

  return first.id;
}

async function probeOffers(catalogId) {
  if (!catalogId) { console.log("\nSKIPPING offer probe - no catalog ID"); return; }
  const r = await probe(`GET /offers?catalog_id=${catalogId}`, `${BASE}/offers?catalog_id=${encodeURIComponent(catalogId)}`);
  if (!r?.body) return;

  const arr = Array.isArray(r.body) ? r.body : [];
  if (arr.length === 0) { console.log("No offers returned"); return; }

  console.log("\n--- OFFER FIELD NAMES (first offer) ---");
  const first = arr[0];
  console.log("All keys:", Object.keys(first).join(", "));
  console.log("heading:", first.heading);
  console.log("pricing:", JSON.stringify(first.pricing));
  console.log("pricing.price:", first.pricing?.price);
  console.log("pricing.currency:", first.pricing?.currency);
  console.log("quantity:", JSON.stringify(first.quantity));
  console.log("quantity.size:", JSON.stringify(first.quantity?.size));
  console.log("quantity.size.from:", first.quantity?.size?.from);
  console.log("quantity.unit:", JSON.stringify(first.quantity?.unit));
  console.log("quantity.unit.symbol:", first.quantity?.unit?.symbol);
  console.log("run_from:", first.run_from);
  console.log("run_till:", first.run_till);

  console.log("\nSECOND OFFER (if any):");
  if (arr[1]) {
    const second = arr[1];
    console.log(JSON.stringify(second, null, 2).slice(0, 800));
  }
}

async function probePages(catalogId) {
  if (!catalogId) { console.log("\nSKIPPING pages probe - no catalog ID"); return; }
  const r = await probe(`GET /catalogs/${catalogId}/pages`, `${BASE}/catalogs/${encodeURIComponent(catalogId)}/pages`);
  if (!r?.body) return;

  const arr = Array.isArray(r.body) ? r.body : [];
  if (arr.length === 0) { console.log("No pages returned"); return; }

  console.log("\n--- PAGE FIELD NAMES (first page) ---");
  const first = arr[0];
  console.log("All keys:", Object.keys(first).join(", "));
  console.log("view:", first.view);
  console.log("zoom:", first.zoom);
  console.log("image:", first.image);
  // Print any field that looks like a URL
  for (const [k, v] of Object.entries(first)) {
    if (typeof v === "string" && (v.startsWith("http") || v.includes("."))) {
      console.log(`  URL-like field: ${k} = ${v.slice(0, 120)}`);
    } else if (typeof v === "object" && v !== null) {
      console.log(`  Object field: ${k} = ${JSON.stringify(v).slice(0, 200)}`);
    }
  }
}

// MAIN
console.log(`\nTjek API Probe - ${new Date().toISOString()}`);
console.log(`API Key present: ${!!API_KEY} (length: ${API_KEY.length})`);
console.log(`Base URL: ${BASE}`);

await probeAllDealers();
const catalogId = await probeCatalogs();
await probeOffers(catalogId);
await probePages(catalogId);

console.log("\n\n=== SPIKE COMPLETE ===\n");
