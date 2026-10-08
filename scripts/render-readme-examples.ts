// Renders the README example table: 2525C inputs, their converted codes, and milsymbol SVGs of each.
// Run: npx tsx scripts/render-readme-examples.ts  (writes docs/images/*.svg, prints the table)
import fs from "node:fs";
import ms from "milsymbol";
import { convertSidc, type SidcStandard } from "../src/index";

const EXAMPLES = [
  "SFGPUCIC---E---",
  "SHAPMFB--------",
  "SNSPCLFF-------",
  "SFGPIXH---H----",
  "SHGPEVAT-------",
  "SPGPUCI--------",
];
const TARGETS: [SidcStandard, "2525" | "APP6"][] = [
  ["MIL-STD-2525D", "2525"],
  ["APP-6D", "APP6"],
  ["MIL-STD-2525E", "2525"],
];

const svg = (sidc: string, standard: "2525" | "APP6", file: string) => {
  file = file.toLowerCase();
  const sym = new ms.Symbol(sidc, { size: 30, standard });
  if (sym.isValid() !== true) throw new Error(`milsymbol cannot draw ${sidc}`);
  fs.writeFileSync(`docs/images/${file}.svg`, sym.asSVG());
  return `<img src="docs/images/${file}.svg" alt="${sidc}" height="40">`;
};

const rows: string[] = [];
rows.push(
  `| MIL-STD-2525C | Symbol | ${TARGETS.map(([t]) => `${t} | Symbol`).join(" | ")} |`,
);
rows.push(`| --- | --- | ${TARGETS.map(() => "--- | ---").join(" | ")} |`);
EXAMPLES.forEach((s, i) => {
  const cells = [`\`${s}\``, svg(s, "2525", `example${i + 1}-2525C`)];
  for (const [t, std] of TARGETS) {
    const r = convertSidc(s, { targetStandard: t });
    if (!r.success || !r.output) throw new Error(`${s} -> ${t} failed`);
    cells.push(
      `\`${r.output}\`<br>${r.matchQuality}`,
      svg(r.output, std, `example${i + 1}-${t.replace("MIL-STD-", "")}`),
    );
  }
  rows.push(`| ${cells.join(" | ")} |`);
});
console.log(rows.join("\n"));
