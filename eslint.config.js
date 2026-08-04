import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

/** @type {import("eslint").Linter.FlatConfig[]} */
const config = [
  {
    ignores: ["dist", "node_modules", "public", "docs"],
  },
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: ["./tsconfig.json"],
      },
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-undef": "off",
    },
  },
];

export default config;
