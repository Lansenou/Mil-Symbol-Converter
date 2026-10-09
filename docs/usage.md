# Usage

## Drawing codes with missing fields

Codes from real data often leave fields as `*` or arrive mangled by copy and paste, and milsymbol
then draws nothing or the wrong frame. `toRenderableSidc` returns a code to draw that keeps every
field the input does give:

- each `*` field takes your `fallback` value; a fallback is only used where the code has `*`, never
  over a value the code carries, and only if it is valid for that code;
- a `*` with no fallback gets a neutral value: Unknown identity, Present status, no modifier,
  country or order of battle;
- a function ID outside the 2525C tables is drawn as its nearest listed parent;
- with a numeric `targetStandard`, it converts with loss allowed, so only what the target cannot
  carry is dropped. The default target is 2525C itself, which milsymbol draws with every field.

```ts
import ms from "milsymbol";
import { toRenderableSidc } from "mil-symbol-converter";

const r = toRenderableSidc("S*G*UCMT--*****", {
  fallback: { affiliation: "Hostile", status: "Present" },
});
r.sidc; // "SHGPUCMT-------"
r.filled; // [{ field: "standardIdentity", value: "H", from: "fallback" }, ...]
r.dropped; // [] (what the drawing leaves out, as text)
if (r.sidc) new ms.Symbol(r.sidc).asSVG();
```

| Input             | milsymbol as is                                                        | Options                               | Result                          | Symbol                                                                       | Filled / dropped                                                                                                                                                                                                                       |
| ----------------- | ---------------------------------------------------------------------- | ------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `S*G*UCMT--*****` | not drawn                                                              | default                               | `SUGPUCMT-------`<br>exact      | <img src="images/render1-output.svg" alt="SUGPUCMT-------" height="40">      | standardIdentity `U` (default)<br>status `P` (default)<br>symbolModifier `--` (default)                                                                                                                                                |
| `S*GPUCI---*****` | not drawn                                                              | `fallback: {"affiliation":"Hostile"}` | `SHGPUCI--------`<br>exact      | <img src="images/render2-output.svg" alt="SHGPUCI--------" height="40">      | standardIdentity `H` (fallback)<br>symbolModifier `--` (default)                                                                                                                                                                       |
| `SPG*UCMT—*****`  | not drawn                                                              | `fallback: {"status":"Present"}`      | `SPGPUCMT-------`<br>exact      | <img src="images/render3-output.svg" alt="SPGPUCMT-------" height="40">      | status `P` (fallback)<br>symbolModifier `--` (default)                                                                                                                                                                                 |
| `SFGPUCIZE------` | not drawn                                                              | default                               | `SFGPUCIZ-------`<br>lossy      | <img src="images/render4-output.svg" alt="SFGPUCIZ-------" height="40">      | Function ID "UCIZE-" is not in the 2525C tables; drawn as its parent "UCIZ--" (INFANTRY MECHANIZED).                                                                                                                                   |
| `SFGPUCVRW-*****` | <img src="images/render5-input.svg" alt="SFGPUCVRW-*****" height="40"> | `targetStandard: "MIL-STD-2525D"`     | `10031000001206000000`<br>lossy | <img src="images/render5-output.svg" alt="10031000001206000000" height="40"> | symbolModifier `--` (default)<br>Approximate result (ancestor, certainty 1.00): no mapping for "ANTISUBMARINE WARFARE ROTARY WING"; using its 2525C parent (2 levels up) "AVIATION" (SFGPUCV--------), which loses the specialisation. |

The result is for display: `matchQuality`, `filled` and `dropped` say how far it is from the
input. Use `convertSidc` when a wrong code would be worse than none.

## Converting codes

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

Overrides take full names or 2525C letters. Every value set is also a runtime constant, so
`keyof typeof`, `Object.values` and autocompletion work:

