// Minimal React app using the converter. Run with any React toolchain, e.g.:
//   npm create vite@latest demo -- --template react-ts
//   cd demo && npm install github:Lansenou/Mil-Symbol-Converter#feature/sidc-converter
//   copy this file to src/App.tsx and run `npm run dev`
import { SidcConverter, useSidcConverter } from "mil-symbol-converter/react";

function Row({ sidc }: { sidc: string }) {
  const d = useSidcConverter(sidc, {
    targetStandard: "MIL-STD-2525D",
    allowLossy: true,
  });
  const app6 = useSidcConverter(sidc, {
    targetStandard: "APP-6D",
    allowLossy: true,
  });
  return (
    <tr>
      <td>
        <code>{sidc}</code>
      </td>
      <td>
        <code>{d.output ?? "—"}</code> {d.matchQuality}
      </td>
      <td>
        <code>{app6.output ?? "—"}</code> {app6.matchQuality}
      </td>
    </tr>
  );
}

export default function App() {
  return (
    <main>
      <h1>MIL-STD-2525C converter</h1>
      <SidcConverter initialSidc="SFGPUCIC---E---" />
      <table>
        <thead>
          <tr>
            <th>2525C</th>
            <th>2525D</th>
            <th>APP-6D</th>
          </tr>
        </thead>
        <tbody>
          {[
            "SFGPUCIC---E---",
            "SHAPMFB--------",
            "S*GPUCI---*****",
            "IHAPSRE--------",
          ].map((s) => (
            <Row key={s} sidc={s} />
          ))}
        </tbody>
      </table>
    </main>
  );
}
