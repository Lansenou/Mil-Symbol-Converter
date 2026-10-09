# Conversion rules

Every rule below is implemented in `src/` and covered by tests in `tests/`.

## 1. Input

1. The input must be a string (anything else: `INVALID_TYPE`). Only A-Z, 0-9, `-`, `*` are allowed.
   Characters are checked **before** case mapping, because `toUpperCase()` can change the length of
   non-ASCII text. Typographic dashes (`—`) get a specific hint.
2. Lowercase and surrounding whitespace are normalized with a warning; `strictInput: true` rejects them.
   Two conventions of web symbol lists are also undone (warnings, rejected by `strictInput`):
   - `—` is read as `---` (web lists) or `--` (phone keyboards turn a typed `--` into `—`), `–` as
     `--` or `-`. A reading is used only if it is the only one giving 15 characters, or the only
     one of those naming a 2525C table row (`TYPOGRAPHIC_DASHES_REPAIRED`).
   - A `*` in positions 11-15 where the matching 2525C table row has a fixed value is replaced by it:
     the `X` of tactical graphics, the installation `H`, the METOC graphic type and unused tail
     (`FIXED_POSITIONS_FILLED`). Only done when every table row that fits the input agrees on the
     value; `WO-DHCF--*****` stays invalid because Foreshore exists as point, line and area.
3. Exactly 15 characters. Shorter forms (10- or 12-character prefixes) are rejected: positions are
   never guessed.
4. Field values are checked against the table of the coding scheme in position 1
   (`src/legacy/fields.ts`, transcribed from 2525C Tables A-I…G-II).
5. Combinations ruled out by the tables are errors: an installation row requires `H` in position
   11; `H` is invalid for non-installations; SIGINT positions 11-12 must be `--`; tactical graphics
   only take echelons; emergency-management symbols take no echelons.
6. A well-formed code missing from the 2525C SIDC tables is a warning (`NOT_IN_2525C_TABLES`), not an
   error; it will normally fail later for lack of a mapping.

## 2. Wildcards (`src/wildcard.ts`, `src/converters/prepare.ts`)

- `*` is accepted only in user-defined positions (2, 4, 11-15; for G 2, 4, 11-14; none for METOC).
- It is replaced **only** by a value passed explicitly (`affiliation`, `status`, `symbolModifier`,
  `countryCode`, `orderOfBattle`). Nothing is defaulted, and concrete characters are never
  overridden (`OPTION_IGNORED`).
- Substituted values are validated again with the same rules as the input.
- `wildcardPolicy`:
  - `resolve` (default): substitute supplied values; numeric targets need positions 2, 4 and 11-12
    (2 and 4 for SIGINT) concrete, otherwise the result is `ambiguous` and `ambiguousPositions` lists
    them. Wildcards left in 13-15 are allowed because the numeric SIDC has no such field (warning).
  - `preserve`: no substitution; works for `LEGACY-12`, fails for numeric targets.
  - `reject`: any `*` is an error.

## 3. 12-character form (`src/converters/legacy-12.ts`)

Profile `prefix-12`: output = positions 1-12. `exact` when positions 13-15 hold nothing (`-`, `*`,
or the fixed `X` of tactical graphics); `lossy` when they hold a country code, an order of battle or
(METOC) a graphic-type character. Unknown profile names are `unsupported`.

## 4. Numeric conversion (`src/converters/numeric.ts`)

### Field digits (`src/converters/field-mapping.ts`)

| Letter position              | Numeric digits | Rule                                                                | Source                               |
| ---------------------------- | -------------- | ------------------------------------------------------------------- | ------------------------------------ |
| 2 standard identity          | 3-4            | letter → context+identity, e.g. `F`→`03`, `D`→`13`, `J`→`15`        | JMSML `<LegacyStandardIdentityCode>` |
| 2 METOC category             | 3-4            | `A`/`O`/`S` → `00`                                                  | JMSML affiliations `REALITY_METOC_*` |
| 4 status                     | 7              | `P`0 `A`1 `C`2 `D`3 `X`4 `F`5                                       | JMSML `<LegacyStatusCode>`           |
| 4 tactical graphic `S`       | 7              | → `1` "Planned/Anticipated/Suspect", **lossy**                      | 2525D Table A-IV wording             |
| 4 tactical graphic `K`       | —              | **unsupported**                                                     | no source                            |
| METOC (no status)            | 7              | `0`, info diagnostic                                                | mil-sym-ts default                   |
| 11 HQ/TF/FD                  | 8              | `A`2 `B`6 `C`3 `D`7 `E`4 `F`1 `G`5                                  | JMSML `<LegacyHQTFDummyCode>`        |
| 11-12 `HB`                   | 8              | `1` feint/dummy                                                     | 2525C Table A-II + 2525D Table A-V   |
| 12 echelon                   | 9-10           | `A`11 … `H`18, `I`21 … `N`26 (also for G per Table B-II)            | JMSML `<LegacyModifierCode>`         |
| 11-12 mobility / towed array | 9-10           | `MO`31 … `MY`52, `NS`61 `NL`62 (mobility also for E per Table G-II) | JMSML                                |
| 13-14, 15                    | —              | no numeric field; **lossy** when present                            | 2525D Figure A-1                     |

### Symbol (digits 5-6 and 11-20)

1. Every registered `MappingAdapter` (`src/adapters/symbology-adapter.ts`) reports what its source maps
   the symbol to and which catalog edition defines that answer (JMSML → 2525D; mil-sym-ts → 2525D
   Change 1, or APP-6D/2525E for a few rows).
2. Each candidate is checked against the **target edition's catalog**: the entity and both modifiers
   must exist there, and the target's name must match the source's name for the same code
   (`compareNames`: `same`, `renamed` = same wording of the most specific segment, or `different`).
   `different` rejects the candidate.
