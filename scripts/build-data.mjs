// Generates the mapping tables in src/data/ from the pinned upstream sources fetched by
// scripts/fetch-sources.sh. Run: ./scripts/fetch-sources.sh && npm run build-data
//
// Nothing here decides match quality; the generated files only carry the raw evidence of each
// source so the runtime code (src/) can apply documented, tested rules.
import fs from "node:fs";
import { parseJmsml } from "./lib/jmsml.mjs";
import { parseBase } from "./lib/jmsml-base.mjs";
import {
  parseC2D,
  parseEntityCatalog,
  parseModifierCatalog,
} from "./lib/milsym.mjs";
import { parse2525cCatalog } from "./lib/standard-2525c.mjs";

const SRC = ".sources";
const OUT = "src/data";
const PINS = JSON.parse(fs.readFileSync("scripts/sources.json", "utf8"));
const JMSML_SHA = PINS.jmsml.commit;
const MILSYM_SHA = PINS["mil-sym-ts"].commit;

const write = (name, data) => {
  fs.writeFileSync(`${OUT}/${name}`, JSON.stringify(data) + "\n");
  console.log(
    `wrote ${OUT}/${name} (${fs.statSync(`${OUT}/${name}`).size} bytes)`,
  );
};

// ---------------------------------------------------------------------------------------------
// 1. Normative MIL-STD-2525C catalog
const c2525 = parse2525cCatalog(`${SRC}/standards/MIL-STD-2525C.txt`);

// ---------------------------------------------------------------------------------------------
// 2. JMSML: 2525D catalog + 2525C legacy links
const sets = parseJmsml(`${SRC}/jmsml/instance`);
const base = parseBase(`${SRC}/jmsml/instance/Base.xml`);

const jmsmlRows = [];
const jmsmlIssues = [];
for (const s of sets) {
  for (const l of s.legacy) {
    if (l.unresolved) {
      jmsmlIssues.push(`${l.id}: unresolved reference ${l.unresolved}`);
      continue;
    }
    for (const t of l.templates) {
      const flags =
        (l.retired || !l.entity ? "R" : "") + (t === l.label ? "L" : "");
      jmsmlRows.push([
        t,
        s.symbolSet,
        l.entity?.code ?? "",
        l.m1?.code ?? "00",
        l.m2?.code ?? "00",
        flags,
      ]);
    }
  }
}

// ---------------------------------------------------------------------------------------------
// 3. mil-sym-ts: 2525C -> 2525D Change 1 table and per-edition catalogs
const milsymRoot = `${SRC}/mil-sym-ts`;
const c2d = parseC2D(milsymRoot);
const milsymIssues = [];
const milsymRows = [];
for (const r of c2d) {
  if (r.basic.length !== 15) {
    milsymIssues.push(
      `c2d basic "${r.basic}" is ${r.basic.length} characters; skipped`,
    );
    continue;
  }
  milsymRows.push([r.basic, r.version, r.symbolSet, r.entity, r.m1, r.m2]);
}

const msd = parseEntityCatalog(milsymRoot, "msd.json", "msd");
const mse = parseEntityCatalog(milsymRoot, "mse.json", "mse");
const smd = parseModifierCatalog(milsymRoot, "smd.json", "smd");
const sme = parseModifierCatalog(milsymRoot, "sme.json", "sme");

// ---------------------------------------------------------------------------------------------
// 4. Edition catalogs (names), restricted to codes referenced by any 2525C mapping candidate.
const referencedEntities = new Set();
const referencedMods = new Set();
for (const [, ss, e, m1, m2, flags] of jmsmlRows) {
  if (flags.includes("R")) continue;
  referencedEntities.add(`${ss}|${e}`);
  referencedMods.add(`${ss}|1|${m1}`);
  referencedMods.add(`${ss}|2|${m2}`);
}
for (const [, , ss, e, m1, m2] of milsymRows) {
  referencedEntities.add(`${ss}|${e}`);
  referencedMods.add(`${ss}|1|${m1.padStart(2, "0")}`);
  referencedMods.add(`${ss}|2|${m2.padStart(2, "0")}`);
}

const names = [];
const nameIndex = new Map();
const nameId = (n) => {
  if (!nameIndex.has(n)) {
    nameIndex.set(n, names.length);
    names.push(n);
  }
  return nameIndex.get(n);
};

// JMSML 2525D (base, version 10) catalog
const jmsmlEntities = new Map();
const jmsmlMods = new Map();
const jmsmlSpecial = new Map();
for (const s of sets) {
  for (const c of s.catalog)
    jmsmlEntities.set(`${s.symbolSet}|${c.code}`, c.name);
  for (const sector of [1, 2]) {
    for (const m of s.modifiers[sector].values()) {
      jmsmlMods.set(`${s.symbolSet}|${sector}|${m.code}`, m.name);
    }
  }
  for (const sp of s.specialSubtypes.values()) {
    jmsmlSpecial.set(`${s.symbolSet}|${sp.code}`, sp.label);
  }
}

// Full catalogs: renumbered codes and name-based lookups need every entry, not only the codes
// referenced by a mapping row.
function editionCatalog(entities, mods, { sigintModsUnder50 = false } = {}) {
  const ent = {};
  const mod = {};
  for (const [key, n] of entities) {
    ent[key] = nameId(n);
  }
  for (const [key, n] of mods) {
    const [ss, sector, code] = key.split("|");
    if (code === "00") continue; // "unspecified" is implicit in every edition
    const sets =
      sigintModsUnder50 && ss === "50" ? ["50", "51", "52", "53", "54"] : [ss];
    for (const s2 of sets) mod[`${s2}|${sector}|${code}`] ??= nameId(n);
  }
  return { entities: ent, modifiers: mod };
}

