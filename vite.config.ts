import { defineConfig } from "vite";
import { resolve } from "path";

const resolveBase = (): string => {
  const explicit = process.env.VITE_BASE_PATH;
  if (explicit) {
    return explicit.startsWith("/") ? explicit : `/${explicit}`;
  }

  return "./";
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