3. Outcome:
   - no valid candidate → `unsupported` (`NO_MAPPING`, `NO_VALID_MAPPING`; reasons as info diagnostics);
   - valid candidates with different codes → `ambiguous` (`SOURCES_DISAGREE`) unless `preferredSource`;
   - a source proposes the same digits with a different meaning → `ambiguous`
     (`SOURCES_DISAGREE_ON_MEANING`) unless `preferredSource`;
   - a code listed in `contested-codes.json` for the target edition → `ambiguous` (`CONTESTED_CODE`).
4. Match quality of a successful mapping:
   - `exact` if a source native to the target edition supports it, otherwise `equivalent`;
   - downgraded to `lossy` if a source says the 2525C symbol was retired, if the source maps several
     2525C symbols to the same code and this one is not the general one of the group (its function
     ID is not a prefix of the others), if a field mapping is lossy, or if country code / order of
     battle are dropped.
   - `confidence: "corroborated"` when two sources agree, `"single-source"` otherwise (with a warning).
5. `allowLossy` defaults to `false`: a lossy result has `success: false`, `output: null`, and the
   rejected code in `candidates`.
6. The output is assembled as a string and must match `/^\d{20}$/`.

### Targets

| Target                                    | Version digits  | Catalog checked        | Best possible quality                                      |
| ----------------------------------------- | --------------- | ---------------------- | ---------------------------------------------------------- |
| `MIL-STD-2525D`                           | `10` (default)  | JMSML 2525D            | exact                                                      |
| `MIL-STD-2525D` + `mil2525dVersion: "11"` | `11`            | mil-sym-ts 2525D Ch.1  | exact                                                      |
| `APP-6D`                                  | `10`            | mil-sym-ts APP-6D      | equivalent (exact only for rows mil-sym-ts maps to APP-6D) |
| `MIL-STD-2525E`                           | `15` (Change 1) | mil-sym-ts 2525E Ch.1  | equivalent                                                 |
| `APP-6E`                                  | `16` (Change 2) | mil-sym-ts APP-6E Ch.2 | equivalent                                                 |
| `APP-6C`                                  | —               | none                   | unsupported                                                |

## 5. Renumbered codes and the extended SIDC

If a candidate's entity or modifier is missing from the target catalog, or means something else
there, the target entry with the **identical name** is used when it is unique (entities: same name, or
the same last two name segments word for word, plurals and punctuation aside, so "Utility Vehicle :
Bus" matches "Utility Vehicles : Bus" but "Tank Recovery Vehicle : Heavy" does not match "Tank :
Heavy"; modifiers: same name, either sector). This is reported as `RENUMBERED` and the result is at most `equivalent`.

2525E moved many modifiers into a shared list of _common modifiers_ that need the 30-digit SIDC:
position 21 (sector 1) or 22 (sector 2) holds the indicator `1`, position 23 the frame shape (`0`,
default for the symbol set), 24-30 are `0` (encoding of mil-sym-ts `SymbolID`). This is only emitted
with `extendedSidc: true`.

## 6. Fuzzy mode (`fuzzy: true`, `src/converters/fuzzy.ts`)

Runs only when the strict conversion failed for lack of a mapping (`NO_MAPPING`, `NO_VALID_MAPPING`)
or because sources disagree (`SOURCES_DISAGREE`, `SOURCES_DISAGREE_ON_MEANING`). Never for invalid
input, unresolved wildcards, contested codes or blocked lossy results. In order:

1. **source-choice**: of the disagreeing candidates, the one whose target name best matches the 2525C
   description → `approximate`.
2. **name-match**: best entity in the plausible symbol sets of the target catalog for the 2525C
   description (word overlap, Dice coefficient) → `approximate`; modifiers are not guessed.
3. **ancestor**: nearest 2525C parent (shorter function ID) with a strict mapping → `lossy`
   (a documented but broader symbol), certainty 1; accepted with `fuzzy` unless `allowLossy: false`.

Steps 1-2 need a calibrated `certainty` ≥ `minCertainty` (default 0.7); see docs/limitations.md for
the calibration. Fuzzy results carry `fuzzy: { method, certainty, basis }` and
`mappingSource: "fuzzy:<method>"`.

## 7. Numeric → 2525C (`src/converters/reverse.ts`)

`convertNumericTo2525C(code, options)` (or `convertSidc` with a numeric `sourceStandard` and
`targetStandard: "MIL-STD-2525C"`) has no table of its own. The forward converter decides:

1. Version digits pick the edition (10 → 2525D, or APP-6D with `sourceStandard: "APP-6D"`; 11, 15,
   16). Versions 12-14, simulation context and 30-digit codes with frame shape or Set C content are
   unsupported.
2. An index of what every 2525C table entry converts to (built once per edition) proposes table
   entries for the symbol part (symbol set, entity, modifiers, common-modifier flags).
3. Each entry is instantiated with the letters for the standard identity, status and every
   modifier pair the scheme allows, and **converted forward**. Only candidates that reproduce the
   input exactly are accepted, so source disagreements, contested codes and renumbering are honoured
   in both directions.
4. The best forward quality wins. If only candidates whose forward mapping is lossy remain (more
   specific 2525C symbols merged into this code), the result is `ambiguous`: choosing one would add
   detail the numeric code does not carry. Symbols the 2525C tables list twice (same description)
   resolve to the first listing, with an info diagnostic.
5. Country code and order of battle are added only when passed as options.

## 8. Results

`success` is true only when there is no error and an output; `ambiguous` and `unsupported` never have
an output. Every message also appears as a structured `diagnostics` entry with a stable `code` and the
SIDC positions involved.
