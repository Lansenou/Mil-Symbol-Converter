import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import ms from "milsymbol";
import {
  AffiliationLetter,
  StatusLetter,
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

function Symbol({
  sidc,
  std,
  faded = false,
}: {
  sidc: string | null;
  std: "2525" | "APP6";
  faded?: boolean;
}) {
  const svg = useMemo(() => (sidc ? symbolSvg(sidc, std) : null), [sidc, std]);
  return svg ? (
    <div
      className={faded ? "symbol faded" : "symbol"}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
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

/**
 * What a strict conversion would give with loss allowed, so the card can still show the code and
 * symbol and say what is missing. Never returned by the library unless the caller opts in.
 */
function previewOf(
  input: string,
  r: ConversionResult,
  options: ConversionOptions,
): { code: string; note: string; lost: string[] } | null {
  if (r.output) return null;
  const lossy = convertSidc(input, {
    ...options,
    targetStandard: r.targetStandard,
    allowLossy: true,
  });
  if (lossy.output)
    return {
      code: lossy.output,
      note: "Lossy: only returned with “Allow lossy”.",
      lost: lossy.warnings,
    };
  const candidates = lossy.candidates ?? r.candidates ?? [];
  const first = candidates[0];
  if (first)
    return {
      code: first.output,
      note:
        candidates.length > 1
          ? `Ambiguous: showing candidate 1 of ${candidates.length}.`
          : "Not confirmed: shown as the only candidate.",
      lost: [r.errors[0] ?? first.note],
    };
  return null;
}

function ResultCard({
  label,
  std,
  r,
  preview,
}: {
  label: string;
  std: "2525" | "APP6";
  r: ConversionResult;
  preview?: ReturnType<typeof previewOf>;
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
        <Symbol
          sidc={r.output ?? preview?.code ?? null}
          std={std}
          faded={!r.output}
        />
        <div className="code">
          {r.output ? (
            <>
              <code>{r.output}</code>
              <Copy text={r.output} />
            </>
          ) : preview ? (
            <>
              <code className="preview">{preview.code}</code>
              <p className="reason">{preview.note}</p>
              {preview.lost.length > 0 && (
                <ul className="lost">
                  {preview.lost.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
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
    ...(affiliation && {
      affiliation: affiliation as AffiliationLetter,
    }),
    ...(status && { status: status as StatusLetter }),
    ...(isSymbolModifier(mod) && { symbolModifier: mod }),
  };
  const trimmed = input.trim();
  const numeric = /^\d{20}(\d{10})?$/.test(trimmed);

  const validation = numeric ? null : validateSidc(input);
  const reverse = numeric ? convertNumericTo2525C(trimmed) : null;
  // A numeric code reaches the other editions through its 2525C equivalent.
  const letter = reverse
    ? (reverse.output ?? reverse.candidates?.[0]?.output ?? null)
    : input;
  const results = letter
    ? TARGETS.map((t) => {
        const r = convertSidc(letter, { ...options, targetStandard: t.id });
        return { ...t, r, preview: previewOf(letter, r, options) };
      })
    : [];
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
        <div className="options">
          {!numeric && (
            <>
              {" "}
              <label>
                <span>
                  Affiliation for <code>*</code>
                </span>
                <select
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                >
                  <option value="">from SIDC</option>
                  {NAMES(AffiliationLetter).map((a) => (
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
                  {NAMES(StatusLetter).map((a) => (
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
            </>
          )}{" "}
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
              <code>{trimmed}</code> · converted back to 2525C (a result is only
              given if converting it forward reproduces this code), then from
              2525C to every other edition.
            </p>
            {reverse && !letter && (
              <p className="reason">
                No 2525C equivalent, so there is no path to the other editions.
              </p>
            )}
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
          {results.map(({ id, label, std, r, preview }) => (
            <ResultCard
              key={id}
              label={label}
              std={std}
              r={r}
              preview={preview}
            />
          ))}
        </section>
      )}

      <footer>
        Mappings from Esri JMSML and US Army mil-sym-ts; symbols drawn by
        milsymbol. Install:{" "}
        <code>
          npm install
          https://github.com/Lansenou/Mil-Symbol-Converter/releases/download/v0.5.1/mil-symbol-converter-0.5.1.tgz
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
