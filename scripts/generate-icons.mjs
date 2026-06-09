import { deflateSync } from 'zlib';
import { writeFileSync } from 'fs';

// CRC32 for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const byte of buf) c = (c >>> 8) ^ crcTable[(c ^ byte) & 0xFF];
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(data.length);
  const crcBuf = Buffer.allocUnsafe(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcBuf]);
}

function generatePNG(size, pixelFn) {
  const rowBytes = 1 + size * 4; // filter byte + RGBA per pixel
  const raw = Buffer.alloc(size * rowBytes);
  for (let y = 0; y < size; y++) {
    raw[y * rowBytes] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelFn(x, y, size);
      const off = y * rowBytes + 1 + x * 4;
      raw[off] = r; raw[off + 1] = g; raw[off + 2] = b; raw[off + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', deflateSync(raw)),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

// All coordinates are in a 192px design space, scaled to actual size.
function iconPixel(x, y, size) {
  const s = size / 192;
  const px = x / s;
  const py = y / s;

  // Rounded rectangle background (radius 36)
  const bgR = 36;
  let inBg = true;
  if ((px < bgR || px > 192 - bgR) && (py < bgR || py > 192 - bgR)) {
    const cx = px < bgR ? bgR : 192 - bgR;
    const cy = py < bgR ? bgR : 192 - bgR;
    inBg = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2) <= bgR;
  }
  if (!inBg) return [0, 0, 0, 0]; // transparent outside rounded rect

  // Fork shape (white), centered at x=96 in 192-space
  // 3 tines: each 10px wide, 52px tall, 7px gap between
  // Neck: full fork width, 12px tall
  // Handle: 18px wide, 76px tall
  const inTine1  = px >= 74  && px <= 84  && py >= 28 && py <= 80;
  const inTine2  = px >= 91  && px <= 101 && py >= 28 && py <= 80;
  const inTine3  = px >= 108 && px <= 118 && py >= 28 && py <= 80;
  const inNeck   = px >= 74  && px <= 118 && py >= 78 && py <= 90;
  const inHandle = px >= 87  && px <= 105 && py >= 90 && py <= 166;

  // Rounded bottom cap of handle
  const inHandleCap = Math.sqrt((px - 96) ** 2 + (py - 166) ** 2) <= 9;

  if (inTine1 || inTine2 || inTine3 || inNeck || inHandle || inHandleCap) {
    return [255, 255, 255, 255]; // white
  }
  return [26, 46, 26, 255]; // #1a2e1a green
}

for (const size of [192, 512]) {
  const png = generatePNG(size, iconPixel);
  writeFileSync(`public/icon-${size}.png`, png);
  console.log(`Generated public/icon-${size}.png (${png.length} bytes)`);
}
