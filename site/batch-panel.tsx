// Batch mode: a list of codes, or a CSV column, converted in the browser and downloaded as CSV.
import { useMemo, useState } from "react";
import {
  convertSidc,
  readSidc,
  sidcToCot,
  sidcToDis,
  toRenderableSidc,
  type MatchQuality,
  type SidcStandard,
} from "../src";
import { csvLine, parseCsv } from "../src/csv";

type BatchTarget = SidcStandard | "DIS" | "CoT";
const BATCH_TARGETS: { id: BatchTarget; label: string }[] = [
  { id: "MIL-STD-2525D", label: "MIL-STD-2525D" },
  { id: "APP-6D", label: "APP-6(D)" },
  { id: "MIL-STD-2525E", label: "MIL-STD-2525E" },
  { id: "APP-6E", label: "APP-6(E)" },
  { id: "LEGACY-12", label: "12-character prefix" },
  { id: "MIL-STD-2525C", label: "MIL-STD-2525C (from anything)" },
  { id: "DIS", label: "DIS entity type" },
  { id: "CoT", label: "Cursor on Target type" },
];

const EXAMPLE = `name,sidc
Infantry company,SFGPUCI----E---
Hostile tank,SHGPEVAT-------
Template,S*G*UCI---*****
Numeric,10031000151211000000
M1A2 (DIS),1.1.225.1.1.3
CoT,a-h-G-U-C-A
Typo,SFGPUCX--------`;

interface Row {
  cells: string[];
  output: string;
  quality: MatchQuality;
  note: string;
}

/** One code to the target. Robust: complete and draw-ready; strict: verified conversions only. */
function convertOne(code: string, target: BatchTarget, strict: boolean) {
  const read = readSidc(code);
  // Letter codes go as written (the converters repair and complete them); others via 2525C.
  const letters = read.kind === "2525C" ? code : read.output;
  if (!letters)
    return {
      output: "",
      quality: read.matchQuality,
      note: read.diagnostics.find((d) => d.severity === "error")?.message ?? "",
    };
  const first = read.kind === "2525C" ? [] : read.lost;
  const done = (r: {
    output: string | null;
    matchQuality: MatchQuality;
    lost: string[];
    diagnostics: { severity: string; message: string }[];
  }) => ({
    output: r.output ?? "",
    quality: r.matchQuality,
    note: r.output
      ? [...first, ...r.lost].join(" ")
      : (r.diagnostics.find((d) => d.severity === "error")?.message ?? ""),
  });
  // Robust mode fills what the code leaves open; say when that changes the drawing.
  const robust = (targetStandard?: SidcStandard) => {
    const r = toRenderableSidc(
      letters,
      targetStandard ? { targetStandard } : {},
    );
    const assumed = r.filled
      .filter(
        (f) =>
          f.from === "default" &&
          (f.field === "standardIdentity" || f.field === "status"),
      )
      .map((f) => `${f.field} "${f.value}" assumed (none given).`);
    // As on the cards above: "assumed" when identity or status had to be guessed.
    const matchQuality =
      assumed.length > 0 &&
      (r.matchQuality === "exact" || r.matchQuality === "equivalent")
        ? ("assumed" as MatchQuality)
        : r.matchQuality;
    return { ...r, matchQuality, lost: [...assumed, ...r.lost] };
  };
  if (target === "DIS") return done(sidcToDis(letters));
  if (target === "CoT") return done(sidcToCot(letters));
  if (target === "MIL-STD-2525C")
    return done(strict ? { ...read, lost: [] } : robust());
  return done(
    strict ? convertSidc(letters, { targetStandard: target }) : robust(target),
  );
}

export function BatchPanel() {
  const [text, setText] = useState(EXAMPLE);
  const [target, setTarget] = useState<BatchTarget>("MIL-STD-2525D");
  const [strict, setStrict] = useState(false);
  const [column, setColumn] = useState("");

  const table = useMemo(() => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
    // A header row with a comma means CSV; otherwise one code per line.
    const csv = lines.length > 1 && lines[0]!.includes(",");
    const rows = csv
      ? parseCsv(text).filter((r) => r.some((c) => c !== ""))
      : lines.map((l) => [l.trim()]);
    const header = csv ? rows.shift()! : ["code"];
    const guess = header.findIndex((h) => /sidc|code|symbol/i.test(h));
    const col = Math.max(
      0,
      header.indexOf(column) >= 0 ? header.indexOf(column) : guess,
    );
    const out: Row[] = rows.map((cells) => ({
      cells,
      ...convertOne(cells[col] ?? "", target, strict),
    }));
    return { header, col, rows: out };
  }, [text, target, strict, column]);

  const counts = new Map<string, number>();
  for (const r of table.rows)
    counts.set(r.quality, (counts.get(r.quality) ?? 0) + 1);

  const download = () => {
    const name = BATCH_TARGETS.find((t) => t.id === target)!.label;
    const lines = [
      csvLine([...table.header, name, "quality", "note"]),
      ...table.rows.map((r) =>
        csvLine([...r.cells, r.output, r.quality, r.note]),
      ),
    ];
    const url = URL.createObjectURL(
      new Blob([lines.join("\n") + "\n"], { type: "text/csv" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <details className="panel batch">
      <summary>
        <h2>Batch</h2>
        <span className="muted">
          Paste a list of codes (one per line) or a CSV with a header row, or
          open a file. Everything is converted in your browser; download the
          result as CSV.
        </span>
      </summary>
      <div className="msdl-controls">
        <label className="chip file">
          Open file
          <input
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void f.text().then((t) => setText(t));
              e.target.value = "";
            }}
          />
        </label>
        <label>
          <span>To </span>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value as BatchTarget)}
          >
            {BATCH_TARGETS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        {table.header.length > 1 && (
          <label>
            <span>Column </span>
            <select
              value={table.header[table.col]}
              onChange={(e) => setColumn(e.target.value)}
            >
              {table.header.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="check">
          <input
            type="checkbox"
            checked={strict}
            onChange={(e) => setStrict(e.target.checked)}
          />
          Strict
        </label>
        <button
          type="button"
          className="chip"
          disabled={table.rows.length === 0}
          onClick={download}
        >
          Download CSV
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        rows={6}
      />
      <p className="muted">
        {table.rows.length} rows:{" "}
        {[...counts].map(([q, n]) => `${n} ${q}`).join(", ") || "none"}
        {table.rows.length > 200 && " (first 200 shown)"}
      </p>
      {table.rows.length > 0 && (
        <table className="msdl-table batch-table">
          <thead>
            <tr>
              <th>Input</th>
              <th>Output</th>
              <th>Quality</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.slice(0, 200).map((r, i) => (
              <tr key={i}>
                <td>
                  <code>{r.cells[table.col]}</code>
                </td>
                <td>
                  <code>{r.output || "-"}</code>
                </td>
                <td>
                  <span className={`badge ${r.quality}`}>{r.quality}</span>
                </td>
                <td className="muted">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </details>
  );
}
