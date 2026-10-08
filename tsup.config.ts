import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
      "react/index": "src/react/index.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: true,
    target: "es2020",
    external: ["react", "react/jsx-runtime"],
  },
  {
    entry: { cli: "src/cli/bin.ts" },
    format: ["esm"],
    platform: "node",
    target: "node22",
    banner: { js: "#!/usr/bin/env node" },
    minify: true,
  },
]);
