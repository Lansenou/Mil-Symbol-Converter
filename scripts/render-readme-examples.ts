// Renders the README example tables: 2525C inputs, their converted codes, and milsymbol SVGs.
// Every code, quality and name in the tables comes from running the converter.
// Run: npx tsx scripts/render-readme-examples.ts  (writes docs/images/*.svg, prints the tables)
import fs from "node:fs";
import ms from "milsymbol";
import {
  convertSidc,
  toRenderableSidc,
  type RenderOptions,
  type ConversionOptions,
  type CountryCode,
  type OrderOfBattle,
  type SymbolModifier,
  type ConversionResult,
  type SidcStandard,
} from "../src/index";

type Std = "2525" | "APP6";

const EXAMPLES = [
  "SFGPUCIC---E---", // modifier moves into sector 2 (arctic), echelon
  "SHAPMFB--------", // air
  "SNSPCLFF-------", // sea surface, neutral
  "SFGPIXH---H----", // installation
  "SHGPEVAT-------", // equipment
  "SPGPUCI--------", // pending (yellow, dashed)
  "SFGAUCI----F---", // planned/anticipated (dashed), battalion
  "SFGPUCI---AF---", // headquarters battalion
  "SHGPUCA---EE---", // task force company
];
// How the symbol.army 2525C list prints each symbol: its dash typography, always friend/present,
// "*****" tail. Checked below: with the input's modifier fields as options it converts like the
// input does once affiliation and status are friend/present.
const LIST_FORMS: Record<string, string> = {
  "SFGPUCIC---E---": "SFGPUCIC\u2013*****",
  "SHAPMFB--------": "SFAPMFB\u2014*****",
  "SNSPCLFF-------": "SFSPCLFF\u2013*****",
  "SFGPIXH---H----": "SFGPIXH\u2014H****",
  "SHGPEVAT-------": "SFGPEVAT\u2013*****",
  "SPGPUCI--------": "SFGPUCI\u2014*****",
  "SFGAUCI----F---": "SFGPUCI\u2014*****",
  "SFGPUCI---AF---": "SFGPUCI\u2014*****",
  "SHGPUCA---EE---": "SFGPUCA\u2014*****",
};
const tailOf = (s: string): ConversionOptions => ({
  symbolModifier: s.slice(10, 12) as SymbolModifier,
  countryCode: s.slice(12, 14) as CountryCode,
  orderOfBattle: s[14] as OrderOfBattle,
});
const asFriendPresent = (s: string) => `${s[0]}F${s[2]}P${s.slice(4)}`;
const TARGETS: [SidcStandard, Std][] = [
  ["MIL-STD-2525D", "2525"],
  ["APP-6D", "APP6"],
  ["MIL-STD-2525E", "2525"],
];

fs.mkdirSync("docs/images", { recursive: true });
for (const f of fs.readdirSync("docs/images"))
  if (f.endsWith(".svg")) fs.unlinkSync(`docs/images/${f}`);

const drawable = (sidc: string, standard: Std) =>
  new ms.Symbol(sidc, { standard }).isValid() === true;
const svg = (sidc: string, standard: Std, file: string) => {
  file = file.toLowerCase();
  const sym = new ms.Symbol(sidc, { size: 30, standard });
  if (sym.isValid() !== true) throw new Error(`milsymbol cannot draw ${sidc}`);
  fs.writeFileSync(`docs/images/${file}.svg`, sym.asSVG());
  return `<img src="docs/images/${file}.svg" alt="${sidc}" height="40">`;
};
const sub = (text: string | undefined) =>
  text ? `<br><sub>${text}</sub>` : "";
const targetName = (r: ConversionResult) =>
  [r.metadata?.entity?.split(" : ").pop(), ...(r.metadata?.modifiers ?? [])]
    .filter(Boolean)
    .join(", ");
const run = (s: string, t: SidcStandard, o: ConversionOptions = {}) =>
  convertSidc(s, { ...o, targetStandard: t });

// ---- Table 1: standards side by side
const t1: string[] = [];
t1.push(
  `| MIL-STD-2525C | symbol.army list | Symbol | ${TARGETS.map(([t]) => `${t} | Symbol`).join(" | ")} |`,
);
t1.push(`| --- | --- | --- | ${TARGETS.map(() => "--- | ---").join(" | ")} |`);
EXAMPLES.forEach((s, i) => {
  const first = run(s, "MIL-STD-2525D");
  const listed = LIST_FORMS[s];
  if (
    !listed ||
    run(listed, "MIL-STD-2525D", tailOf(s)).output !==
      run(asFriendPresent(s), "MIL-STD-2525D").output
  )
    throw new Error(`symbol.army form of ${s} does not convert like it`);
  const cells = [
    `\`${s}\`${sub(first.metadata?.legacyDescription)}`,
    `\`${listed}\`${sub(asFriendPresent(s) === s ? "" : "friend, present")}`,
    svg(s, "2525", `example${i + 1}-2525C`),
  ];
  for (const [t, std] of TARGETS) {
    const r = run(s, t);
    if (!r.success || !r.output) throw new Error(`${s} -> ${t} failed`);
    cells.push(
      `\`${r.output}\`<br>${r.matchQuality}${sub(targetName(r))}`,
      svg(r.output, std, `example${i + 1}-${t.replace("MIL-STD-", "")}`),
    );
  }
  t1.push(`| ${cells.join(" | ")} |`);
});

