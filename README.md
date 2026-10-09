# Mil-Symbol-Converter

Converts **MIL-STD-2525C** letter SIDCs (15 characters) to the numeric SIDCs of **MIL-STD-2525D**,
**APP-6(D)**, **MIL-STD-2525E** and **APP-6(E)**, and back. Mappings come from Esri JMSML and the US
Army's mil-sym-ts, and every result says how faithful it is (`exact`, `equivalent`, `lossy`,
`approximate`, `ambiguous`, `unsupported`).

It helps with two jobs:

- **Reading codes** from data, files or other systems: `toRenderableSidc` repairs pasted input,
  fills fields left as `*`, and returns a code [milsymbol](https://github.com/spatialillusions/milsymbol)
  can draw, with a list of what it assumed or left out.
- **Writing codes** yourself: SIDC string literals are checked at compile time, so a typo is a type
  error naming the wrong position. At runtime, `validateSidc` and `convertSidc` point at each wrong
  character and return no code rather than one for a different symbol.

**Try it online:** <https://lansenou.github.io/Mil-Symbol-Converter/>

## Install

```bash
npm install mil-symbol-converter
```

Node.js 22+, no runtime dependencies. ESM and CommonJS; React hook and component in
`mil-symbol-converter/react`.

## Reading codes: draw what the data gives

```ts
import ms from "milsymbol";
import { toRenderableSidc } from "mil-symbol-converter";

const r = toRenderableSidc("S*G*UCMT--*****", {
  fallback: { affiliation: "Hostile" }, // used only where the code has "*"
});
r.sidc; // "SHGPUCMT-------"
r.filled; // what was filled in, from your fallback or a neutral default
r.dropped; // what the drawing leaves out
new ms.Symbol(r.sidc!).asSVG();
```

| Input             | milsymbol as is                                                             | Options                               | Result                          | Symbol                                                                            | Filled / dropped                                                                                                                                                                                                                       |
| ----------------- | --------------------------------------------------------------------------- | ------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `S*G*UCMT--*****` | not drawn                                                                   | default                               | `SUGPUCMT-------`<br>exact      | <img src="docs/images/render1-output.svg" alt="SUGPUCMT-------" height="40">      | standardIdentity `U` (default)<br>status `P` (default)<br>symbolModifier `--` (default)                                                                                                                                                |
| `S*GPUCI---*****` | not drawn                                                                   | `fallback: {"affiliation":"Hostile"}` | `SHGPUCI--------`<br>exact      | <img src="docs/images/render2-output.svg" alt="SHGPUCI--------" height="40">      | standardIdentity `H` (fallback)<br>symbolModifier `--` (default)                                                                                                                                                                       |
| `SPG*UCMT—*****`  | not drawn                                                                   | `fallback: {"status":"Present"}`      | `SPGPUCMT-------`<br>exact      | <img src="docs/images/render3-output.svg" alt="SPGPUCMT-------" height="40">      | status `P` (fallback)<br>symbolModifier `--` (default)                                                                                                                                                                                 |
| `SFGPUCIZE------` | not drawn                                                                   | default                               | `SFGPUCIZ-------`<br>lossy      | <img src="docs/images/render4-output.svg" alt="SFGPUCIZ-------" height="40">      | Function ID "UCIZE-" is not in the 2525C tables; drawn as its parent "UCIZ--" (INFANTRY MECHANIZED).                                                                                                                                   |
| `SFGPUCVRW-*****` | <img src="docs/images/render5-input.svg" alt="SFGPUCVRW-*****" height="40"> | `targetStandard: "MIL-STD-2525D"`     | `10031000001206000000`<br>lossy | <img src="docs/images/render5-output.svg" alt="10031000001206000000" height="40"> | symbolModifier `--` (default)<br>Approximate result (ancestor, certainty 1.00): no mapping for "ANTISUBMARINE WARFARE ROTARY WING"; using its 2525C parent (2 levels up) "AVIATION" (SFGPUCV--------), which loses the specialisation. |

## Writing codes: convert with feedback

```ts
import { convertSidc, validateSidc } from "mil-symbol-converter";

convertSidc("SFGPUCIC---E---").output; // "10031000151211000002" (2525D, exact)
convertSidc("SFGPUCIC---E---", { targetStandard: "APP-6D" }).matchQuality; // "equivalent"

validateSidc("SFGPIXH--------").errors[0];
// 'HOSPITAL is an installation (...); position 11 must be "H". Did you mean SFGPIXH---H----?'

convertSidc("SHGPUCX--------"); // compile error: SIDC position 7: "UCX---" is not a 2525C function ID
```

There is also a command line: `npx mil-symbol-converter SFGPUCIC---E---`.

## Documentation

- [Usage](docs/usage.md): drawing, conversion options, wildcards, lossy and fuzzy modes, numeric
  back to 2525C, compile-time checks, command line, React
- [Examples](docs/examples.md): codes side by side in every edition, with symbols
- [Conversion rules](docs/conversion-rules.md) and [limitations and coverage](docs/limitations.md)
- [Standards research](docs/standards-research.md): field layouts, APP-6D vs 2525D, existing converters
- [Development](docs/development.md): data sources, tests, publishing

## License

MIT. Mapping data from [Esri JMSML](https://github.com/Esri/joint-military-symbology-xml) and
[mil-sym-ts](https://github.com/missioncommand/mil-sym-ts) (both Apache-2.0); see [NOTICE](NOTICE).
