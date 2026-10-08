// Converts every complete symbol of the MIL-STD-2525C SIDC tables (affiliation F, status P, no
// modifier; hierarchy-only rows that are not valid SIDCs are skipped) to each numeric target, in
// three modes, and tallies the outcome. Output feeds docs/limitations.md.
// Run: npx tsx scripts/coverage-report.ts
import catalog from "../src/data/mil-std-2525c-catalog.json";
import {
  convertSidc,
  validateSidc,
  type ConversionOptions,
  type SidcStandard,
} from "../src/index";

const targets: SidcStandard[] = [
  "MIL-STD-2525D",
  "APP-6D",
  "MIL-STD-2525E",
  "APP-6E",
];
const modes: [string, ConversionOptions][] = [
  ["strict (allowLossy)", { allowLossy: true }],
  ["+ extendedSidc", { allowLossy: true, extendedSidc: true }],
  ["+ fuzzy", { allowLossy: true, extendedSidc: true, fuzzy: true }],
];

const symbols: string[] = [];
for (const [t = ""] of catalog as string[][]) {
  const c = [...t];
  if (c[0] !== "W") {
    if (c[1] === "*") c[1] = "F";
    if (c[3] === "*") c[3] = "P";
    for (const i of [10, 11, 12, 13, 14])
      if (c[i] === "*") c[i] = i === 10 && t[10] === "H" ? "H" : "-";
  }
  const s = c.join("");
  if (validateSidc(s).valid && !symbols.includes(s)) symbols.push(s);
}
console.log(`complete 2525C symbols: ${symbols.length}\n`);
const pct = (n: number) => `${((100 * n) / symbols.length).toFixed(1)}%`;
console.log(
  "| Target | Mode | converted | exact | equivalent | lossy | approximate | ambiguous | unsupported |",
);
console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- |");
for (const target of targets) {
  for (const [label, opts] of modes) {
    const t: Record<string, number> = {};
    let ok = 0;
    for (const s of symbols) {
      const r = convertSidc(s, { ...opts, targetStandard: target });
      if (r.success) ok++;
      const k = r.success
        ? r.matchQuality
        : r.matchQuality === "ambiguous"
          ? "ambiguous"
          : "unsupported";
      t[k] = (t[k] ?? 0) + 1;
    }
    const f = (k: string) => String(t[k] ?? 0);
    console.log(
      `| ${target} | ${label} | ${ok} (${pct(ok)}) | ${f("exact")} | ${f("equivalent")} | ${f("lossy")} | ${f("approximate")} | ${f("ambiguous")} | ${f("unsupported")} |`,
    );
  }
}
