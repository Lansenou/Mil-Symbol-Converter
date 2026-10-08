// Measures how often the fuzzy name matcher finds the right MIL-STD-2525D code, using symbols
// whose mapping is corroborated by both sources as ground truth. The matcher only sees the 2525C
// description and the plausible symbol sets, exactly as in production. The printed precision per
// tier is what src/converters/fuzzy.ts CALIBRATION records.
// Run: npx tsx scripts/calibrate-fuzzy.ts
import catalog from "../src/data/mil-std-2525c-catalog.json";
import { convertSidc, validateSidc } from "../src/index";
import {
  bestNameMatch,
  plausibleSymbolSets,
  TIERS,
} from "../src/converters/fuzzy";

const stats = TIERS.map(() => ({ n: 0, ok: 0 }));
let total = 0;
let unmatched = 0;
for (const [template = "", description = ""] of catalog as string[][]) {
  if (template[0] === "W") continue;
  const c = [...template];
  if (c[1] === "*") c[1] = "F";
  if (c[3] === "*") c[3] = "P";
  for (const i of [10, 11, 12, 13, 14])
    if (c[i] === "*") c[i] = i === 10 && template[10] === "H" ? "H" : "-";
  const sidc = c.join("");
  if (!validateSidc(sidc).valid) continue;
  const r = convertSidc(sidc, { targetStandard: "MIL-STD-2525D" });
  if (
    !r.success ||
    r.confidence !== "corroborated" ||
    r.matchQuality !== "exact"
  )
    continue;
  total++;
  const truth = r.output!.slice(4, 6) + r.output!.slice(10, 20);
  const m = bestNameMatch("2525D", plausibleSymbolSets(sidc), description);
  const i = m
    ? TIERS.findIndex((t) => m.score >= t.minScore && m.margin >= t.minMargin)
    : -1;
  if (!m || i < 0) {
    unmatched++;
    continue;
  }
  stats[i]!.n++;
  if (m.symbolSet + m.entity + "0000" === truth) stats[i]!.ok++;
}
console.log(`ground-truth symbols: ${total}; below every tier: ${unmatched}`);
console.log("tier  score>=  margin>=  matched  correct  precision");
TIERS.forEach((t, i) => {
  const v = stats[i]!;
  console.log(
    `${i}     ${String(t.minScore).padEnd(8)} ${String(t.minMargin).padEnd(9)} ${String(v.n).padEnd(8)} ${String(v.ok).padEnd(8)} ${(v.ok / Math.max(1, v.n)).toFixed(3)}`,
  );
});
