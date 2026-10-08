// Extracts the MIL-STD-2525C -> 2525D field-level code tables from JMSML Base.xml:
// standard identity (context + identity), status, HQ/TF/dummy and echelon/mobility amplifiers.
import fs from "node:fs";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "#text",
  parseTagValue: false,
  isArray: (name) =>
    [
      "Affiliation", "LegacyStandardIdentityCode", "Status", "LegacyStatusCode", "HQTFDummy",
      "LegacyHQTFDummyCode", "AmplifierGroup", "Amplifier", "LegacyModifierCode", "Context",
      "StandardIdentity", "Dimension", "LegacyDimensionCode",
    ].includes(name),
});
const text = (n) => (typeof n === "string" ? n : (n?.["#text"] ?? ""));

export function parseBase(file) {
  const root = parser.parse(fs.readFileSync(file, "utf8")).Library;
  const contexts = Object.fromEntries(root.Contexts.Context.map((c) => [c.ID, String(c.ContextCode)]));
  const identities = Object.fromEntries(
    root.StandardIdentities.StandardIdentity.map((s) => [s.ID, String(s.StandardIdentityCode)]),
  );

  // Legacy standard identity letter -> 2-digit context+identity, checked for consistency across dimensions.
  // METOC (2525C coding scheme W) uses position 2 for the category (A/O/S), which JMSML maps
  // separately from the standard identity of the other coding schemes.
  const standardIdentity = {};
  const metocCategory = {};
  const conflicts = [];
  for (const a of root.Affiliations.Affiliation) {
    const isMetoc = a.DimensionID === "METOC";
    for (const l of a.LegacyStandardIdentityCode ?? []) {
      if (!String(l.Name).includes("2525C")) continue;
      if (isMetoc && !/^REALITY_METOC_/.test(a.ID)) continue; // "for 2525C legacy support" duplicates
      const letter = text(l);
      const digits = contexts[a.ContextID] + identities[a.StandardIdentityID];
      const table = isMetoc ? metocCategory : standardIdentity;
      if (table[letter] && table[letter] !== digits) {
        conflicts.push(`${letter}: ${table[letter]} vs ${digits} (${a.ID})`);
      }
      table[letter] ??= digits;
    }
  }

  const status = {};
  for (const s of root.Statuses.Status) {
    for (const l of s.LegacyStatusCode ?? []) status[text(l)] = String(s.StatusCode);
  }

  const hqtfd = {};
  for (const h of root.HQTFDummies.HQTFDummy) {
    for (const l of h.LegacyHQTFDummyCode ?? []) {
      const scheme = l.CodingSchemeLetter ?? "*";
      hqtfd[`${scheme}:${text(l)}`] = String(h.HQTFDummyCode);
    }
  }

  // Amplifier groups: legacy character 11 (group) and character 12 (amplifier).
  const amplifiers = [];
  for (const g of root.AmplifierGroups.AmplifierGroup) {
    const groupLegacy = (g.LegacyModifierCode ?? []).map((l) => ({
      scheme: l.CodingSchemeLetter ?? "*",
      char11: text(l),
    }));
    for (const a of g.Amplifiers?.Amplifier ?? []) {
      for (const l of a.LegacyModifierCode ?? []) {
        amplifiers.push({
          group: g.Name,
          groupCode: String(g.AmplifierGroupCode),
          code: String(a.AmplifierCode),
          label: a.Label,
          char12: text(l),
          char11: groupLegacy,
          scheme: l.CodingSchemeLetter ?? "*",
          compatibleSymbolSets: g.CompatibleSymbolSetIDs ?? null,
        });
      }
    }
  }

  const dimensions = [];
  for (const d of root.Dimensions.Dimension) {
    for (const l of d.LegacyDimensionCode ?? []) {
      if (l.Name !== "2525C") continue;
      dimensions.push({
        dimension: d.ID,
        scheme: l.CodingSchemeLetter ?? "*",
        firstFunctionLetter: l.FirstFunctionLetter ?? null,
        letter: text(l),
      });
    }
  }
  return { standardIdentity, metocCategory, conflicts, status, hqtfd, amplifiers, dimensions };
}
