import { defineConfig } from "tsup";

// The package is ESM only (Node 22.12+ can also require() it). The CommonJS build goes to
// dist-cjs/, which scripts/cjs-package.mjs turns into the separate package
// mil-symbol-converter-cjs for Jest and other require()-only tooling.
// Each build shares one copy of the mapping data between its entries; no source maps are shipped.
const library = {
  index: "src/index.ts",
  "react/index": "src/react/index.ts",
};

export default defineConfig([
  {
    entry: { ...library, cli: "src/cli/bin.ts" },
    format: ["esm"],
    platform: "node",
    target: "es2020",
    splitting: true,
    dts: { entry: library },
    clean: true,
    minify: true,
    external: ["react", "react/jsx-runtime"],
  },
  {
    entry: library,
    outDir: "dist-cjs",
    format: ["cjs"],
    platform: "node",
    target: "es2020",
    splitting: true,
    dts: { entry: library },
    clean: true,
    minify: true,
    external: ["react", "react/jsx-runtime"],
  },
]);
