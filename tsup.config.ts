import { defineConfig } from "tsup";

// The mapping data is most of the package, so every output shares one copy per module format:
// ESM entries (library, React, CLI) share chunks, and so do the CJS ones. No source maps are
// shipped: they doubled the package size and the sources are on GitHub.
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
    format: ["cjs"],
    platform: "node",
    target: "es2020",
    splitting: true,
    dts: { entry: library },
    minify: true,
    external: ["react", "react/jsx-runtime"],
  },
]);
