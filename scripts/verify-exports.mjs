// Smoke-tests the built packages through their public entry points: the ESM package (imported, and
// required, which Node.js 22.12+ supports for ES modules) and the CommonJS package in dist-cjs/.
import { createRequire } from "node:module";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const esm = await import("../dist/index.js");
const requiredEsm = require("../dist/index.js");
const cjs = require("../dist-cjs/index.cjs");
for (const [name, mod] of [
  ["esm", esm],
  ["require(esm)", requiredEsm],
  ["cjs package", cjs],
]) {
  for (const fn of [
    "convertSidc",
    "convertSidc15To12",
    "convertSidc15To2525D",
    "convertSidc15ToApp6D",
    "convertSidc15To2525E",
    "convertSidc15ToApp6E",
    "convertSidcToAll",
    "validateSidc",
    "analyzeSidc",
    "toRenderableSidc",
  ])
    assert.equal(typeof mod[fn], "function", `${name}: ${fn}`);
  assert.equal(
    mod.convertSidc15To2525D("SFGPUCIC---E---").output,
    "10031000151211000002",
    name,
  );
  assert.equal(
    mod.convertSidc15To12("SFGPUCIC---E---").output,
    "SFGPUCIC---E",
    name,
  );
}
for (const react of [
  await import("../dist/react/index.js"),
  require("../dist-cjs/react/index.cjs"),
]) {
  assert.equal(typeof react.useSidcConverter, "function");
  assert.equal(typeof react.SidcConverter, "function");
}
const cjsPkg = require("../dist-cjs/package.json");
const mainPkg = require("../package.json");
assert.equal(cjsPkg.version, mainPkg.version, "cjs package version");
console.log("exports OK (esm, require(esm), cjs package, react)");
