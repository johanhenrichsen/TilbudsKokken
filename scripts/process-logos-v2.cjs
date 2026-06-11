// Processes TilbudsKokken logos from original source files.
// Uses flood-fill from image edges to identify background (white connected
// to the border) vs interior whites (chef hat, text fill — enclosed by dark
// outlines). Background → transparent. Interior whites + dark outlines → cream.
// Orange/red vegetable elements → preserved.

const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');

// ── CRC32 ────────────────────────────────────────────────────────────────────
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c;
}
function crc32(buf) {
  let v = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) v = crcTable[(v ^ buf[i]) & 0xFF] ^ (v >>> 8);
  return (v ^ 0xFFFFFFFF) >>> 0;
}
function makeChunk(type, data) {
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const out = Buffer.alloc(4 + td.length + 4);
  out.writeUInt32BE(data.length, 0);
  td.copy(out, 4);
  out.writeUInt32BE(crc32(td), 4 + td.length);
  return out;
}

// ── PNG decode ───────────────────────────────────────────────────────────────
function unfilterRow(ft, row, prev, ch, w) {
  const out = Buffer.alloc(w * ch);
  for (let i = 0; i < w * ch; i++) {
    const x = row[i];
    const a = i >= ch ? out[i - ch] : 0;
    const b = prev ? prev[i] : 0;
    const c = (i >= ch && prev) ? prev[i - ch] : 0;
    switch (ft) {
      case 0: out[i] = x; break;
      case 1: out[i] = (x + a) & 0xff; break;
      case 2: out[i] = (x + b) & 0xff; break;
      case 3: out[i] = (x + Math.floor((a + b) / 2)) & 0xff; break;
      case 4: {
        const p = a+b-c, pa=Math.abs(p-a), pb=Math.abs(p-b), pc=Math.abs(p-c);
        out[i] = (x + (pa<=pb&&pa<=pc ? a : pb<=pc ? b : c)) & 0xff; break;
      }
    }
  }
  return out;
}

