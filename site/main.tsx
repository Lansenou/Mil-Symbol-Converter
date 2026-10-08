import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import ms from "milsymbol";
import {
  Affiliation,
  Status,
  convertNumericTo2525C,
  convertSidc,
  isSymbolModifier,
  validateSidc,
  type ConversionOptions,
  type ConversionResult,
  type Diagnostic,
  type SidcStandard,
} from "../src";

const TARGETS: { id: SidcStandard; label: string; std: "2525" | "APP6" }[] = [
  { id: "MIL-STD-2525D", label: "MIL-STD-2525D", std: "2525" },
  { id: "APP-6D", label: "APP-6(D)", std: "APP6" },
  { id: "MIL-STD-2525E", label: "MIL-STD-2525E Ch. 1", std: "2525" },
  { id: "APP-6E", label: "APP-6(E) Ch. 2", std: "APP6" },
  { id: "LEGACY-12", label: "12-character prefix", std: "2525" },
];

const EXAMPLES: { sidc: string; note: string }[] = [
  { sidc: "SFGPUCIC---E---", note: "Infantry, arctic, company" },
  { sidc: "SHAPMFB--------", note: "Hostile bomber" },
  { sidc: "SPGPUCI--------", note: "Pending infantry" },
  { sidc: "SFGPIXH---H----", note: "Hospital (installation)" },
  { sidc: "SFGPUCVRW------", note: "Contested between editions" },
  { sidc: "S*GPUCI---*****", note: "Template with wildcards" },
  { sidc: "SFAPMFF—*****", note: "Pasted from a web list" },
  { sidc: "10031000151211000002", note: "Numeric, back to 2525C" },
];

const NAMES = (o: Record<string, string>) =>
  Object.entries(o).map(([name, code]) => ({
    code,
    name: name.replace(/([a-z])([A-Z])/g, "$1 $2"),
  }));

function symbolSvg(sidc: string, standard: "2525" | "APP6"): string | null {
  try {
    const s = new ms.Symbol(sidc, { size: 44, standard });
    return s.isValid() === true ? s.asSVG() : null;
  } catch {
    return null;
  }
}

function Symbol({ sidc, std }: { sidc: string | null; std: "2525" | "APP6" }) {
  const svg = useMemo(() => (sidc ? symbolSvg(sidc, std) : null), [sidc, std]);
  return svg ? (
    <div className="symbol" dangerouslySetInnerHTML={{ __html: svg }} />
  ) : (
    <div className="symbol empty" aria-hidden="true">
      —
    </div>
  );
}

function Diagnostics({ items }: { items: Diagnostic[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="diagnostics">
      {items.map((d, i) => (
        <li key={i} className={d.severity}>
          <code>{d.code}</code> {d.message}
        </li>
      ))}
    </ul>
  );
}

function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="copy"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        });
      }}
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}

function ResultCard({
  label,
  std,
  r,
}: {
  label: string;
  std: "2525" | "APP6";
  r: ConversionResult;
}) {
  const name =
    [r.metadata?.entity, ...(r.metadata?.modifiers ?? [])]
      .filter(Boolean)
      .join(" · ") || r.metadata?.legacyDescription;
  return (
    <article className="card">
      <header>
        <h3>{label}</h3>
        <span className={`badge ${r.matchQuality}`}>
          {r.matchQuality}
          {r.fuzzy ? ` · ${Math.round(r.fuzzy.certainty * 100)}%` : ""}
        </span>
      </header>
      <div className="row">
        <Symbol sidc={r.output} std={std} />
        <div className="code">
          {r.output ? (
            <>
              <code>{r.output}</code>
              <Copy text={r.output} />
            </>
          ) : (
            <>
              <span className="muted">No output</span>
              {r.errors[0] && <p className="reason">{r.errors[0]}</p>}
            </>
          )}
          {r.output && name && <p className="name">{name}</p>}
        </div>
      </div>
      <details>
        <summary>
          {r.errors.length} error(s), {r.warnings.length} warning(s)
        </summary>
        <Diagnostics items={r.diagnostics} />
      </details>
    </article>
  );
}

function readHash(): string {
  const v = new URLSearchParams(location.hash.slice(1)).get("sidc");
  return v ?? EXAMPLES[0]!.sidc;
}

