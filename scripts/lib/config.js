import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// dealerId values confirmed by Task 1 spike (2026-08-12) against live Tjek API.
// API name on Tjek platform shown in parentheses where it differs from our key.
// Entries with "" could not be found on the Tjek platform (see note below).
//
// NOT FOUND on Tjek API: aldi, daglibrugsen
//   – Querying /dealers?query=Aldi and /dealers?query=Dagli returned no results.
//   – Full scan of all 301 Danish dealers on the platform confirmed absence.
//   – These chains may use a different platform or have no digital catalog feed.
export const DEALERS = [
  { key: "netto",         name: "Netto",         brand: "netto",         dealerId: "9ba51"  },
  { key: "foetex",        name: "Føtex",         brand: "foetex",        dealerId: "bdf5A"  }, // API name: "føtex"
  { key: "bilka",         name: "Bilka",         brand: "bilka",         dealerId: "93f13"  },
  { key: "lidl",          name: "Lidl",          brand: "lidl",          dealerId: "71c90"  },
  { key: "rema1000",      name: "Rema 1000",     brand: "rema1000",      dealerId: "11deC"  }, // API name: "REMA 1000"
  { key: "meny",          name: "Meny",          brand: "meny",          dealerId: "267e1m" }, // API name: "MENY"
  { key: "superbrugsen",  name: "SuperBrugsen",  brand: "superbrugsen",  dealerId: "0b1e8"  },
  { key: "kvickly",       name: "Kvickly",       brand: "kvickly",       dealerId: "c1edq"  },
  { key: "coop365",       name: "Coop 365",      brand: "coop365",       dealerId: "DWZE1w" }, // API name: "365discount"
  { key: "daglibrugsen",  name: "Dagli'Brugsen", brand: "daglibrugsen",  dealerId: ""       }, // NOT on Tjek platform
  { key: "spar",          name: "Spar",          brand: "spar",          dealerId: "88ddE"  }, // API name: "SPAR"
  { key: "aldi",          name: "Aldi",          brand: "aldi",          dealerId: ""       }, // NOT on Tjek platform
];

export const PATHS = {
  root: ROOT,
  catalogs: path.join(ROOT, "catalogs"),
  raw: path.join(ROOT, "data", "raw"),
  normalized: path.join(ROOT, "data", "normalized"),
  state: path.join(ROOT, "scripts", "state", "processed.json"),
  excel: path.join(ROOT, "tilbudsaviser.xlsx"),
};

export const ANTHROPIC_MODEL = "claude-opus-4-8";