function decodePNG(pngBuf) {
  let pos = 8, width, height, channels = 4;
  const idatChunks = [];
  while (pos < pngBuf.length - 4) {
    const len = pngBuf.readUInt32BE(pos);
    const type = pngBuf.slice(pos+4, pos+8).toString('ascii');
    if (type === 'IHDR') {
      width  = pngBuf.readUInt32BE(pos + 8);
      height = pngBuf.readUInt32BE(pos + 12);
      const ct = pngBuf[pos + 17];
      channels = (ct === 2) ? 3 : 4;
    } else if (type === 'IDAT') {
      idatChunks.push(pngBuf.slice(pos+8, pos+8+len));
    } else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const raw  = zlib.inflateSync(Buffer.concat(idatChunks));
  const stride = 1 + width * channels;
  const px = Buffer.alloc(width * height * 4, 255);
  let prev = null;
  for (let y = 0; y < height; y++) {
    const ft  = raw[y * stride];
    const row = raw.slice(y * stride + 1, y * stride + 1 + width * channels);
    const r   = unfilterRow(ft, row, prev, channels, width);
    for (let x = 0; x < width; x++) {
      const s = x * channels, d = (y * width + x) * 4;
      px[d]=r[s]; px[d+1]=r[s+1]; px[d+2]=r[s+2];
      px[d+3] = channels === 4 ? r[s+3] : 255;
    }
    prev = r;
  }
  return { width, height, px };
}

// ── PNG encode (RGBA, filter type 0) ─────────────────────────────────────────
function encodePNG(width, height, px) {
  const ss = 1 + width * 4;
  const raw = Buffer.alloc(height * ss);
  for (let y = 0; y < height; y++) {
    raw[y * ss] = 0;
    px.copy(raw, y * ss + 1, y * width * 4, (y+1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8]=8; ihdr[9]=6;
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', zlib.deflateSync(raw, { level: 6 })),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Colour helpers ────────────────────────────────────────────────────────────
// Is this pixel "near-white" enough to potentially be background or interior-white?
function isNearWhite(R, G, B) { return R > 210 && G > 200 && B > 185; }

// Is it "background-like" for flood-fill seeding (very close to pure white)?
function isBgCandidate(R, G, B) { return R > 230 && G > 225 && B > 215; }

// Dark green / near-black outlines → will become cream
function isDark(R, G, B) { return Math.max(R, G, B) < 120; }

// Orange/amber (carrot, price-tag highlight) → keep
function isOrange(R, G, B) { return R > 160 && G > 60 && G < 180 && B < 100 && R > G + 40; }

// Red / tomato → keep
function isRed(R, G, B) { return R > 160 && G < 100 && B < 100 && R > G + 80; }

// ── Main processing ───────────────────────────────────────────────────────────
const CREAM = { r: 0xf0, g: 0xea, b: 0xd6 }; // #f0ead6

function processSVG(srcPath, dstPath) {
  console.log(`\nReading:  ${srcPath}`);
  const svg    = fs.readFileSync(srcPath, 'utf8');
  const b64    = svg.match(/base64,([A-Za-z0-9+/=\r\n]+)/);
  if (!b64) { console.log('  No PNG found – skipping'); return; }

  const pngBuf = Buffer.from(b64[1].replace(/[\r\n]/g, ''), 'base64');
  const { width, height, px } = decodePNG(pngBuf);
  console.log(`  ${width}×${height} pixels`);

  const total = width * height;

  // ── Step 1: flood-fill background from all four edges ──────────────────────
  const isBg   = new Uint8Array(total);   // 1 = confirmed background
  const queue  = new Int32Array(total);
  let qHead = 0, qTail = 0;

  function seed(idx) {
    if (isBg[idx]) return;
    const o = idx * 4;
    if (isBgCandidate(px[o], px[o+1], px[o+2])) {
      isBg[idx] = 1;
      queue[qTail++] = idx;
    }
  }
  for (let x = 0; x < width;  x++) { seed(x);                       seed((height-1)*width + x); }
  for (let y = 0; y < height; y++) { seed(y*width);                  seed(y*width + width-1); }

  while (qHead < qTail) {
    const idx = queue[qHead++];
    const x = idx % width, y = (idx / width) | 0;
    if (x > 0)        seed(idx - 1);
    if (x < width-1)  seed(idx + 1);
    if (y > 0)        seed(idx - width);
    if (y < height-1) seed(idx + width);
  }

  const bgCount = isBg.reduce((s, v) => s + v, 0);
  console.log(`  Background pixels (flood-fill): ${bgCount}`);

  // ── Step 2: recolour ────────────────────────────────────────────────────────
  const out = Buffer.alloc(total * 4, 0);
  let transparent = 0, cream = 0, kept = 0;

  for (let i = 0; i < total; i++) {
    const o = i * 4;
    const R = px[o], G = px[o+1], B = px[o+2], A = px[o+3];

    if (isBg[i] || A < 10) {
      // Background or already transparent → fully transparent
      transparent++;
      // out stays 0,0,0,0
    } else if (isOrange(R,G,B) || isRed(R,G,B)) {
      // Vegetable / accent colours → preserve exactly
      kept++;
      out[o]=R; out[o+1]=G; out[o+2]=B; out[o+3]=255;
    } else if (isDark(R,G,B) || isNearWhite(R,G,B)) {
      // Dark outlines (hat, text strokes) OR interior whites (hat fill,
      // text fill) that are enclosed by outlines → cream
      cream++;
      out[o]=CREAM.r; out[o+1]=CREAM.g; out[o+2]=CREAM.b; out[o+3]=255;
    } else {
      // Mid-tones (medium greens for lettuce, etc.) → preserve
      kept++;
      out[o]=R; out[o+1]=G; out[o+2]=B; out[o+3]=255;
    }
  }

  console.log(`  → ${transparent} transparent, ${cream} cream, ${kept} preserved`);

  // ── Step 3: encode & embed ──────────────────────────────────────────────────
  const newPNG = encodePNG(width, height, out);
  const newB64 = newPNG.toString('base64');

  // Rebuild SVG: swap PNG data, strip any leftover filter plumbing
  let newSvg = svg.replace(/base64,[A-Za-z0-9+/=\r\n]+/, 'base64,' + newB64);
  newSvg = newSvg.replace(/\s*<defs>[\s\S]*?<\/defs>/, '');
  newSvg = newSvg.replace(/ filter="url\(#[^"]+\)"/, '');

  fs.mkdirSync(path.dirname(dstPath), { recursive: true });
  fs.writeFileSync(dstPath, newSvg, 'utf8');
  console.log(`  Written: ${dstPath}  (PNG ${pngBuf.length} → ${newPNG.length} bytes)`);
}

processSVG(
  'C:/Users/Johan/Documents/Tilbudskokken/tilbudskokken_logo_icon_only.svg',
  'src/assets/logo-icon.svg'
);
processSVG(
  'C:/Users/Johan/Documents/Tilbudskokken/tilbudskokken_logo_text.svg',
  'src/assets/logo-text.svg'
);
console.log('\nDone.');