function App() {
  const [input, setInput] = useState(readHash);
  const [affiliation, setAffiliation] = useState("");
  const [status, setStatus] = useState("");
  const [modifier, setModifier] = useState("");
  const [allowLossy, setAllowLossy] = useState(false);
  const [fuzzy, setFuzzy] = useState(false);
  const [extendedSidc, setExtendedSidc] = useState(false);

  useEffect(() => {
    history.replaceState(null, "", `#sidc=${encodeURIComponent(input)}`);
  }, [input]);

  const mod = modifier.toUpperCase();
  const options: ConversionOptions = {
    allowLossy,
    fuzzy,
    extendedSidc,
    ...(affiliation && { affiliation: affiliation as Affiliation }),
    ...(status && { status: status as Status }),
    ...(isSymbolModifier(mod) && { symbolModifier: mod }),
  };
  const trimmed = input.trim();
  const numeric = /^\d{20}(\d{10})?$/.test(trimmed);

  const validation = numeric ? null : validateSidc(input);
  const results = numeric
    ? []
    : TARGETS.map((t) => ({
        ...t,
        r: convertSidc(input, { ...options, targetStandard: t.id }),
      }));
  const reverse = numeric ? convertNumericTo2525C(trimmed) : null;
  const shown = validation?.normalized ?? input;

  return (
    <main>
      <header className="top">
        <div>
          <h1>SIDC Converter</h1>
          <p>
            MIL-STD-2525C letter codes to MIL-STD-2525D/E and APP-6(D)/(E)
            numeric codes, and back. Strict by default: no output rather than a
            wrong one.
          </p>
        </div>
        <a href="https://github.com/Lansenou/Mil-Symbol-Converter">GitHub</a>
      </header>

      <section className="panel">
        <label className="field">
          <span>SIDC (15-character 2525C, or 20/30-digit numeric)</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
        </label>
        <div className="chips">
          {EXAMPLES.map((e) => (
            <button
              key={e.sidc}
              type="button"
              title={e.note}
              className={e.sidc === input ? "chip on" : "chip"}
              onClick={() => setInput(e.sidc)}
            >
              <code>{e.sidc}</code>
              <span>{e.note}</span>
            </button>
          ))}
        </div>
        {!numeric && (
          <div className="options">
            <label>
              <span>
                Affiliation for <code>*</code>
              </span>
              <select
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
              >
                <option value="">from SIDC</option>
                {NAMES(Affiliation).map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.code} {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>
                Status for <code>*</code>
              </span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">from SIDC</option>
                {NAMES(Status).map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.code} {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>
                Modifier for <code>**</code>
              </span>
              <input
                value={modifier}
                maxLength={2}
                placeholder="--"
                onChange={(e) => setModifier(e.target.value)}
              />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={allowLossy}
                onChange={(e) => setAllowLossy(e.target.checked)}
              />
              Allow lossy
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={fuzzy}
                onChange={(e) => setFuzzy(e.target.checked)}
              />
              Fuzzy (with certainty)
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={extendedSidc}
                onChange={(e) => setExtendedSidc(e.target.checked)}
              />
              30-digit 2525E/APP-6E
            </label>
          </div>
        )}
      </section>

      {validation && (
        <section className="panel input">
          <Symbol sidc={validation.valid ? shown : null} std="2525" />
          <div>
            <h2>
              {validation.catalogEntry?.description ??
                (validation.valid ? "2525C SIDC" : "Invalid SIDC")}
            </h2>
            <p className="muted">
              <code>{shown}</code>
              {validation.isTemplate && " · template"}
            </p>
            <Diagnostics items={validation.diagnostics} />
          </div>
        </section>
      )}

      {numeric && (
        <section className="panel input">
          <Symbol sidc={trimmed} std="2525" />
          <div>
            <h2>Numeric SIDC</h2>
            <p className="muted">
              <code>{trimmed}</code> · converted back to the 2525C letter code
              below; a result is only given if converting it forward reproduces
              this code.
            </p>
          </div>
        </section>
      )}

      {reverse && (
        <section className="grid">
          <ResultCard label="MIL-STD-2525C" std="2525" r={reverse} />
        </section>
      )}

      {results.length > 0 && (
        <section className="grid">
          {results.map(({ id, label, std, r }) => (
            <ResultCard key={id} label={label} std={std} r={r} />
          ))}
        </section>
      )}

      <footer>
        Mappings from Esri JMSML and US Army mil-sym-ts; symbols drawn by
        milsymbol. Install:{" "}
        <code>
          npm install
          https://github.com/Lansenou/Mil-Symbol-Converter/releases/download/v0.3.1/mil-symbol-converter-0.3.1.tgz
        </code>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