// ---- Table 2: harder cases
interface Case {
  input: string;
  target: SidcStandard;
  options: ConversionOptions;
  note: string;
}
const CASES: Case[] = [
  {
    input: "SFGPUCIC---EUS-",
    target: "MIL-STD-2525D",
    options: {},
    note: "Country code US has no field in the 20-digit code: strict mode refuses.",
  },
  {
    input: "SFGPUCIC---EUS-",
    target: "MIL-STD-2525D",
    options: { allowLossy: true },
    note: 'Accepted; `metadata.droppedFields` returns `{ countryCode: "US" }`.',
  },
  {
    input: "S*GPUCI---*****",
    target: "MIL-STD-2525D",
    options: {},
    note: "Template: positions 2, 11, 12 stand for many symbols, so no output.",
  },
  {
    input: "S*GPUCI---*****",
    target: "MIL-STD-2525D",
    options: { affiliation: "H", symbolModifier: "-E" },
    note: "Wildcards filled only from the values you pass.",
  },
  {
    input: "SFGPUCVRW------",
    target: "MIL-STD-2525D",
    options: {},
    note: "Modifier 74 means Antisubmarine Warfare in 2525D (2014) but Palletized Load System in Change 1.",
  },
  {
    input: "SFGPUCVRW------",
    target: "MIL-STD-2525D",
    options: { preferredSource: "JMSML" },
    note: "You choose which dataset to trust. Note milsymbol draws it as PLS: it uses the Change 1 meaning, which is why there is no default.",
  },
  {
    input: "SHGPUUSW-------",
    target: "MIL-STD-2525D",
    options: {},
    note: "Telephone switch was retired in 2525D; nothing is substituted.",
  },
  {
    input: "SFGPUUL--------",
    target: "MIL-STD-2525D",
    options: { fuzzy: true },
    note: "No mapping; name match with measured certainty.",
  },
  {
    input: "SFAPMFFI-------",
    target: "MIL-STD-2525D",
    options: { fuzzy: true, allowLossy: true },
    note: "No mapping; falls back to its 2525C parent (Fighter).",
  },
  {
    input: "SFAPMHA--------",
    target: "MIL-STD-2525E",
    options: { extendedSidc: true },
    note: "2525E common modifier Attack/Strike needs the 30-digit code.",
  },
];
const optText = (o: ConversionOptions) =>
  Object.keys(o).length === 0
    ? "default"
    : Object.entries(o)
        .map(([k, v]) => `\`${k}: ${JSON.stringify(v)}\``)
        .join("<br>");

const t2: string[] = [];
t2.push("| Input | Symbol | Target | Options | Result | Symbol | Why |");
t2.push("| --- | --- | --- | --- | --- | --- | --- |");
CASES.forEach((c, i) => {
  const r = run(c.input, c.target, c.options);
  const std: Std = c.target.startsWith("APP") ? "APP6" : "2525";
  const inSym = drawable(c.input, "2525")
    ? svg(c.input, "2525", `case${i + 1}-input`)
    : "—";
  const result = r.output
    ? `\`${r.output}\`<br>${r.matchQuality}${r.fuzzy ? ` (${r.fuzzy.method}, certainty ${r.fuzzy.certainty})` : ""}`
    : `no output<br>${r.matchQuality}`;
  const outSym = r.output ? svg(r.output, std, `case${i + 1}-output`) : "—";
  t2.push(
    `| \`${c.input}\`${sub(r.metadata?.legacyDescription)} | ${inSym} | ${c.target.replace("MIL-STD-", "")} | ${optText(c.options)} | ${result} | ${outSym} | ${c.note} |`,
  );
});

// Table 3: codes with missing fields, drawn as is and via toRenderableSidc.
const RENDER_CASES: { input: string; options: RenderOptions }[] = [
  { input: "S*G*UCMT--*****", options: {} },
  {
    input: "S*GPUCI---*****",
    options: { fallback: { affiliation: "Hostile" } },
  },
  {
    input: "SPG*UCMT\u2014*****",
    options: { fallback: { status: "Present" } },
  },
  { input: "SFGPUCIZE------", options: {} },
  {
    input: "SFGPUCVRW-*****",
    options: { targetStandard: "MIL-STD-2525D" },
  },
];
const t3: string[] = [];
t3.push(
  "| Input | milsymbol as is | Options | Result | Symbol | Filled / dropped |",
);
t3.push("| --- | --- | --- | --- | --- | --- |");
RENDER_CASES.forEach((c, i) => {
  const r = toRenderableSidc(c.input, c.options);
  if (!r.sidc) throw new Error(`no renderable SIDC for ${c.input}`);
  const asIs = drawable(c.input, "2525")
    ? svg(c.input, "2525", `render${i + 1}-input`)
    : "not drawn";
  const filled = r.filled
    .filter((f) => f.field !== "countryCode" && f.field !== "orderOfBattle")
    .map((f) => `${f.field} \`${f.value}\` (${f.from})`);
  const notes = [...filled, ...r.dropped].join("<br>") || "—";
  t3.push(
    `| \`${c.input}\` | ${asIs} | ${optText(c.options as ConversionOptions)} | \`${r.sidc}\`<br>${r.matchQuality} | ${svg(r.sidc, "2525", `render${i + 1}-output`)} | ${notes} |`,
  );
});

console.log(t1.join("\n"));
console.log("\n<!-- table 2 -->\n");
console.log(t2.join("\n"));
console.log("\n<!-- table 3 -->\n");
console.log(t3.join("\n"));
