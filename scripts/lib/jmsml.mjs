// Parser for the Esri Joint Military Symbology XML (JMSML) instance files.
// Extracts the MIL-STD-2525D catalog (entities and sector modifiers per symbol set)
// and the MIL-STD-2525C legacy symbol links (<LegacySymbol>).
import fs from "node:fs";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

const ARRAY_TAGS = new Set([
  "Entity",
  "EntityType",
  "EntitySubType",
  "SpecialEntitySubType",
  "Modifier",
  "LegacySymbol",
  "LegacyFunctionCode",
  "LegacyEntity",
  "LegacyCodingSchemeCode",
]);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "#text",
  parseTagValue: false,
  parseAttributeValue: false,
  isArray: (name) => ARRAY_TAGS.has(name),
});

const code2 = (node) => `${node.DigitOne}${node.DigitTwo}`;
const text = (node) =>
  typeof node === "string" ? node : (node?.["#text"] ?? "");

export function parseSymbolSetFile(file) {
  const xml = fs.readFileSync(file, "utf8");
  const root = parser.parse(xml).SymbolSet;
  if (!root || !root.SymbolSetCode) return null;
  const symbolSet = code2(root.SymbolSetCode);
  const label = root.Label;

  // Entity catalog: ID path -> { code, name }
  const entities = new Map(); // key "E|T|S" (IDs) -> {code, name}
  const catalog = []; // [{code, name}]
  const specialSubtypes = new Map();
  for (const st of root.SpecialEntitySubTypes?.EntitySubType ?? []) {
    specialSubtypes.set(st.ID, {
      code: code2(st.EntitySubTypeCode),
      label: st.Label,
    });
  }
  for (const e of root.Entities?.Entity ?? []) {
    const ec = code2(e.EntityCode);
    const eCode = `${ec}0000`;
    entities.set(`${e.ID}||`, { code: eCode, name: e.Label });
    catalog.push({ code: eCode, name: e.Label });
    for (const t of e.EntityTypes?.EntityType ?? []) {
      const tc = code2(t.EntityTypeCode);
      const tName = `${e.Label} : ${t.Label}`;
      entities.set(`${e.ID}|${t.ID}|`, { code: `${ec}${tc}00`, name: tName });
      catalog.push({ code: `${ec}${tc}00`, name: tName });
      for (const s of t.EntitySubTypes?.EntitySubType ?? []) {
        const sName = `${tName} : ${s.Label}`;
        const sCode = `${ec}${tc}${code2(s.EntitySubTypeCode)}`;
        entities.set(`${e.ID}|${t.ID}|${s.ID}`, { code: sCode, name: sName });
        catalog.push({ code: sCode, name: sName });
      }
    }
  }

  const modifiers = { 1: new Map(), 2: new Map() };
  for (const m of root.SectorOneModifiers?.Modifier ?? []) {
    modifiers[1].set(m.ID, {
      code: code2(m.ModifierCode),
      name: m.Label,
      category: m.Category ?? "",
    });
  }
  for (const m of root.SectorTwoModifiers?.Modifier ?? []) {
    modifiers[2].set(m.ID, {
      code: code2(m.ModifierCode),
      name: m.Label,
      category: m.Category ?? "",
    });
  }

  const legacy = [];
  for (const ls of root.LegacySymbols?.LegacySymbol ?? []) {
    const label15 = ls.Label;
    const retired = /retired|deleted/i.test(ls.Remarks ?? "");
    let entity = null;
    let unresolved = null;
    if (ls.EntityID) {
      let key = `${ls.EntityID}|${ls.EntityTypeID ?? ""}|${ls.EntitySubTypeID ?? ""}`;
      entity = entities.get(key) ?? null;
      if (
        !entity &&
        ls.EntitySubTypeID &&
        specialSubtypes.has(ls.EntitySubTypeID)
      ) {
        const base = entities.get(`${ls.EntityID}|${ls.EntityTypeID ?? ""}|`);
        const sp = specialSubtypes.get(ls.EntitySubTypeID);
        if (base)
          entity = {
            code: base.code.slice(0, 4) + sp.code,
            name: `${base.name} : ${sp.label}`,
          };
      }
      if (!entity) unresolved = key;
    }
    const m1 = ls.ModifierOneID ? modifiers[1].get(ls.ModifierOneID) : null;
    const m2 = ls.ModifierTwoID ? modifiers[2].get(ls.ModifierTwoID) : null;
    if (ls.ModifierOneID && !m1) unresolved = `m1:${ls.ModifierOneID}`;
    if (ls.ModifierTwoID && !m2) unresolved = `m2:${ls.ModifierTwoID}`;

    // Every 2525C function code linked to this 2525D symbol, as a full 15-character template.
    const templates = [];
    for (const fc of ls.LegacyFunctionCode ?? []) {
      if (fc.Name !== "2525C") continue;
      if (fc.LimitUseTo && fc.LimitUseTo !== "2525C") continue;
      const chars = label15.split("");
      const fn = text(fc).trim();
      if (fn.length !== 6) continue;
      chars.splice(4, 6, ...fn.split(""));
      if (fc.SchemaOverride) chars[0] = fc.SchemaOverride;
      if (fc.StandardIdentityOverride) chars[1] = fc.StandardIdentityOverride;
      if (fc.DimensionOverride) chars[2] = fc.DimensionOverride;
      if (fc.StatusOverride) chars[3] = fc.StatusOverride;
      if (fc.HQTFFDOverride) chars[10] = fc.HQTFFDOverride;
      if (fc.AmplifierOverride) chars[11] = fc.AmplifierOverride;
      if (fc.TailOverride && fc.TailOverride.length === 3) {
        // TailOverride documents positions 13-15 in JMSML; the label already carries them.
        chars.splice(12, 3, ...fc.TailOverride.split(""));
      }
      templates.push(chars.join(""));
    }
    if (templates.length === 0) continue;
    legacy.push({
      id: ls.ID,
      label: label15,
      templates: [...new Set(templates)],
      retired,
      remarks: ls.Remarks ?? "",
      symbolSet,
      entity,
      m1: m1 ? { code: m1.code, name: m1.name } : null,
      m2: m2 ? { code: m2.code, name: m2.name } : null,
      unresolved,
    });
  }
  return { symbolSet, label, catalog, specialSubtypes, modifiers, legacy };
}

export function parseJmsml(dir) {
  const sets = [];
  for (const f of fs.readdirSync(dir).sort()) {
    if (!f.endsWith(".xml") || f === "Base.xml") continue;
    const r = parseSymbolSetFile(path.join(dir, f));
    if (r) sets.push({ file: f, ...r });
  }
  return sets;
}
