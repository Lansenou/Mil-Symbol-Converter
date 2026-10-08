# Mil-Symbol-Converter

Converts **MIL-STD-2525C** letter symbol identification codes (15 characters) to

- the 20-digit numeric SIDC of **MIL-STD-2525D** (version 10, or 11 = Change 1),
- **APP-6(D)**, **MIL-STD-2525E** (Change 1) and **APP-6(E)** (Change 2), where the code and its meaning
  can be checked in a catalog of that edition,
- the 12-character letter form read by renderers such as milsymbol (`prefix-12` profile).

Each result says how faithful it is (`exact`, `equivalent`, `lossy`, `ambiguous`, `unsupported`),
which datasets support it, and why it failed if it did. The converter does not guess. It never
picks a "closest" symbol, never replaces `*` with a default, and never treats APP-6D as identical
to 2525D.

- [Standards research](docs/standards-research.md): field layouts, the 12-character question,
  APP-6D vs 2525D, existing converters
- [Conversion rules](docs/conversion-rules.md)
- [Limitations and coverage](docs/limitations.md)

## Install

The package is not published to the npm registry. Install it from GitHub; npm builds it on install
(the `prepare` script):

```bash
npm install github:Lansenou/Mil-Symbol-Converter#feature/sidc-converter
# after the pull request is merged:
npm install github:Lansenou/Mil-Symbol-Converter
```

```ts
import { convertSidc15To2525D } from "mil-symbol-converter"; // ESM
const { convertSidc15To2525D } = require("mil-symbol-converter"); // CommonJS
import { useSidcConverter } from "mil-symbol-converter/react"; // React hook and component
```

Requires Node.js 20 or newer. The core has no runtime dependencies; React is an optional peer
dependency used only by `mil-symbol-converter/react`.

Development: `npm install && npm run check` (format, lint, typecheck, tests, build, export check).

## Usage

```ts
import {
  convertSidc15To12,
  convertSidc15To2525D,
  convertSidc15ToApp6D,
  convertSidc,
  convertSidcToAll,
  validateSidc,
  analyzeSidc,
} from "mil-symbol-converter";
```

### Numeric conversion (2525C → 2525D)

```ts
const r = convertSidc15To2525D("SFGPUCIC---E---"); // infantry arctic, friend, present, company
r.output; // "10031000151211000002"
r.matchQuality; // "exact"
r.confidence; // "corroborated" (JMSML and mil-sym-ts agree)
r.metadata?.entity; // "Movement and Maneuver : Infantry"
r.metadata?.modifiers; // ["Arctic"]
```

The same SIDC for APP-6(D) gives the same digits but only `equivalent`. That label means the code
was checked by name in an APP-6(D) catalog, not mapped by an APP-6(D) table:

```ts
convertSidc15ToApp6D("SFGPUCIC---E---").output; // "10031000151211000002" (matchQuality "equivalent")
```

### 12-character form

```ts
convertSidc15To12("SFGPUCIC---E---").output; // "SFGPUCIC---E" (matchQuality "exact")
```

The 12-character form is not a standard. It is positions 1-12, the part that milsymbol and
convert-symbology read. Positions 13-15 hold the country code and order of battle. When they are
set, the result is `lossy`.

### Wildcards

```ts
const t = convertSidc15To2525D("S*GPUCI---*****");
t.success; // false
t.matchQuality; // "ambiguous"
t.ambiguousPositions; // [2, 11, 12]
t.errors[0]; // 'The numeric SIDC needs concrete values at position(s) 2, 11, 12; …
//  Supply affiliation (one of PUAFNSHGWMDLJK), symbolModifier (…)'

convertSidc15To2525D("S*GPUCI---*****", {
  affiliation: "H",
  symbolModifier: "-E",
}).output;
// "10061000151211000000" (hostile infantry company); a warning notes positions 13-15 stay "*"

convertSidc15To12("S*GPUCI---*****", { wildcardPolicy: "preserve" }).output; // "S*GPUCI---**"
```

### Lossy conversion (strict by default)

