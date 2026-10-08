# Limitations and coverage

## Coverage

`npx tsx scripts/coverage-report.ts` converts every row of the 2525C SIDC tables (2,198 rows,
including hierarchy-only rows) with affiliation F, status P and no modifier. With `allowLossy: true`:

| Target             | exact                      | equivalent | lossy | ambiguous | unsupported/invalid |
| ------------------ | -------------------------- | ---------- | ----- | --------- | ------------------- |
| MIL-STD-2525D (10) | 1,861 (1,725 corroborated) | 2          | 44    | 46        | 245                 |
| APP-6D             | 6                          | 1,560      | 46    | 38        | 548                 |
| MIL-STD-2525E (15) | 1                          | 1,549      | 40    | 31        | 577                 |
| APP-6E (16)        | 0                          | 1,100      | 39    | 24        | 1,035               |

For 2525D, the 245 failures break down as 72 hierarchy-only rows that are not complete SIDCs
(e.g. `GF------------X`), 129 rows that neither source maps (mostly hierarchy nodes such as
`WEAPON`), and 44 rows whose only mapping is retired or not in the target catalog. Of the 46 ambiguous
rows, 38 are rows where the sources propose different codes and 8 are rows where the same digits carry
different meanings (see below).

## Known limitations

- **Input is MIL-STD-2525C only.** 2525B Change 2 codes that 2525C dropped, and APP-6(A)/(B) codes
  that differ from 2525C, are not recognized. No numeric→letter conversion is provided.
- **APP-6(C) output is not supported.** It shares version `10` with 2525D/APP-6D and no APP-6(C)
  catalog was available.
- **APP-6(D), APP-6(E), 2525E are checked against mil-sym-ts catalogs, not the standards.** Results
  are `equivalent` at best. 2525E is emitted with version `15` (Change 1); version `13` (2525E base) is
  never emitted because no base-2525E catalog was available.
- **SIGINT (symbol sets 50-54)** has no APP-6D entries in mil-sym-ts, and 2525E requires the 30-digit
  form (frame shape digit), so SIGINT converts to 2525D only.
- **2525E common modifiers** (3-digit codes that need digits 21-22) are out of scope; mappings that need
  them are unsupported.
- **Contested codes.** Land unit sector-1 modifiers 47, 56, 58, 71-74 changed meaning between 2525D
  (2014) and 2525D Change 1 and are disputed for APP-6D (`src/data/contested-codes.json`).
  Conversions that need them are `ambiguous` unless `preferredSource` is set (2525D/2525D Ch.1), and
  always `ambiguous` for APP-6D.
- **Name comparison is heuristic.** Catalog names are compared word-wise on their most specific
  segment. A real rename such as "PSYOP" → "MISO" is treated as a different meaning (conservative), and
  a few genuine rewordings stay `ambiguous`.
- **Country code and order of battle** have no numeric field; they are reported in
  `metadata.droppedFields` so callers can move them into text amplifiers.
- **METOC status** is set to `0` because 2525C METOC codes have none (info diagnostic).
- **Tactical-graphic status `K` (known)** is unsupported; **`S` (suspected)** is lossy.
- **Bundle size.** The mapping and catalog tables make the bundle about 680 KB (unminified). The core
  has no runtime dependencies.
- **Fixtures** (`tests/fixtures/verified-sidcs.json`): 42 numeric 2525D pairs were checked line by
  line against the 2525C and 2525D texts; the APP-6D/2525E/APP-6E fixtures are dataset-verified only.