// JMSML special entity subtypes (e.g. land unit xxxx97 "Corps Support") are combinable with any
// entity type; expand them for referenced codes only.
const jmsmlEntitiesExpanded = new Map(jmsmlEntities);
for (const key of referencedEntities) {
  if (jmsmlEntitiesExpanded.has(key)) continue;
  const [ss, code] = key.split("|");
  const sp = jmsmlSpecial.get(`${ss}|${code.slice(4)}`);
  const parent = jmsmlEntities.get(`${ss}|${code.slice(0, 4)}00`);
  if (sp && parent) jmsmlEntitiesExpanded.set(key, `${parent} : ${sp}`);
}

const catalogs = {
  "2525D": editionCatalog(jmsmlEntitiesExpanded, jmsmlMods),
  "APP-6D": editionCatalog(msd.get("10"), smd.get("10"), {
    sigintModsUnder50: true,
  }),
  "2525Dch1": editionCatalog(msd.get("11"), smd.get("11"), {
    sigintModsUnder50: true,
  }),
  "2525Ech1": editionCatalog(mse.get("15"), sme.get("15"), {
    sigintModsUnder50: true,
  }),
  "APP-6Ech2": editionCatalog(mse.get("16"), sme.get("16"), {
    sigintModsUnder50: true,
  }),
};

// ---------------------------------------------------------------------------------------------
// 5. Field-level code tables from JMSML Base.xml
const amplifiers = {};
for (const a of base.amplifiers) {
  for (const g of a.char11) {
    amplifiers[`${g.scheme}:${g.char11}${a.char12}`] = a.groupCode + a.code;
  }
}
const fields = {
  standardIdentity: base.standardIdentity,
  metocCategory: base.metocCategory,
  status: base.status,
  hqtfd: base.hqtfd,
  amplifiers,
};

// ---------------------------------------------------------------------------------------------
const provenance = {
  generatedBy: "scripts/build-data.mjs",
  sources: {
    "MIL-STD-2525C": {
      title: "MIL-STD-2525C Common Warfighting Symbology, 17 November 2008",
      license:
        "US Government work, Distribution A: approved for public release",
      url: "http://www.mapsymbs.com/ms2525c.pdf",
      sha256:
        "701a34c9476a7a1e9957329f8a01bb7ec1cc83f3a994509a9dbc266960f0c612",
    },
    JMSML: {
      title:
        "Esri Joint Military Symbology XML (2525D / APP-6(C) + legacy 2525C links)",
      license: "Apache-2.0",
      url: "https://github.com/Esri/joint-military-symbology-xml",
      commit: JMSML_SHA,
    },
    "mil-sym-ts": {
      title:
        "US Army C5ISR Center mil-sym-ts renderer data (c2d, msd, mse, smd, sme)",
      license: "Apache-2.0",
      url: "https://github.com/missioncommand/mil-sym-ts",
      commit: MILSYM_SHA,
    },
  },
  issues: { jmsml: jmsmlIssues, milsym: milsymIssues, base: base.conflicts },
};

fs.mkdirSync(OUT, { recursive: true });
write(
  "mil-std-2525c-catalog.json",
  c2525.map((r) => [r.template, r.description, r.hierarchy]),
);
// Compact encodings (about 35% smaller than plain JSON); src/data/index.ts decodes them on load.
// Rows: one "a|b|c" line per row.
const encodeRows = (rows) => rows.map((r) => r.join("|")).join("\n");
// Names: "<parent index>|<last part>" when the name extends another one ("A : B" after "A").
const nameAt = new Map(names.map((n, i) => [n, i]));
const encodedNames = names.map((n) => {
  const cut = n.lastIndexOf(" : ");
  const parent = cut > 0 ? nameAt.get(n.slice(0, cut)) : undefined;
  return parent === undefined ? n : `${parent}|${n.slice(cut + 3)}`;
});
// Catalogs: per symbol set, the codes (comma-separated, without "|") and the name indices as
// differences from the previous one.
const encodeTable = (table) => {
  const bySet = {};
  for (const [key, i] of Object.entries(table)) {
    const [set, ...rest] = key.split("|");
    (bySet[set] ??= [[], []])[0].push(rest.join("|"));
    bySet[set][1].push(i);
  }
  for (const [set, [codes, ids]] of Object.entries(bySet))
    bySet[set] = [
      codes.join(","),
      ids.map((x, j) => (j ? x - ids[j - 1] : x)).join(","),
    ];
  return bySet;
};
const encodedCatalogs = Object.fromEntries(
  Object.entries(catalogs).map(([edition, c]) => [
    edition,
    { entities: encodeTable(c.entities), modifiers: encodeTable(c.modifiers) },
  ]),
);
write("legacy-mappings.json", {
  jmsml: encodeRows(jmsmlRows),
  milsym: encodeRows(milsymRows),
});
write("edition-catalogs.json", {
  names: encodedNames,
  catalogs: encodedCatalogs,
});
write("field-codes.json", fields);
write("provenance.json", provenance);
console.log(
  `2525C rows ${c2525.length}; JMSML rows ${jmsmlRows.length}; mil-sym rows ${milsymRows.length};`,
  Object.fromEntries(
    Object.entries(catalogs).map(([k, v]) => [
      k,
      `${Object.keys(v.entities).length} entities / ${Object.keys(v.modifiers).length} modifiers`,
    ]),
  ),
);
console.log("issues", JSON.stringify(provenance.issues, null, 1));
