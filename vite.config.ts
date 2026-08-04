import { defineConfig } from "vite";
import { resolve } from "path";

const resolveBase = (): string => {
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
