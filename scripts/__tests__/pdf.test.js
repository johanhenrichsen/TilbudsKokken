import { describe, it, expect } from "vitest";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { stitchPdf } from "../lib/pdf.js";

// 1x1 PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

describe("stitchPdf", () => {
  it("creates a PDF with one page per image", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "pdf-"));
    const out = path.join(dir, "out.pdf");
    await stitchPdf([PNG, PNG], out);
    const doc = await PDFDocument.load(readFileSync(out));
    expect(doc.getPageCount()).toBe(2);
  });
});
