// Removes white backgrounds from logo PNGs embedded in SVG files.
// For each pixel: alpha = 255 - min(R,G,B). White pixels → transparent.
// Edge pixels get interpolated alpha with recovered foreground color.
const fs = require('fs');
const zlib = require('zlib');

// CRC32 for PNG chunk checksums
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c;
}
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function makeChunk(type, data) {
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const out = Buffer.alloc(4 + td.length + 4);
  out.writeUInt32BE(data.length, 0);
  td.copy(out, 4);
  out.writeUInt32BE(crc32(td), 4 + td.length);
  return out;
}

function unfilterRow(filterType, row, prev, ch, w) {
  const out = Buffer.alloc(w * ch);
  for (let i = 0; i < w * ch; i++) {
    const x = row[i];
    const a = i >= ch ? out[i - ch] : 0;
    const b = prev ? prev[i] : 0;
    const c = (i >= ch && prev) ? prev[i - ch] : 0;
    switch (filterType) {
      case 0: out[i] = x; break;
      case 1: out[i] = (x + a) & 0xff; break;
      case 2: out[i] = (x + b) & 0xff; break;
      case 3: out[i] = (x + Math.floor((a + b) / 2)) & 0xff; break;
      case 4: {
        const p = a + b - c;
        const pa = Math.abs(p-a), pb = Math.abs(p-b), pc = Math.abs(p-c);
        out[i] = (x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff;
        break;
      }
    }
  }
  return out;
}

function processSVG(svgPath) {
  console.log('\nProcessing:', svgPath);
  const svg = fs.readFileSync(svgPath, 'utf8');
  const b64Match = svg.match(/base64,([A-Za-z0-9+/=\r\n]+)/);
  if (!b64Match) { console.log('  No base64 found, skipping'); return; }

  const pngBuf = Buffer.from(b64Match[1].replace(/[\r\n]/g, ''), 'base64');

  // Parse PNG chunks
  let pos = 8, width, height, channels = 4;
  const idatChunks = [];
  while (pos < pngBuf.length - 4) {
    const len = pngBuf.readUInt32BE(pos);
    const type = pngBuf.slice(pos+4, pos+8).toString('ascii');
    if (type === 'IHDR') {
      width  = pngBuf.readUInt32BE(pos + 8);
      height = pngBuf.readUInt32BE(pos + 12);
      const colorType = pngBuf[pos + 17];
      channels = (colorType === 2) ? 3 : 4;
    } else if (type === 'IDAT') {
      idatChunks.push(pngBuf.slice(pos+8, pos+8+len));
    } else if (type === 'IEND') break;
    pos += 12 + len;
  }
  console.log(`  ${width}x${height}, ${channels} channels`);

  // Decode
  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const rowStride = 1 + width * channels;
  const pixelData = Buffer.alloc(width * height * 4, 0);
  let prev = null;
  for (let y = 0; y < height; y++) {
    const filterType = raw[y * rowStride];
    const rowIn = raw.slice(y * rowStride + 1, y * rowStride + 1 + width * channels);
    const rowOut = unfilterRow(filterType, rowIn, prev, channels, width);
    for (let x = 0; x < width; x++) {
      const s = x * channels, d = (y * width + x) * 4;
      pixelData[d]   = rowOut[s];
      pixelData[d+1] = rowOut[s+1];
      pixelData[d+2] = rowOut[s+2];
      pixelData[d+3] = channels === 4 ? rowOut[s+3] : 255;
    }
    prev = rowOut;
  }

  // Remove white background
  const newPx = Buffer.alloc(width * height * 4, 0);
  let opaque = 0, transparent = 0;
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    const R = pixelData[o], G = pixelData[o+1], B = pixelData[o+2], A = pixelData[o+3];
    if (A < 10) { transparent++; continue; }

    const minC = Math.min(R, G, B);
    const alpha = 255 - minC;

    if (alpha < 8) { transparent++; continue; } // essentially white

    opaque++;
    let nR = R, nG = G, nB = B;
    if (alpha < 250) {
      // Edge pixel: recover original foreground color from white-background composite
      const a = alpha / 255;
      nR = Math.max(0, Math.min(255, Math.round((R - (1-a)*255) / a)));
      nG = Math.max(0, Math.min(255, Math.round((G - (1-a)*255) / a)));
      nB = Math.max(0, Math.min(255, Math.round((B - (1-a)*255) / a)));
    }
    newPx[o]=nR; newPx[o+1]=nG; newPx[o+2]=nB; newPx[o+3]=Math.min(255,alpha);
  }
  console.log(`  ${opaque} opaque, ${transparent} transparent pixels`);

  // Encode new RGBA PNG (filter type 0 = None for simplicity)
  const scanStride = 1 + width * 4;
  const rawOut = Buffer.alloc(height * scanStride);
  for (let y = 0; y < height; y++) {
    rawOut[y * scanStride] = 0;
    newPx.copy(rawOut, y * scanStride + 1, y * width * 4, (y+1) * width * 4);
  }
  const compressed = zlib.deflateSync(rawOut, { level: 6 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;

  const newPNG = Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
  console.log(`  PNG: ${pngBuf.length} → ${newPNG.length} bytes`);

  // Update SVG: new base64, remove feColorMatrix filter
  let newSvg = svg.replace(/base64,[A-Za-z0-9+/=\r\n]+/, 'base64,' + newPNG.toString('base64'));
  newSvg = newSvg.replace(/\s*<defs>[\s\S]*?<\/defs>/, '');
  newSvg = newSvg.replace(/ filter="url\(#cream-on-dark\)"/, '');

  fs.writeFileSync(svgPath, newSvg, 'utf8');
  console.log('  Done');
}

processSVG('src/assets/logo-icon.svg');
processSVG('src/assets/logo-text.svg');
console.log('\nAll done.');
