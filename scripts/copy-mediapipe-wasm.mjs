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

for (const file of fs.readdirSync(srcDir)) {
  if (!file.endsWith(".wasm")) {
    continue;
  }
  const from = path.join(srcDir, file);
  const to = path.join(distDir, file);
  fs.copyFileSync(from, to);
}
console.log("WASM copied.");
