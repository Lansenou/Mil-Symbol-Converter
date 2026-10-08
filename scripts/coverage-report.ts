// Converts every symbol row of the MIL-STD-2525C tables (friend, present, no modifier) to each
// numeric target and tallies match quality. Output feeds docs/limitations.md.
// Run: npx tsx scripts/coverage-report.ts
import catalog from "../src/data/mil-std-2525c-catalog.json";
import { convertSidc, type SidcStandard } from "../src/index";

const targets: SidcStandard[] = [
  "MIL-STD-2525D",
  "APP-6D",
  "MIL-STD-2525E",
  "APP-6E",
];
const rows = (catalog as string[][]).filter(
  ([t]) =>
    (!/^[SGIOE]-/.test(t!) && !/^W.-/.test(t!.slice(0, 3))) || t![0] === "W",
);
const concrete = (t: string) => {
  if (t[0] === "W") return t;
  const c = [...t];
  if (c[1] === "*") c[1] = "F";
  if (c[3] === "*") c[3] = "P";
  if (c[10] === "*") c[10] = "-";
  for (const i of [11, 12, 13, 14]) if (c[i] === "*") c[i] = "-";
  return c.join("");
};
const symbols = rows.map(([t]) => concrete(t!)).filter((s) => !s.includes("*"));
console.log(
  `2525C table rows evaluated: ${symbols.length} (affiliation F, status P, no modifier)`,
);
for (const target of targets) {
  const tally: Record<string, number> = {};
  for (const s of symbols) {
    const r = convertSidc(s, { targetStandard: target, allowLossy: true });
    const k = r.success
      ? `${r.matchQuality}${r.confidence === "corroborated" ? " (corroborated)" : ""}`
      : `fail: ${r.matchQuality}`;
    tally[k] = (tally[k] ?? 0) + 1;
  }
  console.log(`\n${target}`);
  for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1]))
    console.log(`  ${k.padEnd(28)} ${v}`);
}
