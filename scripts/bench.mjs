// Conversion speed on every complete 2525C symbol. Run: npm run build && node scripts/bench.mjs
const t0 = performance.now();
const m = await import("../dist/index.js");
const tImport = performance.now() - t0;
const catalog = (
  await import("../src/data/mil-std-2525c-catalog.json", {
    with: { type: "json" },
  })
).default;
const codes = [
  ...new Set(
    catalog.map(([t]) => t).filter((t) => t[0] !== "W" && !/^.-/.test(t)),
  ),
].map((t) => {
  const c = [...t];
  c[1] = "F";
  if (c[3] === "*") c[3] = "P";
  for (const i of [10, 11, 12, 13, 14]) if (c[i] === "*") c[i] = "-";
  if (c[0] === "G") c[14] = "X";
  return c.join("");
});
const time = (label, fn, n) => {
  const s = performance.now();
  for (let i = 0; i < n; i++) fn(i);
  const ms = performance.now() - s;
  console.log(
    `${label.padEnd(34)} ${((ms * 1000) / n).toFixed(1).padStart(8)} µs/op  (${n} ops, ${ms.toFixed(0)} ms)`,
  );
};
console.log(`import                             ${tImport.toFixed(0)} ms`);
let s = performance.now();
m.convertSidc(codes[0], { targetStandard: "MIL-STD-2525D" });
console.log(
  `first conversion                   ${(performance.now() - s).toFixed(1)} ms`,
);
for (const t of [
  "MIL-STD-2525D",
  "APP-6D",
  "MIL-STD-2525E",
  "APP-6E",
  "LEGACY-12",
])
  time(
    `convertSidc ${t}`,
    (i) =>
      m.convertSidc(codes[i % codes.length], {
        targetStandard: t,
        allowLossy: true,
      }),
    20000,
  );
time("validateSidc", (i) => m.validateSidc(codes[i % codes.length]), 20000);
time(
  "convertSidc 2525D fuzzy",
  (i) =>
    m.convertSidc(codes[i % codes.length], { fuzzy: true, allowLossy: true }),
  5000,
);
const nums = codes
  .slice(0, 500)
  .map((c) => m.convertSidc(c, { allowLossy: true }).output)
  .filter(Boolean);
s = performance.now();
m.convertNumericTo2525C(nums[0]);
console.log(
  `first reverse (builds index)       ${(performance.now() - s).toFixed(0)} ms`,
);
time(
  "convertNumericTo2525C",
  (i) => m.convertNumericTo2525C(nums[i % nums.length]),
  5000,
);
