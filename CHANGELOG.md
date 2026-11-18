# Changelog

Notable changes per release. Each version is on npm as `mil-symbol-converter@<version>` (ES
modules) and `<version>-cjs` (CommonJS, dist-tag `cjs`). The GitHub release of each version lists
its pull requests.

## Unreleased

- **Results cache:** `convertSidc`, `toRenderableSidc` and `convertNumericTo2525C` remember their
  last 1000 results, so repeated codes convert about 10x faster. `setCacheSize(n)` resizes it;
  `0` turns it off.
- **Web component:** `<sidc-symbol>` from `mil-symbol-converter/element` draws any identifier in
  any framework.
- **2525B input:** the nine 2525B Change 2 symbols that 2525C retired are named in the
  diagnostics and drawn as their 2525C parent.
- **Demo:** batch mode (a list or CSV in, CSV out, all in the browser). API reference at `/api/`.

## 0.12.0 (2026-11-17)

- `readSidc` reads any identifier (2525C, numeric, DIS, CoT) as a 2525C code; `detectInput` says
  which kind it is.
- Every converter's result has `output`, `matchQuality`, `lost` and `diagnostics`. The older names
  (`sidc`, `text`, `cot`, `dropped`) are deprecated.
- Bundles that never convert DIS no longer carry the DIS data.
- Fix: `readSidc` returned invalid letter codes as output (found by the new fuzz tests).

## 0.11.0 (2026-11-17)

- Cursor on Target: `sidcToCot` and `cotToSidc`.
- DIS aggregate types for units (echelon, unit type, headquarters), both ways.
- Command line: `--to dis`, `--to cot`, `--force-id`, `--aggregate`; DIS and CoT inputs go back to
  2525C.

## 0.10.0 (2026-11-17)

- DIS entity types: `sidcToDis` and `disToSidc`, with Force ID for affiliation. Enumerations from
  SISO-REF-010.

## 0.9.1 (2026-10-13)

- Demo: MSDL panel with a template scenario; paste and drop files.
- `readMsdl` notes say where an installation's affiliation came from.

## 0.9.0 (2026-10-13)

- `readMsdl`: symbols of an MSDL scenario as complete 2525C codes, from a chosen point of view.
- `useRenderableSidc` React hook.
- SIGINT track headings map to the bare frame in symbol sets 50-54.
- A function ID outside the 2525C tables is an error unless `allowUnlisted` (or `fuzzy`) is set.
- "-" in the status position of pasted codes is read as "*".

## 0.8.0 (2026-10-09)

- ES modules only (Node 22.12+ can also `require()` it); a CommonJS build is published as
  `<version>-cjs`.
- Smaller package (compact data encoding); weekly check for upstream data changes.

## 0.7.0 (2026-10-09)

- `fuzzy: true` implies `allowLossy`.

## 0.6.0 and 0.6.1 (2026-10-09)

- `toRenderableSidc`: a drawable code from codes with missing fields, with fallbacks used only
  where the code has `*`.
- Cheaper compile-time literal checks.

## 0.5.0 and 0.5.1 (2026-10-08)

- Compile-time checks for SIDC string literals, with an opt-out.

## 0.4.0 to 0.4.3 (2026-10-08)

- Public constants for every value set; overrides accept full names.
- Diagnostics point at every wrong character.
- Overrides tolerate whitespace and invisible characters; the React entry re-exports the main one.

## 0.3.0 and 0.3.1 (2026-10-08)

- Command-line tool; demo page; faster conversions.
- An em dash is read as "--" when that is the only fit.

## 0.2.0 (2026-10-08)

- Typed option values with named constants and type guards.

## 0.1.0 (2026-10-08)

- First release: 2525C to 2525D/E, APP-6D/E and the 12-character form; numeric back to 2525C;
  fuzzy mode; codes copied from web symbol lists.
