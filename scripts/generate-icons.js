import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, drawFn) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with scanline filter bytes
  const rowBytes = width * 4;
  const rawData = Buffer.alloc((rowBytes + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowBytes + 1);
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const length = data.length;
  const buf = Buffer.alloc(8 + length + 4);
  buf.writeUInt32BE(length, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + length));
  buf.writeUInt32BE(crc, 8 + length);
  return buf;
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Brand color drawing function
function drawAppIcon(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  const maxR = w * 0.46;

  // Background rounded rect/circle dark slate #0f172a to #1e293b
  const gradient = 15 + Math.floor((y / h) * 16);
  let r = gradient;
  let g = gradient + 8;
  let b = gradient + 24;
  let a = 255;

  // Outer border ring in Gold Amber (#f59e0b)
  if (dist >= maxR - 6 && dist <= maxR) {
    return [245, 158, 11, 255];
  }

  // Inner car & emblem zone
  if (dist < maxR * 0.65) {
    // Inner badge
    r = 30; g = 41; b = 59;
    
    // Gold stylized car shape in center
    const nx = (x - cx) / (w * 0.3);
    const ny = (y - (cy - h * 0.05)) / (h * 0.3);
    
    // Front car hood & cabin silhouette
    if (ny > -0.4 && ny < 0.4 && Math.abs(nx) < 0.6) {
      if (ny > -0.4 && ny < -0.1 && Math.abs(nx) < 0.35) {
        // Windshield - dark
        return [15, 23, 42, 255];
      }
      // Car body - amber gold
      return [251, 191, 36, 255];
    }
  }

  // Bottom amber ribbon
  if (y > h * 0.72 && y < h * 0.84 && Math.abs(x - cx) < w * 0.35) {
    return [245, 158, 11, 255]; // Amber
  }

  return [r, g, b, a];
}

const outDir = path.resolve('public');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), createPng(192, 192, drawAppIcon));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), createPng(512, 512, drawAppIcon));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), createPng(512, 512, drawAppIcon));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPng(180, 180, drawAppIcon));
console.log('PNG Icons generated successfully in public/');
