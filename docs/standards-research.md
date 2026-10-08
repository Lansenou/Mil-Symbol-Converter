# Standards research

This page records what was checked before implementing the converter, where each fact comes from,
and which questions stayed open. "Verified" means read in the cited document or source file;
"inferred" is marked as such.

## Sources

| Source                                                                               | What it is                                                                  | Licence                         | Pinned version                              |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------- |
| MIL-STD-2525C, 17 Nov 2008                                                           | US DoD standard, letter SIDCs                                               | Distribution A (public release) | `ms2525c.pdf`, sha256 `701a34c9…0c612`      |
| MIL-STD-2525D, 10 Jun 2014                                                           | US DoD standard, numeric SIDCs                                              | Distribution A                  | `MilStd2525D.pdf`, sha256 `07ef84ea…83ce`   |
| [Esri JMSML](https://github.com/Esri/joint-military-symbology-xml)                   | XML model of 2525D / APP-6(C) with `<LegacySymbol>` links to 2525C          | Apache-2.0                      | commit `094e7647`                           |
| [mil-sym-ts](https://github.com/missioncommand/mil-sym-ts)                           | US Army C5ISR renderer: `c2d.json` (2525C→2525D Ch.1), per-edition catalogs | Apache-2.0                      | commit `9f3c5512`                           |
| [milsymbol](https://github.com/spatialillusions/milsymbol)                           | Renderer for letter and numeric SIDCs                                       | MIT                             | commit `f5134380` (reference only)          |
| [@orbat-mapper/convert-symbology](https://github.com/orbat-mapper/convert-symbology) | 2525C↔2525D converter                                                       | MIT                             | 1.0.2 (dev dependency for comparison tests) |

`scripts/fetch-sources.sh` downloads exactly these versions and checks the PDF hashes.
[symbol.army](https://www.symbol.army/) was read for orientation only; nothing was scraped from it.

## The 15-character letter SIDC (MIL-STD-2525B/C, APP-6(A)/(B))

Verified in 2525C §A.5.2 and Tables A-I, B-I, C-I, D-I, E-I, G-I:

| Positions | S (warfighting)              | G (tactical graphics)  | W (METOC)            | I (SIGINT)        | O (stability ops)     | E (emergency mgmt)    |
| --------- | ---------------------------- | ---------------------- | -------------------- | ----------------- | --------------------- | --------------------- |
| 1         | scheme                       | scheme                 | scheme               | scheme            | scheme                | scheme                |
| 2         | standard identity            | standard identity      | category A/O/S       | standard identity | standard identity     | standard identity     |
| 3         | battle dimension             | category               | static/dynamic (3-4) | battle dimension  | category              | category              |
| 4         | status A P C D X F           | status A **S** P **K** | (static/dynamic)     | status            | status                | status A P            |
| 5-10      | function ID                  | function ID            | function ID          | function ID       | function ID           | function ID           |
| 11-12     | symbol modifier (Table A-II) | echelon (Table B-II)   | graphic type (11-13) | not used          | modifier (Table E-II) | modifier (Table G-II) |
| 13-14     | country code (ISO 3166-1)    | country code           | not used (14-15)     | country code      | country code          | country code          |
| 15        | order of battle A E C G N S  | always `X`             | not used             | order of battle   | order of battle       | order of battle       |

Points that matter for conversion:

- **The meaning of a position depends on the coding scheme.** METOC position 2 is a category,
  not an affiliation; tactical graphics have statuses S (suspected) and K (known) that the other
  schemes lack. The validator applies the table of the scheme in position 1.
- **`-` and `*` are different.** "A dash (-) is used to fill each unused position. An asterisk
  (\*) indicates positions that are user-defined based on specific symbol circumstances, such as
  standard identity or echelon/mobility" (§A.5.2.1, repeated in each appendix). The SIDC tables
  print templates such as `S*G*UCI---*****`: `*` means "fill in a value", not "none".
- **Where `*` may appear** (read from the tables): positions 2, 4, 11-15 for S, I, O, E;
  2, 4, 11-14 for G (15 is the fixed `X`); nowhere for METOC. `*` in a function ID is not a valid
  template character.
- **Installations** carry a fixed `H` in position 11 of their table row (`S*G*IXH---H****`);
  `HB` is "feint dummy installation" (Table A-II, E-II).
- **Obsolete 2525B modifiers** (`K-`, `MF`, `MH`, `MM`, `S-`, still mapped by convert-symbology) are
  not in 2525C Table A-II and are rejected.

### Is `S*GPUCI---*****` a legitimate template?

Yes, with one caveat. 2525C Table A-III prints INFANTRY as `S*G*UCI---*****` (status `*`).
JMSML labels and symbol.army show the same row with a concrete `P` in position 4 (`S*GPUCI---*****`),
which is a valid template with status fixed to Present. It leaves standard identity (14 values),
symbol modifier (135 values in Table A-II), country code and order of battle unspecified. It has
**no unique numeric counterpart**: the numeric SIDC needs concrete standard identity, HQ/TF/dummy and
amplifier digits. Country code and order of battle have no numeric field at all.

## Is there a 12-character SIDC standard?

**No standard defines one** (verified: 2525B/C and the APP-6(A)/(B)-based tables define 15
characters; 2525D/E and APP-6(C)/(D)/(E) define 20 or 30 digits). Searches found no other
12-character convention.

What exists is a library convention:

- milsymbol `src/lettersidc/metadata.js` reads positions 1-12 and has the country-code and
  order-of-battle reads commented out, so a 12-character string renders the same as the 15-character one.
- @orbat-mapper/convert-symbology reads positions 1-12 and its tests pass 12-character input
  (`"SFGPUCI-----"`).
- JMSML and convert-symbology key their lookup tables on the first 10 characters (with positions 2
  and 4 masked). That is an internal key, not an exchange format.

The library therefore implements one named profile, `prefix-12` = positions 1-12. Removing 13-15
drops the country code and order of battle (and, for METOC, the last graphic-type character), so the
operation is reported as **lossy whenever those positions carry information**. It is a truncation for
renderers that accept it, not a conversion between standards. A "12-digit numeric" identifier was not
found in any standard either; the 20-digit numeric SIDC is a different format altogether.

## The 20-digit numeric SIDC (2525D/E, APP-6(C)/(D)/(E))

Verified in 2525D Appendix A, Figure A-1 and Tables A-I to A-VI:

```
digits 1-2   version             10 = 2525D (Table A-I)
digit  3     context             0 reality, 1 exercise, 2 simulation
digit  4     standard identity   0 pending … 6 hostile/faker
digits 5-6   symbol set          10 land unit, 01 air, 25 control measure, …
digit  7     status              0 present, 1 planned/anticipated/suspect, 2-5 operational condition
digit  8     HQ/task force/dummy 0-7
digits 9-10  amplifier           echelon (1x, 2x), mobility (3x-5x), towed array (6x)
digits 11-16 entity / type / subtype
digits 17-18 sector 1 modifier
digits 19-20 sector 2 modifier   (digits 21-30: optional extension)
```

The fields do **not** correspond one-to-one with the letter SIDC: battle dimension + function ID
become symbol set + entity; one letter (e.g. `UCIC` "infantry arctic") can become an entity plus a
modifier (`121100` + sector-2 `02`); and exercise affiliations (`D`, `J`, …) split into context and
identity digits. Field-level codes (standard identity, status, HQ/TF/dummy, echelon/mobility) are
taken from JMSML `Base.xml`, which cross-references 2525C letters to the 2525D tables.

### Version digits

| Digits | Meaning                                                                                | Source                                               |
| ------ | -------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 10     | 2525D; also used for APP-6(D) (and APP-6(C), per JMSML "No changes to APP-6(C)/2525D") | 2525D Table A-I; mil-sym-ts `SymbolID.Version_APP6D` |
| 11     | 2525D Change 1                                                                         | mil-sym-ts `Version_2525Dch1`                        |
| 13     | 2525E (deprecated by mil-sym-ts in favour of 15)                                       | mil-sym-ts; milsymbol-sidc                           |
| 15     | 2525E Change 1                                                                         | mil-sym-ts `Version_2525Ech1`                        |
| 16     | APP-6(E) Change 2                                                                      | mil-sym-ts `Version_APP6Ech2`                        |

Inferred: the same code `10` is shared by three standards, so the version digits alone do not tell
2525D from APP-6(D).

## APP-6(D) is not interchangeable with 2525D

Verified evidence:

1. **The same digits mean different things.** Land unit sector-1 modifiers 47, 56, 58, 71-74:
   2525D (2014) Table A-XX lists _Node Center, Sensor Control Module, Single Shelter Switch,
   Accident, Other, Civilian, Antisubmarine Warfare_; mil-sym-ts (2525D Change 1, and also tagged
   APP-6D) lists _UAS, Weapons, Armored, Mobility Assault, Amphibious Warfare Ship, Load Handling
   System, Palletized Load System_; milsymbol uses the first set for APP-6 and the second for 2525.
   The APP-6(D) meaning cannot be settled without the APP-6(D) text, so these codes are listed in
   `src/data/contested-codes.json` and never emitted for APP-6D.
2. **Coverage differs.** mil-sym-ts has no SIGINT symbol sets (50-54) for version 10 (APP-6D);
   94 entity codes exist only for APP-6D and 247 only for 2525D Change 1.
3. **Names differ** for some shared codes (e.g. "PSYOPS" vs "MISO").

APP-6(D) itself (Edition D Version 1, Oct 2017) is a NATO publication that was not available, so APP-6D
results are checked against the mil-sym-ts APP-6D catalog and are never labelled better than
`equivalent`. The same applies to 2525E and APP-6(E).

## Existing converters

|                      | @orbat-mapper/convert-symbology 1.0.2                                                          | mil-sym-ts `C2DLookup`                        | milsymbol                 |
| -------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------- |
| API                  | `convertLetterSidc2NumberSidc(sidc) → {sidc, success, match}` (`exact/partial/closest/failed`) | `getDCode(sidc) → string \| null` (30 digits) | renders, does not convert |
| Data                 | JMSML `All_ID_Mapping_Latest.csv` + manual overrides (1,941 rows)                              | own `c2d.json` (1,955 rows, 2525D Ch.1)       | n/a                       |
| Wildcards            | replaces `*` with `-`; missing identity → Friend, missing status → Present                     | uses `*` only in its table keys               | ignores                   |
| Unknown symbol       | "closest" match by shortening the function ID                                                  | `null`                                        | n/a                       |
| Country/OB           | silently dropped                                                                               | optional country to Set C                     | ignored                   |
| APP-6                | treats APP-6 C/D as the same as 2525C/D                                                        | separate catalogs per version                 | separate icon branches    |
| Licence, maintenance | MIT, active (2026)                                                                             | Apache-2.0, active (2026)                     | MIT, active (2026)        |

Cross-check of the two mapping tables over 2,039 keys: 1,739 agree, 160 disagree (mostly sector
modifiers that moved between 2525D and Change 1, e.g. air assault `01` in sector 1 vs `59` in sector 2),
86 are only in JMSML, 54 only in mil-sym-ts (some of these are not 2525C codes, e.g. `S*C*` cyberspace).
Because neither table is complete or error-free, both are used as evidence through adapters, and
agreement between them is reported as `confidence: "corroborated"`.

## Regression pair `SFGPUCIC---E---` ↔ `10031000151211000002`

Correct. Verified field by field: 2525C Table A-III row `S * G * UC IC` = INFANTRY ARCTIC; `-E` =
company (Table A-II). 2525D: `10` version, `03` reality/friend, `10` land unit, `0` present, `0`, `15`
company (Table A-VI), `121100` Infantry (Table A-XIX), `00`, `02` Arctic (Table A-XXI).

## Open questions

- The APP-6(D), APP-6(E) and 2525E texts were not consulted; those targets rest on mil-sym-ts catalogs.
- METOC (W) codes have no status; mil-sym-ts leaves numeric status at `0`, and this library does the same
  and says so in an info diagnostic.
- The tactical-graphic status `K` (known) has no documented numeric value and is rejected.
