# Limitations and coverage

## Coverage

`npx tsx scripts/coverage-report.ts` converts every complete symbol of the 2525C SIDC tables
(2,093 SIDCs with affiliation F, status P and no modifier; hierarchy-only rows that are not valid
SIDCs are left out) in three modes. "Converted" counts successful results; `allowLossy` is on.

| Target        | Mode                | converted    | exact | equivalent | lossy | approximate | ambiguous | unsupported |
| ------------- | ------------------- | ------------ | ----- | ---------- | ----- | ----------- | --------- | ----------- |
| MIL-STD-2525D | strict (allowLossy) | 1875 (89.6%) | 1830  | 2          | 43    | 0           | 45        | 173         |
| MIL-STD-2525D | + extendedSidc      | 1875 (89.6%) | 1830  | 2          | 43    | 0           | 45        | 173         |
| MIL-STD-2525D | + fuzzy             | 2003 (95.7%) | 1830  | 2          | 104   | 67          | 11        | 79          |
| APP-6D        | strict (allowLossy) | 1588 (75.9%) | 6     | 1531       | 51    | 0           | 37        | 468         |
| APP-6D        | + extendedSidc      | 1588 (75.9%) | 6     | 1531       | 51    | 0           | 37        | 468         |
| APP-6D        | + fuzzy             | 1721 (82.2%) | 6     | 1531       | 133   | 51          | 11        | 361         |
| MIL-STD-2525E | strict (allowLossy) | 1568 (74.9%) | 1     | 1528       | 39    | 0           | 29        | 496         |
| MIL-STD-2525E | + extendedSidc      | 1640 (78.4%) | 1     | 1589       | 50    | 0           | 32        | 421         |
| MIL-STD-2525E | + fuzzy             | 1885 (90.1%) | 1     | 1589       | 218   | 77          | 10        | 198         |
| APP-6E        | strict (allowLossy) | 1127 (53.8%) | 0     | 1089       | 38    | 0           | 24        | 942         |
| APP-6E        | + extendedSidc      | 1201 (57.4%) | 0     | 1152       | 49    | 0           | 27        | 865         |
| APP-6E        | + fuzzy             | 1477 (70.6%) | 0     | 1152       | 272   | 53          | 9         | 607         |

- **strict**: documented mappings only (`exact`, `equivalent`, `lossy`).
- **+ extendedSidc**: also emits 30-digit 2525E/APP-6E codes when a modifier only exists there as a
  common modifier.
- **+ fuzzy**: approximate results for the remaining failures (see below). `approximate` results are
  best guesses; `lossy` ones in this mode are mostly ancestor fallbacks (a correct but broader symbol).

What remains unsupported is mostly symbols without any counterpart in the target catalog (e.g. APP-6E
has no METOC symbol sets in mil-sym-ts), retired symbols without a mapped ancestor, and SIGINT for
APP-6D/2525E.

### Fuzzy certainty

`certainty` of name-based results is the measured precision of the name matcher, not an estimate:
`npx tsx scripts/calibrate-fuzzy.ts` runs it on the 1,391 symbols whose 2525D mapping both sources
agree on and counts how often each score tier picks exactly the right code.

| Tier | Score ≥ | Margin ≥ | Matched | Correct | Precision (= certainty) |
| ---- | ------- | -------- | ------- | ------- | ----------------------- |
| 0    | 0.9     | 0.1      | 499     | 468     | 0.938                   |
| 1    | 0.7     | 0.2      | 82      | 61      | 0.744                   |
| 2    | 0.8     | 0.05     | 93      | 33      | 0.355                   |
| 3    | 0.6     | 0.1      | 121     | 51      | 0.421                   |
| 4    | 0.5     | 0        | 371     | 106     | 0.286                   |

The default `minCertainty` of 0.7 therefore admits tiers 0 and 1 only. The calibration set consists
of symbols that _do_ have mappings; the symbols fuzzy mode is used for are harder, so the real
precision on them is probably lower. Treat `approximate` output as a suggestion to review.

## Render check

`tests/render.test.ts` draws every converted code with milsymbol (all four numeric targets, with
`fuzzy`, `extendedSidc` and `allowLossy` on) and fails if milsymbol can draw the 2525C input but not
the output. This is a sanity check, not proof of equivalence: it catches codes with no icon, not
codes with the wrong icon. milsymbol only draws point symbols, so line/area tactical graphics are not
checked, and two known renderer gaps are excluded with their reason: numeric atmospheric/oceanographic
icons (symbol sets 45/46) and the Dummy Minefield / Bridge or Gap control measures.

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
