import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { PATHS } from "./lib/config.js";
import { stitchPdf } from "./lib/pdf.js";

export function diffCatalogs(active, state) {
  const toProcess = [];
  const unchanged = [];
  for (const [key, cat] of Object.entries(active)) {
    if (!cat) continue; // no active catalog this week
    if (state[key]?.catalogId === cat.id) unchanged.push(key);
    else toProcess.push(key);
  }
  return { toProcess, unchanged };
}

// fetchDealer downloads pages, stitches a PDF, and saves raw offers JSON.
// Returns { catalog, pdfPath, rawPath }.
export async function fetchDealer(client, dealer, catalog) {
  const pages = await client.getCatalogPages(catalog.id);
  const buffers = [];
  for (const p of pages) {
    if (!p.imageUrl) continue;
    const res = await fetch(p.imageUrl);
    buffers.push(Buffer.from(await res.arrayBuffer()));
  }
  const week = (catalog.label || catalog.id).replace(/[^\w-]+/g, "_");
  const pdfPath = path.join(PATHS.catalogs, `${dealer.key}_${week}.pdf`);
  if (buffers.length) await stitchPdf(buffers, pdfPath);

  const offers = await client.getCatalogOffers(catalog.id);
  const rawPath = path.join(PATHS.raw, `${dealer.key}.json`);
  await mkdir(path.dirname(rawPath), { recursive: true });
  await writeFile(rawPath, JSON.stringify(offers, null, 2), "utf8");

  return { catalog, pdfPath: buffers.length ? pdfPath : null, rawPath };
}
