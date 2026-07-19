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

// ── Tilbudskokken mark: brick-red price tag + cream fork on warm bg ──
// Design space is 192px. The mark geometry mirrors LogoIcon.jsx / favicon.svg,
// mapped from the guide's 120-space with scale s and centre (96,96).
const RUGBROD = [27, 22, 19, 255];   // #1B1613
const PRISROD = [193, 68, 46, 255];  // #C1442E
const PAPIR   = [238, 230, 216, 255]; // #EEE6D8

const MS = 3.4;                       // mark scale
const map = (ox, oy) => [96 + (ox - 55) * MS, 96 + (oy - 40) * MS];

// Tag polygon (rightward-pointing price tag), mapped to 192 space
const TAG = [
  map(40, 27), map(58, 27), map(70, 40), map(58, 53), map(41, 41),
];
// Fork strokes as line segments [x1,y1,x2,y2]
const FORK = [
  [...map(55, 35), ...map(55, 47)], // long middle tine
  [...map(52, 35), ...map(52, 40)], // left tine
  [...map(58, 35), ...map(58, 40)], // right tine
  [...map(52, 40), ...map(58, 40)], // neck / crossbar
];
const FORK_HW = (1.6 * MS) / 2 + 1.4; // stroke half-width (a touch bolder)
const [HOLE_X, HOLE_Y] = map(46, 32);
const HOLE_R = 2.4 * MS;

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}
function distToSeg(x, y, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((x - x1) * dx + (y - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

// All coordinates are in a 192px design space, scaled to actual size.
function iconPixel(x, y, size) {
  const s = size / 192;
  const px = x / s;
  const py = y / s;

  // Full-bleed warm background (maskable-safe — content sits in centre)
  let col = RUGBROD;

  // Tag body
  if (pointInPoly(px, py, TAG)) col = PRISROD;

  // Fork (cream) sits over the tag
  for (const [x1, y1, x2, y2] of FORK) {
    if (distToSeg(px, py, x1, y1, x2, y2) <= FORK_HW) { col = PAPIR; break; }
  }

  // Tag hole punched last so nothing overpaints it
  if (Math.hypot(px - HOLE_X, py - HOLE_Y) <= HOLE_R) col = RUGBROD;

  return col;
}

for (const size of [192, 512]) {
  const png = generatePNG(size, iconPixel);
  writeFileSync(`public/icon-${size}.png`, png);
  console.log(`Generated public/icon-${size}.png (${png.length} bytes)`);
}