```ts
const strict = convertSidc15To2525D("SFGPUCIC---EUS-"); // country code US
strict.success; // false
strict.matchQuality; // "lossy"
strict.warnings[0]; // 'The 20-digit SIDC has no field for countryCode "US"; carry it in a text amplifier …'
strict.candidates?.[0].output; // "10031000151211000002"

const ok = convertSidc15To2525D("SFGPUCIC---EUS-", { allowLossy: true });
ok.output; // "10031000151211000002"
ok.metadata?.droppedFields; // { countryCode: "US" }
```

### Unsupported and ambiguous conversions

```ts
convertSidc15To2525D("SHGPUUSW-------").errors[0];
// "No source provides a code with the same meaning for MIL-STD-2525D (version 10):
//  JMSML marks this 2525C symbol as retired (no 2525D counterpart)."

convertSidc15ToApp6D("IHAPSRE--------").matchQuality; // "unsupported" (no SIGINT sets in the APP-6D catalog)

// Land unit modifier 74 means "Antisubmarine Warfare" in 2525D (2014) but
// "Palletized Load System" in 2525D Change 1, so the sources' common digits can't be trusted:
convertSidc("SFGPUCVRW------").matchQuality; // "ambiguous"
convertSidc("SFGPUCVRW------", { preferredSource: "JMSML" }).output; // "10031000001206007400"
```

### All targets at once, validation, analysis

```ts
convertSidcToAll("SFGPUCIC---E---");
// { "LEGACY-12": {...}, "MIL-STD-2525D": {...}, "APP-6D": {...}, "MIL-STD-2525E": {...}, "APP-6E": {...}, "APP-6C": {...} }

validateSidc("SFGPIXH--------").errors[0];
// 'HOSPITAL is an installation (2525C template S*G*IXH---H****); position 11 must be "H". Did you mean SFGPIXH---H----?'

analyzeSidc("S*GPUCI---*****").wildcards; // which option resolves each "*" and how many values it can take
```

### Options

| Option                                                                    | Default         | Meaning                                                          |
| ------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------- |
| `targetStandard`                                                          | `MIL-STD-2525D` | for `convertSidc`                                                |
| `affiliation`, `status`, `symbolModifier`, `countryCode`, `orderOfBattle` | —               | values for `*` positions only                                    |
| `wildcardPolicy`                                                          | `resolve`       | `resolve` / `preserve` / `reject`                                |
| `allowLossy`                                                              | `false`         | accept lossy results                                             |
| `mil2525dVersion`                                                         | `"10"`          | `"11"` = 2525D Change 1                                          |
| `preferredSource`                                                         | —               | `"JMSML"` or `"mil-sym-ts"` when sources disagree                |
| `legacy12Profile`                                                         | `prefix-12`     | only profile defined                                             |
| `strictInput`                                                             | `false`         | reject lowercase / surrounding whitespace instead of normalizing |

## React

```tsx
import { useSidcConverter, SidcConverter } from "mil-symbol-converter/react";

function Badge({ sidc }: { sidc: string }) {
  const r = useSidcConverter(sidc, { targetStandard: "MIL-STD-2525D" }); // memoized, never throws
  return <code title={r.errors.join("\n")}>{r.output ?? r.matchQuality}</code>;
}

export const App = () => <SidcConverter initialSidc="SFGPUCIC---E---" />;
```

`SidcConverter` is a dependency-free form with SIDC input, target selector, affiliation/status/modifier
selectors for wildcards, wildcard policy, a lossy switch, a copy button, the 12-character form and the
validation messages. A runnable example is in [`examples/react`](examples/react).

## Data and attribution

The mapping tables in `src/data/` are generated by `scripts/build-data.mjs` from pinned sources
(`scripts/fetch-sources.sh`):

- [Esri Joint Military Symbology XML](https://github.com/Esri/joint-military-symbology-xml) (Apache-2.0)
- [US Army C5ISR mil-sym-ts](https://github.com/missioncommand/mil-sym-ts) (Apache-2.0)
- MIL-STD-2525C SIDC tables (US Government, approved for public release)

See [NOTICE](NOTICE). The code is MIT licensed.

## Testing

`npm test` runs the Vitest suite. It covers validation, wildcards, the 12-character form, every
numeric target, regression cases, React, property-based tests (fast-check) and data integrity.
Expected values in `tests/fixtures/verified-sidcs.json` were written by hand from the 2525C and
2525D tables. `scripts/review-fixture.mjs` prints the cited table lines for review. The fixtures
were not produced by the converter.
