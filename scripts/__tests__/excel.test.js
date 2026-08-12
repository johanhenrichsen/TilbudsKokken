import { describe, it, expect } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import ExcelJS from "exceljs";
import { writeWorkbook } from "../excel.js";

describe("writeWorkbook", () => {
  it("writes an Oversigt sheet plus one sheet per store", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "xls-"));
    const out = path.join(dir, "t.xlsx");
    await writeWorkbook({
      Netto: [{ name: "Æbler", price: 10, weight: "1 kg", category: "Frugt", labels: ["Dansk"] }],
      Bilka: [{ name: "Mælk", price: 8, weight: "1 l", category: "Mejeri", labels: [] }],
    }, out);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(out);
    expect(wb.getWorksheet("Oversigt")).toBeTruthy();
    expect(wb.getWorksheet("Netto")).toBeTruthy();
    expect(wb.getWorksheet("Bilka")).toBeTruthy();
    const oversigt = wb.getWorksheet("Oversigt");
    const values = oversigt.getColumn(1).values.map(String);
    expect(values.some(v => v.includes("Netto"))).toBe(true);
  });
});
