import "dotenv/config";
import { parseArgs } from "node:util";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { DEALERS, PATHS, ANTHROPIC_MODEL } from "./lib/config.js";
import { createTjekClient } from "./lib/tjek.js";
import { loadState, saveState } from "./lib/state.js";
import { diffCatalogs, fetchDealer } from "./fetch.js";
import { toBaseRow, isFood } from "./lib/normalize.js";
import { enrichRows, makeClaudeCaller } from "./enrich.js";
import { writeWorkbook } from "./excel.js";

const { values } = parseArgs({ options: {
  dealer: { type: "string" }, "dry-run": { type: "boolean" },
  force: { type: "boolean" }, limit: { type: "string" },
} });

const log = (...a) => console.log(new Date().toISOString(), ...a);

async function main() {
  // Skip dealers without a confirmed Tjek dealerId (e.g. Aldi, Dagli'Brugsen —
  // not on the platform). Querying with an empty dealerId returns a bogus default catalog.
  const dealers = DEALERS
    .filter(d => d.dealerId)
    .filter(d => !values.dealer || d.key === values.dealer);
  const client = createTjekClient({ apiKey: process.env.TJEK_API_KEY });
  const state = await loadState(PATHS.state);

  // 1) active catalog per dealer
  const active = {};
  for (const d of dealers) {
    try { active[d.key] = await client.getActiveCatalog(d.dealerId); }
    catch (e) { log("WARN active catalog", d.key, e.message); active[d.key] = null; }
  }

  let { toProcess } = diffCatalogs(active, values.force ? {} : state);
  if (values.limit) toProcess = toProcess.slice(0, Number(values.limit));
  log("to process:", toProcess);

  const callClaude = makeClaudeCaller({ apiKey: process.env.VITE_CLAUDE_KEY, model: ANTHROPIC_MODEL });
  const rowsByStore = {};

  for (const key of toProcess) {
    const dealer = dealers.find(d => d.key === key);
    const catalog = active[key];
    try {
      if (values["dry-run"]) { log("DRY would process", key, catalog.id); continue; }
      const { rawPath } = await fetchDealer(client, dealer, catalog);
      const offers = JSON.parse(await readFile(rawPath, "utf8"));
      const base = offers.map(o => toBaseRow(o, { ...dealer, catalogId: catalog.id })).filter(isFood);
      const enriched = await enrichRows(base, { callClaude });
      rowsByStore[dealer.name] = enriched;
      state[key] = { catalogId: catalog.id, processedAt: new Date().toISOString(), count: enriched.length };
      log("processed", key, enriched.length, "rows");
    } catch (e) {
      log("ERROR dealer", key, e.message); // per-dealer isolation
    }
  }

  if (!values["dry-run"] && Object.keys(rowsByStore).length) {
    await writeWorkbook(rowsByStore, PATHS.excel);
    await saveState(PATHS.state, state);
    log("wrote", PATHS.excel);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
