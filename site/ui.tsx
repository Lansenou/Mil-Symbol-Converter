// Small shared pieces: symbol drawing, copy button, diagnostics list.
import { useMemo, useState } from "react";
import ms from "milsymbol";
import type { Diagnostic } from "../src";

export function symbolSvg(
  sidc: string,
  standard: "2525" | "APP6",
): string | null {
  try {
    const s = new ms.Symbol(sidc, { size: 44, standard });
    return s.isValid() === true ? s.asSVG() : null;
  } catch {
    return null;
  }
}

export function Symbol({
  sidc,
  std,
}: {
  sidc: string | null;
  std: "2525" | "APP6";
}) {
  const svg = useMemo(() => (sidc ? symbolSvg(sidc, std) : null), [sidc, std]);
  return svg ? (
    <div className="symbol" dangerouslySetInnerHTML={{ __html: svg }} />
  ) : (
    <div className="symbol empty" aria-hidden="true">
      —
    </div>
  );
}

export function Diagnostics({ items }: { items: Diagnostic[] }) {
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

export function Copy({ text }: { text: string }) {
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