```ts
import {
  Affiliation, // { Hostile: "Hostile", ... }
  AffiliationLetter, // { Hostile: "H", ... }
  Status,
  Echelon,
  UnitIndicator,
  echelonModifier,
  MatchQuality,
  DiagnosticCode,
} from "mil-symbol-converter";

const r = convertSidc15To2525D("S*G*UCI---*****", {
  affiliation: Affiliation.Hostile, // or "Hostile", or "H"
  status: Status.Present,
  symbolModifier: echelonModifier(
    Echelon.Battalion,
    UnitIndicator.Headquarters,
  ), // "AF"
});
r.matchQuality === MatchQuality.Exact;
r.diagnostics.some((d) => d.code === DiagnosticCode.UNRESOLVED_WILDCARD);
type AffiliationName = keyof typeof Affiliation;
```

Constants exist for `Affiliation`, `Status`, `Echelon`, `UnitIndicator`, `SymbolModifier`,
`OrderOfBattle`, `CodingScheme` (each with a `…Letter` map), and for `SidcStandard`,
`NumericSourceStandard`, `MatchQuality`, `WildcardPolicy`, `MappingSource`, `Mil2525dVersion`,
`DiagnosticSeverity`, `DiagnosticCode`, `FuzzyMethod` and `Confidence`. The 2525C field tables
(`STANDARD_IDENTITIES`, `SYMBOL_MODIFIERS`, ...) are exported with their descriptions. For values
read at runtime, `isAffiliation`, `isStatus`, `isSymbolModifier`, `isCountryCode` and
`isOrderOfBattle` narrow a `string`. Whether a value fits the coding scheme of the SIDC (e.g.
status Known only for tactical graphics) is still checked at runtime.

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

### Fuzzy mode (approximate, with certainty)

Off by default. When there is no documented mapping, `fuzzy: true` makes a labelled best guess:

```ts
convertSidc15To2525D("SFGPUUL--------"); // LAW ENFORCEMENT UNIT: unsupported (no mapping)
const f = convertSidc15To2525D("SFGPUUL--------", { fuzzy: true });
f.output; // "10031000002000000000" (Land unit : Law Enforcement)
f.matchQuality; // "approximate"
f.fuzzy; // { method: "name-match", certainty: 0.938, basis: '"LAW ENFORCEMENT UNIT" ~ "Law Enforcement" …' }

// No name match: fall back to the nearest mapped 2525C parent (lossy, needs allowLossy)
convertSidc15To2525D("SFAPMFFI-------", { fuzzy: true, allowLossy: true })
  .output;
// "10030100001101040000": INTERCEPTOR -> its parent FIGHTER
```

