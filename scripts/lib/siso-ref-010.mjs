// Reads the DIS enumerations (SISO-REF-010, XML) that src/dis.ts needs: Force ID, entity kind,
// platform domain and categories, munition domain and category, aggregate types, and the country
// codes.
// Country codes are keyed by ISO 3166-1 alpha-2 (as in MIL-STD-2525C positions 13-14), joined
// through the alpha-3 code SISO-REF-010 gives in each country's name, with CLDR's code mappings.
import fs from "node:fs";

const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

function enumRows(xml, uid) {
  const start = xml.indexOf(`<enum uid="${uid}" `);
  if (start < 0) throw new Error(`SISO-REF-010: enum ${uid} not found`);
  const body = xml.slice(start, xml.indexOf("</enum>", start));
  const rows = {};
  for (const m of body.matchAll(
    /<enumrow value="(\d+)" description="([^"]*)"/g,
  ))
    rows[m[1]] = decode(m[2]);
  return rows;
}

/** Aggregate categories (echelons) are listed once, under the US land entry of cet 207. */
function aggregateCategories(xml) {
  const start = xml.indexOf('<cet uid="207" ');
  if (start < 0) throw new Error("SISO-REF-010: cet 207 not found");
  const body = xml.slice(start, xml.indexOf("</cet>", start));
  const rows = {};
  for (const m of body.matchAll(
    /<category value="(\d+)" description="([^"]*)"/g,
  ))
    rows[m[1]] = decode(m[2]);
  return rows;
}

export function parseSisoRef010(xmlFile, codeMappingsFile) {
  const xml = fs.readFileSync(xmlFile, "utf8");
  const title = /<ebv [^>]*title="([^"]*)"/.exec(xml)?.[1] ?? "";
  const date = /<ebv [^>]*date="([^"]*)"/.exec(xml)?.[1] ?? "";
  const names = {
    forceId: enumRows(xml, 6),
    kind: enumRows(xml, 7),
    platformDomain: enumRows(xml, 8),
    1.1: enumRows(xml, 9),
    1.2: enumRows(xml, 10),
    1.3: enumRows(xml, 11),
    1.4: enumRows(xml, 12),
    1.5: enumRows(xml, 13),
    munitionDomain: enumRows(xml, 14),
    munitionCategory: enumRows(xml, 15),
    aggregateKind: enumRows(xml, 206),
    aggregateCategory: aggregateCategories(xml),
    aggregateSubcategory: enumRows(xml, 208),
    aggregateSpecific: enumRows(xml, 209),
  };
  const alpha3to2 = new Map();
  const cm = JSON.parse(fs.readFileSync(codeMappingsFile, "utf8")).supplemental
    .codeMappings;
  for (const [a2, v] of Object.entries(cm))
    if (/^[A-Z]{2}$/.test(a2) && v._alpha3) alpha3to2.set(v._alpha3, a2);
  const countries = {};
  const issues = [];
  for (const [value, name] of Object.entries(enumRows(xml, 29))) {
    const a3 = /\(([A-Z]{3})\)\s*$/.exec(name)?.[1];
    if (!a3) continue;
    const a2 = alpha3to2.get(a3);
    if (!a2)
      issues.push(`country ${value} "${name}": no ISO alpha-2 for ${a3}`);
    else if (countries[a2] !== undefined)
      issues.push(`country ${value} "${name}": ${a2} already ${countries[a2]}`);
    else countries[a2] = Number(value);
  }
  return { title, date, names, countries, issues };
}
