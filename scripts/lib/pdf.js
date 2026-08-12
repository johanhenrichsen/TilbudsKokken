import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

export async function stitchPdf(imageBuffers, outPath) {
  const doc = await PDFDocument.create();
  for (const buf of imageBuffers) {
    const bytes = new Uint8Array(buf);
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
    const img = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    const page = doc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, await doc.save());
}
