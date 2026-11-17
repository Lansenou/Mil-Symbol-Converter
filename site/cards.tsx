// Result cards: one per target edition, and one per DIS or CoT identifier.
import {
  toRenderableSidc,
  type ConversionOptions,
  type ConversionResult,
  type Diagnostic,
} from "../src";
import { Copy, Diagnostics, Symbol } from "./ui";

/**
 * Robust mode: what toRenderableSidc draws when the strict conversion gives nothing, so the card
 * still shows a code and symbol and says what was assumed or left out.
 */
export function previewOf(
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

export function ResultCard({
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

/**
 * A DIS or CoT identifier for the code, or (for a DIS or CoT input) the 2525C code it becomes
 * (`sidc`: drawn too).
 */
export function IdCard({
  title,
  text,
  forceId,
  quality,
  notes,
  diagnostics,
  sidc,
}: {
  title: string;
  text: string | null;
  forceId?: number | null;
  quality: string;
  notes: string[];
  diagnostics: Diagnostic[];
  sidc?: boolean;
}) {
  const problems = diagnostics.filter((d) => d.severity !== "info");
  return (
    <article className="card">
      <header>
        <h3>{title}</h3>
        <span className={`badge ${quality}`}>{quality}</span>
      </header>
      <div className="row">
        {sidc && (
          <Symbol sidc={text && toRenderableSidc(text).sidc} std="2525" />
        )}
        <div className="code">
          {text ? (
            <>
              <code>{text}</code>
              <Copy text={text} />
              {forceId != null && <p className="name">Force ID {forceId}</p>}
              <p className="name">{notes.join("; ")}</p>
            </>
          ) : (
            <>
              <span className="muted">No output</span>
              {problems[0] && <p className="reason">{problems[0].message}</p>}
            </>
          )}
        </div>
      </div>
      {problems.length > 0 && text && <Diagnostics items={problems} />}
    </article>
  );
}
