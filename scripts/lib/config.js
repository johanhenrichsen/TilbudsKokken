import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// dealerId values are placeholders until confirmed by the Task 1 spike.
export const DEALERS = [
  { key: "netto",         name: "Netto",         brand: "netto",         dealerId: "" },
  { key: "foetex",        name: "Føtex",         brand: "foetex",        dealerId: "" },
  { key: "bilka",         name: "Bilka",         brand: "bilka",         dealerId: "" },
  { key: "lidl",          name: "Lidl",          brand: "lidl",          dealerId: "" },
  { key: "rema1000",      name: "Rema 1000",     brand: "rema1000",      dealerId: "" },
  { key: "meny",          name: "Meny",          brand: "meny",          dealerId: "" },
  { key: "superbrugsen",  name: "SuperBrugsen",  brand: "superbrugsen",  dealerId: "" },
  { key: "kvickly",       name: "Kvickly",       brand: "kvickly",       dealerId: "" },
  { key: "coop365",       name: "Coop 365",      brand: "coop365",       dealerId: "" },
  { key: "daglibrugsen",  name: "Dagli'Brugsen", brand: "daglibrugsen",  dealerId: "" },
  { key: "spar",          name: "Spar",          brand: "spar",          dealerId: "" },
  { key: "aldi",          name: "Aldi",          brand: "aldi",          dealerId: "" },
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