`certainty` is the measured precision of the matcher on symbols with known mappings
([calibration](limitations.md#fuzzy-certainty)), not a made-up score. With fuzzy mode and
`extendedSidc`, 95.7% of the 2525C symbols convert to 2525D, compared with 89.6% from documented
mappings alone.

### Numeric back to 2525C

```ts
import { convertNumericTo2525C } from "mil-symbol-converter";

convertNumericTo2525C("10031000151211000002").output; // "SFGPUCIC---E---" (exact)
convertNumericTo2525C("15031000151211000002").output; // "SFGPUCIC---E---" (2525E, equivalent)
convertNumericTo2525C("10031000001211000000", { sourceStandard: "APP-6D" }); // version 10 is shared
convertNumericTo2525C("10031000151211000002", { countryCode: "US" }).output; // "SFGPUCIC---EUS-"
```

Every candidate is converted forward again and accepted only if it reproduces the input, so both
directions follow the same rules. A code that several _different_ 2525C symbols convert to is
`ambiguous` rather than guessed.

### All targets at once, validation, analysis

```ts
convertSidcToAll("SFGPUCIC---E---");
// { "LEGACY-12": {...}, "MIL-STD-2525D": {...}, "APP-6D": {...}, "MIL-STD-2525E": {...}, "APP-6E": {...}, "APP-6C": {...} }

validateSidc("SFGPIXH--------").errors[0];
// 'HOSPITAL is an installation (2525C template S*G*IXH---H****); position 11 must be "H". Did you mean SFGPIXH---H----?'

analyzeSidc("S*GPUCI---*****").wildcards; // which option resolves each "*" and how many values it can take
```

### Options

| Option                                                                    | Default         | Meaning                                                                                                        |
| ------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------- |
| `targetStandard`                                                          | `MIL-STD-2525D` | for `convertSidc`                                                                                              |
| `affiliation`, `status`, `symbolModifier`, `countryCode`, `orderOfBattle` | —               | values for `*` positions only                                                                                  |
| `wildcardPolicy`                                                          | `resolve`       | `resolve` / `preserve` / `reject`                                                                              |
| `allowLossy`                                                              | `false`         | accept lossy results                                                                                           |
| `mil2525dVersion`                                                         | `"10"`          | `"11"` = 2525D Change 1                                                                                        |
| `preferredSource`                                                         | —               | `"JMSML"` or `"mil-sym-ts"` when sources disagree                                                              |
| `legacy12Profile`                                                         | `prefix-12`     | only profile defined                                                                                           |
| `strictInput`                                                             | `false`         | reject lowercase, surrounding whitespace, typographic dashes and `*` in fixed positions instead of normalizing |

### Compile-time checks for SIDC literals

SIDC string literals are checked against the 2525C tables by the TypeScript compiler, in every
function that takes a SIDC and in `useSidcConverter`:

```ts
convertSidc("SHGPUCX--------");
// error: Argument of type '"SHGPUCX--------"' is not assignable to parameter of type
//   '"✗ SIDC position 7: \"UCX---\" is not a 2525C function ID for scheme S, dimension G"'.

const s = sidc("SHGPUCI--------"); // checked constant, no runtime cost
```

Only literals are checked: a `string` from data or a form passes and is validated at runtime as
before. Literals must be in canonical form (uppercase, ASCII hyphens); the runtime still accepts
the looser forms. To opt out for one call, pass a `string` (`convertSidc(code as string)`); to
opt out everywhere, add once anywhere in your project:

```ts
declare module "mil-symbol-converter" {
  interface TypeOptions {
    checkSidcLiterals: false;
  }
}
```

### Codes copied from web lists

Some symbol lists print `---` as `—`, `--` as `–`, phones turn a typed `--` into `—`, and end every code in `*****`. Such codes are
accepted with a warning: the dashes are restored when that gives 15 characters, and `*` is replaced
where the 2525C table fixes the value (the `X` of tactical graphics, the installation `H`, the METOC
tail). `*` in user-defined positions stays a wildcard, so pass `symbolModifier` etc. to convert.

```ts
validateSidc("GFTPA—–*****").normalized; // "GFTPA-----****X" (TYPOGRAPHIC_DASHES_REPAIRED, FIXED_POSITIONS_FILLED)
convertSidc("SFAPMFF—*****", {
  symbolModifier: "--",
  countryCode: "--",
  orderOfBattle: "-",
}).output; // "10030100001101040000"
```

## Command line

```bash
npx mil-symbol-converter SFGPUCIC---E--- 10031000151211000002
# SFGPUCIC---E---       2525D  10031000151211000002  exact
# 10031000151211000002  2525C  SFGPUCIC---E---       exact
# 2/2 converted (exact 2)                               <- summary on stderr

npx mil-symbol-converter --to all SFGPUCI--------             # every target
npx mil-symbol-converter 'S*GPUCI---*****' --affiliation H --modifier -E
npx mil-symbol-converter -f codes.txt --to app-6d --lossy     # one code per line
cat units.csv | npx mil-symbol-converter --csv sidc > out.csv # appends 2525D, 2525D_quality, 2525D_note
```

Output is tab-separated (input, target, output, quality, note), or one JSON result per line with
`--json`. Numeric codes convert back to 2525C. The exit status is 1 if any code did not convert, so
it can gate a script. `--help` lists all options (`--fuzzy`, `--extended`, `--source`, ...).

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
validation messages. A runnable example is in [`examples/react`](../examples/react).
