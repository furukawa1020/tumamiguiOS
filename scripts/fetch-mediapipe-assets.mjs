import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const modelDir = path.join(rootDir, "public", "mediapipe", "models");
const manifestPath = path.join(modelDir, "manifest.json");

const urls = [
  {
    name: "hand_landmarker.task",
    url: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
  },
  {
    name: "face_landmarker.task",
    url: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  },
];

const readManifest = () => {
  if (!fs.existsSync(manifestPath)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch {
    return {};
  }
};

const writeManifest = (manifest) => {
  fs.mkdirSync(modelDir, { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
};

const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

const fetchArrayBuffer = async (url) => {
  const response = await fetch(url, { headers: { Accept: "application/octet-stream" } });
  if (!response.ok) {
    throw new Error(`fetch failed: ${url} (${response.status})`);
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) {
    throw new Error(`Invalid content type for ${url}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

const checkExisting = (filePath, manifest, url) => {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  const existing = fs.readFileSync(filePath);
  const hash = sha256(existing);
  const recorded = manifest[url]?.sha256;
  return !recorded || recorded === hash;
}

const main = async () => {
  const manifest = readManifest();
  for (const item of urls) {
    const outputPath = path.join(modelDir, item.name);
    if (checkExisting(outputPath, manifest, item.url)) {
      continue;
    }
    const buffer = await fetchArrayBuffer(item.url);
    if (buffer.length < 1024 * 10) {
      throw new Error(`Downloaded file size too small for ${item.url}`);
    }
    if (buffer.readUInt8(0) === "<".charCodeAt(0) || buffer.slice(0, 5).toString() === "%PDF-") {
      throw new Error(`Downloaded file seems invalid for ${item.url}`);
    }
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, buffer);
    manifest[item.url] = {
      file: item.name,
      sha256: sha256(buffer),
      size: buffer.length,
      updatedAt: new Date().toISOString(),
    };
  }
  writeManifest(manifest);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
