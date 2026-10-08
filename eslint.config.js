import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  { ignores: ["dist", "site-dist", "node_modules", "coverage", ".sources"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: [
      "src/react/**/*.{ts,tsx}",
      "examples/**/*.{ts,tsx}",
      "site/**/*.{ts,tsx}",
    ],
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: { console: "readonly", process: "readonly", URL: "readonly" },
    },
  },
);
