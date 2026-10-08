// Parsers for the US Army C5ISR mil-sym-ts renderer data files (Apache-2.0):
//  - c2d.json: 2525C basic symbol ID -> 2525D Change 1 (or noted version) code
//  - msd.json / mse.json: entity catalogs; "versions" lists the SIDC version codes
//    (10 = APP-6D, 11 = 2525D Change 1, 15 = 2525E Change 1, 16 = APP-6E Change 2)
//  - smd.json / sme.json: sector 1/2 modifier catalogs with the same version tags
import fs from "node:fs";
import path from "node:path";

const DATA = "src/main/ts/armyc2/c5isr/data";
const load = (root, f) =>
  JSON.parse(fs.readFileSync(path.join(root, DATA, f), "utf8"));

export function parseC2D(root) {
  return load(root, "c2d.json").c2d.symbols.map((s) => ({
    basic: s.basic,
    version: s.ver,
    symbolSet: s.ss,
    entity: s.ec,
    m1: s.s1 || "00",
    m2: s.s2 || "00",
  }));
}

/** Entity catalog: Map version -> Map("ss|code" -> name path). */
export function parseEntityCatalog(root, file, key) {
  const symbols = load(root, file)[key].SYMBOL;
  const out = new Map();
  let ss = "",
    e = "",
    et = "",
    est = "",
    versions = "";
  for (const s of symbols) {
    if (s.ss) ss = s.ss;
    if (s.e) {
      e = s.e.trim();
      et = "";
      est = "";
    }
    if (s.et) {
      et = s.et.trim();
      est = "";
    }
    if (s.est) est = s.est.trim();
    if (s.versions) versions = s.versions;
    const code = s.code && s.code.length === 6 ? s.code : "000000";
    const name = [e, et, est].filter(Boolean).join(" : ");
    for (const v of versions.split(",")) {
      if (!out.has(v)) out.set(v, new Map());
      out.get(v).set(`${ss}|${code}`, name);
    }
  }
  return out;
}

/** Sector modifier catalog: Map version -> Map("ss|sector|code" -> name). */
export function parseModifierCatalog(root, file, key) {
  const mods = load(root, file)[key].secmods;
  const out = new Map();
  let ss = "",
    sector = "";
  for (const m of mods) {
    if (!m.versions) {
      ss = m.name.split(" ")[0];
      sector = m.category;
      continue;
    }
    // 2525E common modifiers ("00 Common") have 3-digit codes: the leading 1 is the common-modifier
    // indicator written to SIDC position 21 (sector 1) or 22 (sector 2) of the 30-digit form.
    if (m.code.length > 2 && ss !== "00") continue;
    const code = m.code.length > 2 ? m.code : m.code.padStart(2, "0");
    for (const v of m.versions.split(",")) {
      if (!out.has(v)) out.set(v, new Map());
      out.get(v).set(`${ss}|${sector}|${code}`, m.name.trim());
    }
  }
  return out;
}
