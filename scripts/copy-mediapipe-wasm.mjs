import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const distDir = path.resolve(root, "public", "mediapipe", "wasm");

const candidateDirPaths = [
  path.resolve(root, "node_modules", "@mediapipe", "tasks-vision", "wasm"),
  path.resolve(root, "node_modules", "@mediapipe", "tasks-vision", "dist", "wasm"),
  path.resolve(root, "node_modules", "@mediapipe", "tasks-vision", "build", "wasm"),
];

const candidateFiles = [
  path.resolve(root, "node_modules", "@mediapipe", "tasks-vision", "vision_wasm_internal.js"),
  path.resolve(root, "node_modules", "@mediapipe", "tasks-vision", "wasm_internal.js"),
  path.resolve(root, "node_modules", "@mediapipe", "tasks-vision", "wasm", "vision_wasm_internal.js"),
];

const isValidCandidatePath = (value) => {
  return value && value.length > 0;
};

const resolveSourceDirectory = () => {
  for (const dirPath of candidateDirPaths) {
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      return dirPath;
    }
  }
  return null;
};

const copyRecursive = (sourceDir) => {
  for (const entry of fs.readdirSync(sourceDir)) {
    if (entry === "." || entry === "..") {
      continue;
    }
    const from = path.join(sourceDir, entry);
    const stat = fs.statSync(from);
    if (stat.isDirectory()) {
      copyRecursive(from);
      continue;
    }
    const lower = entry.toLowerCase();
    if (!lower.endsWith(".js") && !lower.endsWith(".wasm")) {
      continue;
    }
    fs.copyFileSync(from, path.join(distDir, entry));
  }
};

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const sourceDir = resolveSourceDirectory();
if (!isValidCandidatePath(sourceDir)) {
  console.error("Could not find mediapipe wasm source directory.");
  process.exitCode = 1;
  process.exit();
}

copyRecursive(sourceDir);

for (const filePath of candidateFiles) {
  if (!fs.existsSync(filePath)) {
    continue;
  }
  const fileName = path.basename(filePath);
  fs.copyFileSync(filePath, path.join(distDir, fileName));
}

const copied = fs.readdirSync(distDir);
if (copied.length === 0) {
  console.error(`No wasm/js files were copied from ${sourceDir}.`);
  process.exitCode = 1;
  process.exit();
}

const hasVisionWasm = copied.some((file) => file.includes("vision_wasm_internal"));
if (!hasVisionWasm) {
  console.warn("vision_wasm_internal.js was not found in copied assets. Vision initialization may use CDN fallback.");
}

console.log("WASM copied.");
