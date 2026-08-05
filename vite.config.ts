import { defineConfig } from "vite";
import { resolve } from "path";
import { existsSync, readFileSync } from "node:fs";

const resolveBase = (): string => {
  const explicit = process.env.VITE_BASE_PATH;
  if (explicit) {
    return explicit.startsWith("/") ? explicit : `/${explicit}`;
  }

  const customDomainPath = resolve(__dirname, "public", "CNAME");
  if (existsSync(customDomainPath) && readFileSync(customDomainPath, "utf8").trim()) {
    return "/";
  }

  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) {
    return "/";
  }
  const repoName = repository.split("/").pop() ?? "";
  if (!repoName || repoName.endsWith(".github.io")) {
    return "/";
  }
  return `/${repoName}/`;
};

export default defineConfig({
  base: resolveBase(),
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
