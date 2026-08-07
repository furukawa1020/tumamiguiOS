import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const srcDir = path.resolve(root, "node_modules", "@mediapipe", "tasks-vision", "wasm");
const distDir = path.resolve(root, "public", "mediapipe", "wasm");

if (!fs.existsSync(srcDir)) {
  console.error(`Missing source wasm directory: ${srcDir}`);
  process.exitCode = 1;
  process.exit();
}

fs.mkdirSync(distDir, { recursive: true });

const copyFile = (from, to) => {
  fs.copyFileSync(from, to);
};

for (const file of fs.readdirSync(srcDir)) {
  if (file === ".." || file === ".") {
    continue;
  }
  const from = path.join(srcDir, file);
  const to = path.join(distDir, file);
  const isCandidate = file.endsWith(".wasm") || file.endsWith(".js");
  if (!isCandidate) {
    continue;
  }
  copyFile(from, to);
}

const visionWasmInternal = path.join(srcDir, "vision_wasm_internal");
if (fs.existsSync(visionWasmInternal)) {
  for (const file of fs.readdirSync(visionWasmInternal)) {
    if (file.endsWith(".js")) {
      const from = path.join(visionWasmInternal, file);
      const to = path.join(distDir, file);
      copyFile(from, to);
    }
  }
}

console.log("WASM copied.");
