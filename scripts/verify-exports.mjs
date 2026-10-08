// Smoke-tests the built package (dist/) through its public entry points in ESM and CJS.
import { createRequire } from "node:module";
import assert from "node:assert/strict";

const esm = await import("../dist/index.js");
const cjs = createRequire(import.meta.url)("../dist/index.cjs");
for (const [name, mod] of [
  ["esm", esm],
  ["cjs", cjs],
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
const react = await import("../dist/react/index.js");
assert.equal(typeof react.useSidcConverter, "function");
assert.equal(typeof react.SidcConverter, "function");
console.log("exports OK (esm, cjs, react)");
