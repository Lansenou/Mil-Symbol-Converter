import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AffiliationLetter,
  StatusLetter,
  convertNumericTo2525C,
  convertSidc,
  cotToSidc,
  detectInput,
  disToSidc,
  isSymbolModifier,
  sidcToCot,
  sidcToDis,
  toRenderableSidc,
  validateSidc,
  type ConversionOptions,
} from "../src";
import { BatchPanel } from "./batch-panel";
import { IdCard, ResultCard, previewOf } from "./cards";
import { EXAMPLES, NAMES, TARGETS } from "./data";
import { MsdlPanel } from "./msdl-panel";
import { Diagnostics, Symbol } from "./ui";

/** How much a Strict result may differ from the input; fuzzy implies lossy. */
type Accept = "exact" | "lossy" | "fuzzy";

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
  const [forceId, setForceId] = useState("");
  const [aggregate, setAggregate] = useState(false);

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
  const raw = input.trim();
  // A DIS entity type ("1.1.225.1.1.3") or CoT type ("a-f-G-U-C-I") goes through the 2525C code
  // it becomes.
  const kind = detectInput(raw);
  const fromDis =
    kind === "dis"
      ? disToSidc(raw, {
          ...(forceId !== "" && { forceId: Number(forceId) }),
          aggregate,
        })
      : null;
  const fromCot = kind === "cot" ? cotToSidc(raw) : null;
  const foreign = fromDis ?? fromCot;
  const code = foreign ? (foreign.sidc ?? "") : input;
  const trimmed = code.trim();
  const numeric = detectInput(trimmed) === "numeric";
  const toDis = foreign || !trimmed ? null : sidcToDis(trimmed);
  const toCot = foreign || !trimmed ? null : sidcToCot(trimmed);

  const validation = numeric || !trimmed ? null : validateSidc(code);
  const reverse = numeric ? convertNumericTo2525C(trimmed) : null;
  const drawn = numeric
    ? null
    : toRenderableSidc(code, {
        fallback: {
          ...(affiliation && { affiliation: affiliation as AffiliationLetter }),
          ...(status && { status: status as StatusLetter }),
          ...(isSymbolModifier(mod) && { symbolModifier: mod }),
        },
      });
  // A numeric code reaches the other editions through its 2525C equivalent.
  const letter = reverse
    ? (reverse.output ?? reverse.candidates?.[0]?.output ?? null)
    : code;
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
  const shown = validation?.normalized ?? code;

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
          <span>
            SIDC (15-character 2525C, or 20/30-digit numeric), DIS entity type
            or Cursor on Target type
          </span>
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
          {fromDis && (
            <>
              <label>
                <span>DIS Force ID</span>
                <select
                  value={forceId}
                  onChange={(e) => setForceId(e.target.value)}
                >
                  <option value="">none (affiliation stays *)</option>
                  <option value="1">1 Friendly</option>
                  <option value="2">2 Opposing</option>
                  <option value="3">3 Neutral</option>
                  <option value="0">0 Other</option>
                </select>
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={aggregate}
                  onChange={(e) => setAggregate(e.target.checked)}
                />
                Aggregate type (unit)
              </label>
            </>
          )}
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

      {(results.length > 0 || foreign || toDis) && (
        <section className="grid">
          {foreign && (
            <IdCard
              sidc
              title={
                fromDis
                  ? aggregate
                    ? "From DIS aggregate type"
                    : "From DIS entity type"
                  : "From CoT type"
              }
              text={foreign.sidc}
              quality={foreign.matchQuality}
              notes={foreign.notes}
              diagnostics={foreign.diagnostics}
            />
          )}
          {results.map(({ id, label, std, r, preview }) => (
            <ResultCard
              key={id}
              label={label}
              std={std}
              r={r}
              preview={preview}
            />
          ))}
          {toCot && (
            <IdCard
              title="Cursor on Target type"
              text={toCot.cot}
              quality={toCot.matchQuality}
              notes={toCot.dropped}
              diagnostics={toCot.diagnostics}
            />
          )}
          {toDis && (
            <IdCard
              title={toDis.aggregate ? "DIS aggregate type" : "DIS entity type"}
              text={toDis.text}
              forceId={toDis.forceId}
              quality={toDis.matchQuality}
              notes={toDis.notes}
              diagnostics={toDis.diagnostics}
            />
          )}
        </section>
      )}

      <BatchPanel />

      <MsdlPanel
        onPick={(sidc) => {
          setInput(sidc);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      <footer>
        Mappings from Esri JMSML and US Army mil-sym-ts; DIS enumerations from
        SISO-REF-010, reprinted with permission from SISO Inc.; symbols drawn by
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
