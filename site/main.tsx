import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import ms from "milsymbol";
import sampleMsdl from "../tests/fixtures/sample.msdl.xml?raw";
import {
  AffiliationLetter,
  StatusLetter,
  convertNumericTo2525C,
  convertSidc,
  isSymbolModifier,
  readMsdl,
  toRenderableSidc,
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
  { sidc: "SFGPUCIC---EUS-", note: "Country code: needs lossy" },
  { sidc: "SFGPUUL--------", note: "No mapping: needs fuzzy" },
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

/**
 * Robust mode: what toRenderableSidc draws when the strict conversion gives nothing, so the card
 * still shows a code and symbol and says what was assumed or left out.
 */
function previewOf(
  input: string,
  r: ConversionResult,
  options: ConversionOptions,
): {
  code: string;
  /** A MatchQuality, or "assumed" when identity or status was not given. */
  quality: string;
  lost: string[];
} | null {
  // A 12-character template ("S*GPUCI---**") is a valid output but cannot be drawn.
  if (r.output && !r.output.includes("*")) return null;
  const p = toRenderableSidc(input, {
    targetStandard: r.targetStandard,
    extendedSidc: options.extendedSidc ?? false,
    fallback: {
      ...(options.affiliation && { affiliation: options.affiliation }),
      ...(options.status && { status: options.status }),
      ...(options.symbolModifier && { symbolModifier: options.symbolModifier }),
    },
  });
  if (!p.sidc) return null;
  const defaults = p.filled
    // Only identity and status change the drawing; the other defaults mean "none".
    .filter(
      (f) =>
        f.from === "default" &&
        (f.field === "standardIdentity" || f.field === "status"),
    )
    .map((f) => `${f.field} "${f.value}" assumed (no value given)`);
  return {
    code: p.sidc,
    quality: defaults.length > 0 ? "assumed" : p.matchQuality,
    lost: [...defaults, ...p.dropped],
  };
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
  const output = preview?.code ?? r.output;
  const quality = preview?.quality ?? r.matchQuality;
  const name =
    [r.metadata?.entity, ...(r.metadata?.modifiers ?? [])]
      .filter(Boolean)
      .join(" · ") ||
    // The input's own name only fits when nothing was dropped or approximated.
    (quality === "exact" || quality === "equivalent"
      ? r.metadata?.legacyDescription
      : undefined);
  return (
    <article className="card">
      <header>
        <h3>{label}</h3>
        <span className={`badge ${quality}`}>
          {quality}
          {r.fuzzy ? ` · ${Math.round(r.fuzzy.certainty * 100)}%` : ""}
        </span>
      </header>
      <div className="row">
        <Symbol sidc={output} std={std} />
        <div className="code">
          {output ? (
            <>
              <code>{output}</code>
              <Copy text={output} />
              {preview && preview.lost.length > 0 && (
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
          {preview ? "Strict result: " : ""}
          {r.errors.length} error(s), {r.warnings.length} warning(s)
        </summary>
        <Diagnostics items={r.diagnostics} />
      </details>
    </article>
  );
}

/** How much a Strict result may differ from the input; fuzzy implies lossy. */
type Accept = "exact" | "lossy" | "fuzzy";

/**
 * An MSDL scenario as a table of symbols. The file is read in the browser only. Drawings use the
 * toRenderableSidc result, so text from the file never reaches the SVG markup.
 */
function MsdlPanel({ onPick }: { onPick: (sidc: string) => void }) {
  // Starts with a template scenario (Blue, Red and Green sides) to edit or replace.
  const [xml, setXml] = useState(sampleMsdl);
  const [viewpoint, setViewpoint] = useState("side-blue");
  const parsed = useMemo(() => {
    if (!xml.trim()) return null;
    try {
      return { scenario: readMsdl(xml, viewpoint ? { viewpoint } : {}) };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [xml, viewpoint]);
  const scenario = parsed && "scenario" in parsed ? parsed.scenario : null;
  const [dragging, setDragging] = useState(false);
  const [pasteNote, setPasteNote] = useState("");
  // A new scenario replaces the current one; its sides differ, so the point of view resets.
  const load = (text: string) => {
    setXml(text);
    setViewpoint("");
    setPasteNote("");
  };
  const loadFile = (f: File | undefined) => {
    if (f) void f.text().then(load);
  };
  return (
    <details
      className={dragging ? "panel msdl dragging" : "panel msdl"}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null))
          setDragging(false);
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        e.currentTarget.open = true;
        setDragging(false);
        loadFile(e.dataTransfer.files[0]);
      }}
    >
      <summary>
        <h2>MSDL scenario</h2>
        <span className="muted">
          The units, equipment and installations of an MSDL file. Starts with a
          template scenario: edit it, paste your own, or open or drop a file
          (read in your browser, not uploaded). Click a row to convert it.
        </span>
      </summary>
      <div className="msdl-controls">
        <button
          type="button"
          className="chip"
          onClick={() => {
            setXml(sampleMsdl);
            setViewpoint("side-blue");
          }}
        >
          Reset to template
        </button>
        <button
          type="button"
          className="chip"
          onClick={() => {
            // Clipboard reads can be refused (permissions, older browsers): then the
            // empty box takes a normal paste.
            navigator.clipboard
              ?.readText()
              .then((t) => {
                if (t.trim()) load(t);
                else throw new Error("empty");
              })
              .catch(() => {
                load("");
                setPasteNote("Paste your MSDL XML into the box (Ctrl+V / ⌘V).");
              });
          }}
        >
          Paste
        </button>
        <label className="chip file">
          Open file
          <input
            type="file"
            accept=".xml,.msdl,text/xml"
            onChange={(e) => {
              loadFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {scenario && (
          <label>
            <span>Point of view </span>
            <select
              value={viewpoint}
              onChange={(e) => setViewpoint(e.target.value)}
            >
              <option value="">none (affiliation stays *)</option>
              {scenario.forceSides.map((f) => (
                <option key={f.handle} value={f.handle}>
                  {f.name || f.handle}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <textarea
        value={xml}
        onChange={(e) => setXml(e.target.value)}
        onPaste={(e) => {
          // A whole scenario pasted anywhere in the box replaces it, rather than
          // landing in the middle of the template.
          const t = e.clipboardData.getData("text");
          if (/<MilitaryScenario[\s>]/.test(t)) {
            e.preventDefault();
            load(t);
          }
        }}
        placeholder="Paste MSDL XML here, or drop a file"
        spellCheck={false}
        rows={4}
      />
      {pasteNote && <p className="muted">{pasteNote}</p>}
      {parsed && "error" in parsed && <p className="reason">{parsed.error}</p>}
      {scenario && (
        <table className="msdl-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Name</th>
              <th>In the file</th>
              <th>Completed</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {scenario.symbols.map((s) => {
              const drawn = toRenderableSidc(s.sidc);
              return (
                <tr
                  key={`${s.kind}-${s.handle}-${s.name}`}
                  onClick={() => onPick(s.sidc)}
                  title="Open in the converter"
                >
                  <td>
                    <Symbol sidc={drawn.sidc} std="2525" />
                  </td>
                  <td>
                    {s.name || s.handle}
                    <div className="muted">{s.kind}</div>
                  </td>
                  <td>
                    <code>{s.symbolIdentifier}</code>
                  </td>
                  <td>
                    <code>{s.sidc}</code>
                  </td>
                  <td className="muted">{s.notes.join("; ")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {scenario && scenario.symbols.length === 0 && (
        <p className="muted">No units, equipment or installations found.</p>
      )}
    </details>
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
  const [accept, setAccept] = useState<Accept>("exact");
  const [strict, setStrict] = useState(false);
  const [extendedSidc, setExtendedSidc] = useState(false);

  useEffect(() => {
    history.replaceState(null, "", `#sidc=${encodeURIComponent(input)}`);
  }, [input]);

  const mod = modifier.toUpperCase();
  const options: ConversionOptions = {
    // Robust mode already shows what loss or approximation gives; these refine Strict only.
    allowLossy: strict && accept !== "exact",
    fuzzy: strict && accept === "fuzzy",
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
  const drawn = numeric
    ? null
    : toRenderableSidc(input, {
        fallback: {
          ...(affiliation && { affiliation: affiliation as AffiliationLetter }),
          ...(status && { status: status as StatusLetter }),
          ...(isSymbolModifier(mod) && { symbolModifier: mod }),
        },
      });
  // A numeric code reaches the other editions through its 2525C equivalent.
  const letter = reverse
    ? (reverse.output ?? reverse.candidates?.[0]?.output ?? null)
    : input;
  const results = letter
    ? TARGETS.map((t) => {
        const r = convertSidc(letter, { ...options, targetStandard: t.id });
        return {
          ...t,
          r,
          preview: strict ? null : previewOf(letter, r, options),
        };
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
            numeric codes, and back. Paste a code from your data to see it drawn
            in every edition, with anything the code left open filled in and
            listed. Writing codes yourself? Tick Strict to see only verified
            conversions and which characters are wrong.
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
              checked={strict}
              onChange={(e) => setStrict(e.target.checked)}
            />
            Strict
          </label>
          {strict && (
            <label>
              <span>Accept</span>
              <select
                value={accept}
                onChange={(e) => setAccept(e.target.value as Accept)}
              >
                <option value="exact">exact and equivalent only</option>
                <option value="lossy">also lossy (allowLossy)</option>
                <option value="fuzzy">also approximate (fuzzy)</option>
              </select>
            </label>
          )}
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
          <Symbol
            sidc={
              strict
                ? validation.valid && !validation.isTemplate
                  ? shown
                  : null
                : (drawn?.sidc ?? null)
            }
            std="2525"
          />
          <div>
            <h2>
              {validation.catalogEntry?.description ??
                (validation.valid ? "2525C SIDC" : "Invalid SIDC")}
            </h2>
            <p className="muted">
              <code>{shown}</code>
              {validation.isTemplate && " · template"}
            </p>
            {!strict && drawn?.sidc && drawn.sidc !== shown && (
              <p className="muted">
                Drawn as <code>{drawn.sidc}</code> (
                <code>toRenderableSidc</code>
                {drawn.filled.length > 0 &&
                  `: filled ${drawn.filled.map((f) => `${f.field} ${f.value} (${f.from})`).join(", ")}`}
                {drawn.dropped.length > 0 && `; ${drawn.dropped.join(" ")}`})
              </p>
            )}
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

      <MsdlPanel
        onPick={(sidc) => {
          setInput(sidc);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      <footer>
        Mappings from Esri JMSML and US Army mil-sym-ts; symbols drawn by
        milsymbol. Install: <code>npm install mil-symbol-converter</code>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
