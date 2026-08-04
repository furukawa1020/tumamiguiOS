import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

/** @type {import("eslint").Linter.FlatConfig[]} */
const config = [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "public/**",
      "docs/**",
      "scripts/**",
      "playwright.config.ts",
      "vite.config.ts",
      "eslint.config.js",
    ],
  },
  js.configs.recommended,
  {
    files: [
      "src/**/*.ts",
      "src/**/*.tsx",
      "tests/**/*.ts",
      "tests/**/*.js",
      "e2e/**/*.ts",
      "e2e/**/*.js",
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        fetch: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        globalThis: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-undef": "off",
      "no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
    },
  },
];

export default config;
