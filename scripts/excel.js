import { rename, mkdir } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";

const CATEGORY_COLORS = {
  Frugt: "FFE8F5E9", Grønt: "FFE8F5E9", Kød: "FFFFEBEE", Mejeri: "FFFFF9E6",
  Fisk: "FFE3F2FD", Brød: "FFFFF3E0", Ukategoriseret: "FFF5F5F5",
};

function addStoreSheet(wb, store, rows) {
  const ws = wb.addWorksheet(store);
  ws.columns = [
    { header: "Vare", key: "name", width: 40 },
    { header: "Pris", key: "price", width: 10 },
    { header: "Mængde", key: "weight", width: 14 },
    { header: "Kategori", key: "category", width: 18 },
    { header: "Mærker", key: "labels", width: 24 },
    { header: "Serveringsforslag", key: "servingIdea", width: 30 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const r of rows) {
    const row = ws.addRow({
      name: r.name, price: r.price, weight: r.weight ?? "",
      category: r.category ?? "", labels: (r.labels ?? []).join(", "),
      servingIdea: r.servingIdea ?? "",
    });
    row.getCell("name").font = { bold: true };
    const color = CATEGORY_COLORS[r.category] ?? CATEGORY_COLORS.Ukategoriseret;
    row.eachCell(c => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } }; });
  }
  ws.addRow({});
  ws.addRow({ name: `I alt: ${rows.length} varer` }).getCell("name").font = { bold: true, italic: true };
}

export async function writeWorkbook(rowsByStore, outPath) {
  const wb = new ExcelJS.Workbook();
  const overview = wb.addWorksheet("Oversigt");
  overview.columns = [
    { header: "Butik", key: "store", width: 24 },
    { header: "Antal varer", key: "count", width: 14 },
  ];
  overview.getRow(1).font = { bold: true };

  for (const [store, rows] of Object.entries(rowsByStore)) {
    overview.addRow({ store, count: rows.length });
    addStoreSheet(wb, store, rows);
  }

  await mkdir(path.dirname(outPath), { recursive: true });
  const tmp = `${outPath}.tmp`;
  await wb.xlsx.writeFile(tmp);
  await rename(tmp, outPath); // atomic replace
}
