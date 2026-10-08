import { useId, useState, type CSSProperties } from "react";
import type { MatchQuality, SidcStandard, WildcardPolicy } from "../types";
import { STANDARD_IDENTITIES, STATUSES } from "../legacy/fields";
import { useSidcConverter } from "./useSidcConverter";

const TARGETS: { value: SidcStandard; label: string }[] = [
  { value: "MIL-STD-2525D", label: "MIL-STD-2525D (20-digit)" },
  { value: "APP-6D", label: "APP-6(D) (20-digit)" },
  { value: "MIL-STD-2525E", label: "MIL-STD-2525E Change 1 (20-digit)" },
  { value: "APP-6E", label: "APP-6(E) Change 2 (20-digit)" },
  { value: "LEGACY-12", label: "12-character prefix (milsymbol style)" },
];

const QUALITY_COLORS: Record<MatchQuality, string> = {
  exact: "#1b5e20",
  equivalent: "#2e7d32",
  lossy: "#e65100",
  ambiguous: "#6a1b9a",
  unsupported: "#b71c1c",
};

export interface SidcConverterProps {
  initialSidc?: string;
  initialTarget?: SidcStandard;
  style?: CSSProperties;
}

/** Minimal, dependency-free converter UI. */
export function SidcConverter({
  initialSidc = "SFGPUCIC---E---",
  initialTarget = "MIL-STD-2525D",
  style,
}: SidcConverterProps) {
  const id = useId();
  const [sidc, setSidc] = useState(initialSidc);
  const [target, setTarget] = useState<SidcStandard>(initialTarget);
  const [affiliation, setAffiliation] = useState("");
  const [status, setStatus] = useState("");
  const [symbolModifier, setSymbolModifier] = useState("");
  const [wildcardPolicy, setWildcardPolicy] =
    useState<WildcardPolicy>("resolve");
  const [allowLossy, setAllowLossy] = useState(false);
  const [copied, setCopied] = useState(false);

  const result = useSidcConverter(sidc, {
    targetStandard: target,
    affiliation,
    status,
    symbolModifier,
    wildcardPolicy,
    allowLossy,
  });
  const twelve = useSidcConverter(sidc, {
    targetStandard: "LEGACY-12",
    affiliation,
    status,
    symbolModifier,
    wildcardPolicy,
    allowLossy,
  });

  const copy = async () => {
    if (
      !result.output ||
      typeof navigator === "undefined" ||
      !navigator.clipboard
    )
      return;
    await navigator.clipboard.writeText(result.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <form
      style={{ fontFamily: "system-ui, sans-serif", maxWidth: 640, ...style }}
      onSubmit={(e) => e.preventDefault()}
    >
      <label htmlFor={`${id}-sidc`}>MIL-STD-2525C SIDC (15 characters)</label>
      <input
        id={`${id}-sidc`}
        value={sidc}
        maxLength={20}
        spellCheck={false}
        onChange={(e) => setSidc(e.target.value)}
        style={{
          display: "block",
          width: "100%",
          fontFamily: "monospace",
          fontSize: 18,
        }}
        aria-invalid={!result.success}
        aria-describedby={`${id}-messages`}
      />
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 12, margin: "12px 0" }}
      >
        <label>
          Target{" "}
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value as SidcStandard)}
          >
            {TARGETS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Affiliation{" "}
          <select
            value={affiliation}
            onChange={(e) => setAffiliation(e.target.value)}
          >
            <option value="">(from SIDC)</option>
            {Object.entries(STANDARD_IDENTITIES).map(([k, v]) => (
              <option key={k} value={k}>
                {k} {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status{" "}
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">(from SIDC)</option>
            {Object.entries(STATUSES.S).map(([k, v]) => (
              <option key={k} value={k}>
                {k} {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Modifier{" "}
          <input
            value={symbolModifier}
            maxLength={2}
            size={3}
            onChange={(e) => setSymbolModifier(e.target.value)}
            placeholder="--"
          />
        </label>
        <label>
          Wildcards{" "}
          <select
            value={wildcardPolicy}
            onChange={(e) =>
              setWildcardPolicy(e.target.value as WildcardPolicy)
            }
          >
            <option value="resolve">resolve from options</option>
            <option value="preserve">preserve</option>
            <option value="reject">reject</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={allowLossy}
            onChange={(e) => setAllowLossy(e.target.checked)}
          />{" "}
          allow lossy
        </label>
      </div>

      <output htmlFor={`${id}-sidc`} style={{ display: "block" }}>
        <div>
          <strong>Result: </strong>
          <code data-testid="output">{result.output ?? "—"}</code>{" "}
          <span
            data-testid="quality"
            style={{
              color: QUALITY_COLORS[result.matchQuality],
              fontWeight: 600,
            }}
          >
            {result.matchQuality}
          </span>{" "}
          <button type="button" onClick={copy} disabled={!result.output}>
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        {target !== "LEGACY-12" && (
          <div>
            <strong>12-character form: </strong>
            <code>{twelve.output ?? "—"}</code>{" "}
            <span style={{ color: QUALITY_COLORS[twelve.matchQuality] }}>
              {twelve.matchQuality}
            </span>
          </div>
        )}
        {result.metadata?.legacyDescription && (
          <div>2525C: {result.metadata.legacyDescription}</div>
        )}
        {result.metadata?.entity && <div>Target: {result.metadata.entity}</div>}
      </output>
      <ul id={`${id}-messages`} aria-live="polite">
        {result.errors.map((m) => (
          <li key={`e-${m}`} style={{ color: "#b71c1c" }}>
            {m}
          </li>
        ))}
        {result.warnings.map((m) => (
          <li key={`w-${m}`} style={{ color: "#e65100" }}>
            {m}
          </li>
        ))}
      </ul>
    </form>
  );
}
