// Extracts the normative SIDC catalog rows (Tables A-III, B-III, C-II, D-II, E-III, G-III) from the
// text layer of MIL-STD-2525C (17 November 2008, Distribution A: approved for public release).
import fs from "node:fs";

const ROW =
  /^\s*(\S+)\s+([SGWIOE])\s+(\S)\s+(\S)\s+(\S)\s+(\S\S)\s+(\S\S)\s+(\S\S)\s+(\S\S)\s+(\S\S)\s+(\S)\s+(\S.*)$/;

export function parse2525cCatalog(txtFile) {
  const rows = [];
  const lines = fs.readFileSync(txtFile, "utf8").split("\n");
  lines.forEach((line, i) => {
    const m = ROW.exec(line);
    if (!m) return;
    const template = m.slice(2, 12).join("");
    if (!/^[A-Z0-9*-]{15}$/.test(template)) return;
    rows.push({ template, hierarchy: m[1], description: m[12].trim(), line: i + 1 });
  });
  return rows;
}
