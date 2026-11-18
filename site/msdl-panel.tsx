// The MSDL scenario panel.
import { useMemo, useState } from "react";
import sampleMsdl from "../tests/fixtures/sample.msdl.xml?raw";
import { readMsdl, sidcToCot, sidcToDis, toRenderableSidc } from "../src";
import { Symbol } from "./ui";

/**
 * An MSDL scenario as a table of symbols. The file is read in the browser only. Drawings use the
 * toRenderableSidc result, so text from the file never reaches the SVG markup.
 */
export function MsdlPanel({ onPick }: { onPick: (sidc: string) => void }) {
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
              <th>DIS · CoT</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {scenario.symbols.map((s) => {
              const drawn = toRenderableSidc(s.sidc);
              const asDis = sidcToDis(s.sidc);
              const asCot = sidcToCot(s.sidc);
              return (
                <tr
                  key={`${s.kind}-${s.handle}-${s.name}`}
                  onClick={() => onPick(s.sidc)}
                  title="Open in the converter"
                >
                  <td>
                    <Symbol sidc={drawn.output} std="2525" />
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
                  <td>
                    <code
                      title={asDis.aggregate ? "aggregate type" : "entity type"}
                    >
                      {asDis.output ?? "-"}
                    </code>
                    <div>
                      <code>{asCot.output ?? "-"}</code>
                    </div>
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
