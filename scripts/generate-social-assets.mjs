import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

const crc32 = (bytes) => {
  let c = 0xffffffff;
  for (const byte of bytes) {
    c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
};

const writeChunk = (type, data, parts) => {
  const len = data.length;
  const header = new Uint8Array(8);
  const view = new DataView(header.buffer);
  view.setUint32(0, len);
  for (let i = 0; i < 4; i++) {
    header[4 + i] = type.charCodeAt(i);
  }
  parts.push(...header);
  parts.push(...data);
  const crcInput = new Uint8Array(4 + data.length);
  crcInput.set(header.slice(4), 0);
  crcInput.set(data, 4);
  const crc = crc32(crcInput);
  const crcTail = new Uint8Array(4);
  const crcView = new DataView(crcTail.buffer);
  crcView.setUint32(0, crc);
  parts.push(...crcTail);
};

const encodePNG = (width, height, pixels) => {
  const rowBytes = width * 4 + 1;
  const raw = new Uint8Array(rowBytes * height);
  for (let y = 0; y < height; y++) {
    const offset = y * rowBytes;
    raw[offset] = 0;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      raw[offset + 1 + x * 4 + 0] = pixels[i];
      raw[offset + 1 + x * 4 + 1] = pixels[i + 1];
      raw[offset + 1 + x * 4 + 2] = pixels[i + 2];
      raw[offset + 1 + x * 4 + 3] = pixels[i + 3];
    }
  }
  const compressed = zlib.deflateSync(raw);
  const signature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const chunks = Array.from(signature);

  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, width);
  ihdrView.setUint32(4, height);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  writeChunk("IHDR", ihdr, chunks);
  writeChunk("IDAT", compressed, chunks);
  writeChunk("IEND", new Uint8Array(0), chunks);
  return Uint8Array.from(chunks);
};

const drawArt = (width, height, title) => {
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const t = y / Math.max(1, height - 1);
      const ux = x / Math.max(1, width - 1);
      pixels[i + 0] = Math.min(255, 20 + ux * 20 + t * 25);
      pixels[i + 1] = Math.min(255, 40 + t * 80 + ux * 10);
      pixels[i + 2] = Math.min(255, 70 + t * 30);
      pixels[i + 3] = 255;
    }
  }
  for (let y = Math.floor(height * 0.28); y < Math.floor(height * 0.72); y++) {
    for (let x = Math.floor(width * 0.05); x < Math.floor(width * 0.95); x++) {
      if (Math.random() < 0.02) {
        const idx = (y * width + x) * 4;
        pixels[idx] = 255;
        pixels[idx + 1] = 224;
        pixels[idx + 2] = 120;
        pixels[idx + 3] = 255;
      }
    }
  }
  for (let y = Math.floor(height * 0.4); y < Math.floor(height * 0.8); y++) {
    const cy = 0.5 + 0.4 * Math.sin((y / height) * Math.PI);
    const cx = width * 0.58;
    const amp = width * 0.11;
    const centerX = cx + Math.sin((y / height) * Math.PI) * amp;
    const span = Math.max(15, width * 0.04);
    for (let x = Math.floor(centerX - span); x <= Math.floor(centerX + span); x++) {
      if (x < 0 || x >= width) continue;
      const idx = (y * width + x) * 4;
      pixels[idx] = 255;
      pixels[idx + 1] = 220;
      pixels[idx + 2] = 150;
      pixels[idx + 3] = 255;
    }
  }
  return encodePNG(width, height, pixels);
};

const outDoc = path.join(root, "docs", "cover.png");
const outPublic = path.join(root, "public", "og-image.png");
const buffer = drawArt(1200, 630, "つまみ食いOS");
fs.mkdirSync(path.dirname(outDoc), { recursive: true });
fs.mkdirSync(path.dirname(outPublic), { recursive: true });
fs.writeFileSync(outDoc, buffer);
fs.writeFileSync(outPublic, buffer);
console.log("social assets generated");
