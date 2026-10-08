// Maintainer tool for building tests/fixtures/verified-sidcs.json by hand.
// Prints the MIL-STD-2525C table row for a 2525C template and the MIL-STD-2525D table rows for a
// proposed numeric code, straight from the text layer of the standards (see fetch-sources.sh),
// so a reviewer can confirm both describe the same symbol. It never calls the converter.
//
// Usage: node scripts/review-fixture.mjs <2525C SIDC> <symbolSet> <entity6> [mod1] [mod2]
import fs from "node:fs";

const [sidc, ss, entity, m1 = "00", m2 = "00"] = process.argv.slice(2);
const C = fs.readFileSync(".sources/standards/MIL-STD-2525C.txt", "utf8").split("\n");
const D = fs.readFileSync(".sources/standards/MIL-STD-2525D.txt", "utf8").split("\n");

// 2525C: rows are laid out as "<hierarchy> <scheme> <si> <dim> <status> <fn fn fn> <mod> <cc> <ob> <desc>"
const fn = sidc.slice(4, 10);
const rowRe = new RegExp(
  `^\\s*\\S+\\s+${sidc[0]}\\s+\\S\\s+\\${sidc[2]}\\s+\\S\\s+${fn.slice(0, 2).replace(/-/g, "\\-")}\\s+${fn
    .slice(2, 4)
    .replace(/-/g, "\\-")}\\s+${fn.slice(4, 6).replace(/-/g, "\\-")}\\s`,
);
console.log(`== MIL-STD-2525C rows for ${sidc[0]} ${sidc[2]} ${fn}`);
C.forEach((l, i) => {
  if (rowRe.test(l)) console.log(`  line ${i + 1}: ${l.trim().replace(/\s+/g, " ")}`);
});

// 2525D: Appendix A tables list "<name> ... <code>"; find table headers for the symbol set.
const SETS = {
  "01": "Air", "02": "Air missile", "05": "Space", "06": "Space missile", "10": "Land unit",
  "11": "Land civilian", "15": "Land equipment", "20": "Land installation", "25": "Control measure",
  "30": "Sea surface", "35": "Sea subsurface", "36": "Mine warfare", "40": "Activities",
  "45": "Atmospheric", "46": "Oceanographic", "50": "Signals Intelligence", "51": "Signals Intelligence",
  "52": "Signals Intelligence", "53": "Signals Intelligence", "54": "Signals Intelligence", "60": "Cyberspace",
};
const setName = SETS[ss];
let table = "";
const hits = [];
for (let i = 0; i < 12000 && i < D.length; i++) {
  const l = D[i];
  const h = /TABLE A-[IVXL]+\.\s+(.*)$/.exec(l);
  if (h) table = h[1].trim();
  if (!table.toLowerCase().startsWith((setName ?? "~").toLowerCase())) continue;
  const isEntityTable = /entity/i.test(table);
  if (isEntityTable && new RegExp(`\\b${entity}\\s*$`).test(l)) hits.push(`  [${table}] line ${i + 1}: ${l.trim().replace(/\s{2,}/g, " | ")}`);
  if (/sector 1 modifier/i.test(table) && m1 !== "00" && new RegExp(`\\s${m1}\\s*$`).test(l)) hits.push(`  [${table}] line ${i + 1}: ${l.trim().replace(/\s{2,}/g, " | ")}`);
  if (/sector 2 modifier/i.test(table) && m2 !== "00" && new RegExp(`\\s${m2}\\s*$`).test(l)) hits.push(`  [${table}] line ${i + 1}: ${l.trim().replace(/\s{2,}/g, " | ")}`);
}
console.log(`== MIL-STD-2525D Appendix A rows for symbol set ${ss} (${setName}) entity ${entity} mod1 ${m1} mod2 ${m2}`);
console.log(hits.join("\n") || "  (none found)");
// Parent rows give the full hierarchy of an entity subtype.
if (entity.slice(4) !== "00") console.log("  (parent entity type " + entity.slice(0, 4) + "00; run again to show it)");
