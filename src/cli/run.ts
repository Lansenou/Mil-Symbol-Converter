/**
 * Command-line interface. Kept free of process globals so tests can call `run` directly;
 * `bin.ts` wires it to the real process.
 */
import { parseArgs } from "node:util";
import { convertSidc } from "../converters/converter";
import { convertNumericTo2525C } from "../converters/reverse";
import { cotToSidc, sidcToCot } from "../cot";
import { disToSidc, sidcToDis } from "../dis";
import { detectInput } from "../input";
import {
  isAffiliation,
  isCountryCode,
  isOrderOfBattle,
  isStatus,
  isSymbolModifier,
} from "../codes";
import type {
  ConversionOptions,
  ConversionResult,
  SidcStandard,
} from "../types";

export interface CliIo {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  /** Whole standard input, or null when stdin is a terminal. */
  readStdin: () => Promise<string | null>;
  readFile: (path: string) => Promise<string>;
}

/** A SIDC standard, or one of the other identifiers this tool converts to. */
type Target = SidcStandard | "DIS" | "CoT";

/** What the output needs from any conversion. */
type Row = Pick<
  ConversionResult,
  "output" | "matchQuality" | "success" | "errors"
> & {
  fuzzy?: ConversionResult["fuzzy"];
  full: unknown;
};

const TARGET_ALIASES: Record<string, Target> = {
  dis: "DIS",
  cot: "CoT",
  "2525d": "MIL-STD-2525D",
  "2525e": "MIL-STD-2525E",
  "app-6d": "APP-6D",
  app6d: "APP-6D",
  "app-6e": "APP-6E",
  app6e: "APP-6E",
  "12": "LEGACY-12",
  "legacy-12": "LEGACY-12",
  "2525c": "MIL-STD-2525C",
};
const ALL: SidcStandard[] = [
  "MIL-STD-2525D",
  "APP-6D",
  "MIL-STD-2525E",
  "APP-6E",
  "LEGACY-12",
];

export const USAGE = `Usage: mil-symbol-converter [options] [SIDC ...]

Converts MIL-STD-2525C letter SIDCs to numeric 2525D/E and APP-6D/E codes, and
numeric codes back to 2525C. Without SIDC arguments, reads one code per line
from --file or standard input (or a CSV column with --csv).

Numeric codes, DIS entity types (1.1.225.1.1.3) and CoT types (a-f-G-U-C-I)
convert back to 2525C.

Options:
  -t, --to <target>       2525D (default), APP-6D, 2525E, APP-6E, 12, all,
                          DIS (entity type; aggregate type for units), CoT;
                          numeric, DIS and CoT inputs always convert to 2525C
                          (in CSV mode only with --to 2525C)
  -f, --file <path>       read codes from a file
      --csv <column>      input is CSV with a header row; convert this column and
                          append result columns
      --json              print one JSON result per line
  -l, --lossy             accept lossy conversions
      --fuzzy             approximate results with measured certainty
      --extended          allow 30-digit 2525E/APP-6E output
      --source <name>     preferred dataset when sources disagree: JMSML, mil-sym-ts
      --affiliation <c>   value for a * in position 2 (e.g. H)
      --status <c>        value for a * in position 4 (e.g. P)
      --modifier <cc>     value for ** in positions 11-12 (e.g. -E)
      --country <cc>      value for ** in positions 13-14 (e.g. US or --)
      --ob <c>            value for a * in position 15
      --strict            reject lowercase, whitespace and typographic dashes
      --force-id <n>      DIS Force ID of DIS inputs (sets the affiliation)
      --aggregate         read DIS inputs as aggregate types (units)
  -q, --quiet             no summary on stderr
  -h, --help              show this help

Exit status: 0 if every code converted, 1 if any did not, 2 on bad usage.
`;

class UsageError extends Error {}

function targetsOf(value: string | undefined): Target[] {
  if (!value) return ["MIL-STD-2525D"];
  if (value.toLowerCase() === "all") return ALL;
  const key = value.toLowerCase();
  // Own keys only: "constructor" or "__proto__" must not resolve to Object.prototype members.
  const t =
    (Object.hasOwn(TARGET_ALIASES, key) ? TARGET_ALIASES[key] : undefined) ??
    [...ALL, "MIL-STD-2525C"].find(
      (s) => s.toLowerCase() === value.toLowerCase(),
    );
  if (!t) throw new UsageError(`Unknown target "${value}".`);
  return [t as Target];
}

function optionsOf(
  v: Record<string, string | boolean | undefined>,
): ConversionOptions {
  const o: ConversionOptions = {};
  const pick = <T>(
    name: string,
    guard: (x: unknown) => x is T,
    set: (x: T) => void,
  ) => {
    const raw = v[name];
    if (typeof raw !== "string") return;
    const x = raw.toUpperCase();
    if (!guard(x)) throw new UsageError(`Invalid --${name} "${raw}".`);
    set(x);
  };
  pick("affiliation", isAffiliation, (x) => (o.affiliation = x));
  pick("status", isStatus, (x) => (o.status = x));
  pick("modifier", isSymbolModifier, (x) => (o.symbolModifier = x));
  pick("country", isCountryCode, (x) => (o.countryCode = x));
  pick("ob", isOrderOfBattle, (x) => (o.orderOfBattle = x));
  if (v.lossy) o.allowLossy = true;
  if (v.fuzzy) o.fuzzy = true;
  if (v.extended) o.extendedSidc = true;
  if (v.strict) o.strictInput = true;
  if (typeof v.source === "string") {
    const s = v.source.toLowerCase();
    if (s === "jmsml") o.preferredSource = "JMSML";
    else if (s === "mil-sym-ts") o.preferredSource = "mil-sym-ts";
    else throw new UsageError(`Invalid --source "${v.source}".`);
  }
  return o;
}

const isNumeric = (s: string) => detectInput(s) === "numeric";
const isDis = (s: string) => detectInput(s) === "dis";
const isCot = (s: string) => detectInput(s) === "cot";
/** Inputs that only convert to 2525C. */
const isForeign = (s: string) => isNumeric(s) || isDis(s) || isCot(s);

interface ExtraOptions {
  forceId?: number;
  aggregate?: boolean;
}

/** The fields the output uses, from any of the converters. */
function row(
  full: {
    matchQuality: ConversionResult["matchQuality"];
    diagnostics: { severity: string; message: string }[];
  },
  output: string | null,
): Row {
  return {
    output,
    matchQuality: full.matchQuality,
    success: output !== null,
    errors: full.diagnostics
      .filter((d) => d.severity === "error")
      .map((d) => d.message),
    full,
  };
}

function convertOne(
  code: string,
  target: Target,
  options: ConversionOptions,
  extra: ExtraOptions = {},
): Row {
  if (target === "DIS") {
    const r = sidcToDis(code);
    return row(r, r.text && (r.aggregate ? `aggregate ${r.text}` : r.text));
  }
  if (target === "CoT") {
    const r = sidcToCot(code);
    return row(r, r.cot);
  }
  if (isDis(code) && target === "MIL-STD-2525C") {
    const r = disToSidc(code.trim(), {
      ...(extra.forceId !== undefined && { forceId: extra.forceId }),
      ...(extra.aggregate && { aggregate: true }),
    });
    return row(r, r.sidc);
  }
  if (isCot(code) && target === "MIL-STD-2525C") {
    const r = cotToSidc(code.trim());
    return row(r, r.sidc);
  }
  return withFull(convertSidcOrNumeric(code, target, options));
}

const withFull = (r: ConversionResult): Row => ({ ...r, full: r });

function convertSidcOrNumeric(
  code: string,
  target: SidcStandard,
  options: ConversionOptions,
): ConversionResult {
  if (isNumeric(code) && target === "MIL-STD-2525C") {
    const r: Parameters<typeof convertNumericTo2525C>[1] = {};
    if (options.preferredSource) r.preferredSource = options.preferredSource;
    if (options.countryCode) r.countryCode = options.countryCode;
    if (options.orderOfBattle) r.orderOfBattle = options.orderOfBattle;
    if (options.strictInput) r.strictInput = true;
    return convertNumericTo2525C(code.trim(), r);
  }
  return convertSidc(code, { ...options, targetStandard: target });
}

const why = (r: Row) =>
  r.errors[0] ??
  (r.fuzzy ? `${r.fuzzy.method}, certainty ${r.fuzzy.certainty}` : "");

// ---- minimal CSV (RFC 4180: quotes, doubled quotes, embedded commas/newlines)
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
const csvField = (s: string) =>
  /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
const csvLine = (fields: string[]) => fields.map(csvField).join(",");
const short = (t: Target) => t.replace("MIL-STD-", "");

const VALUE_OPTIONS = new Set([
  "--to",
  "-t",
  "--file",
  "-f",
  "--csv",
  "--source",
  "--affiliation",
  "--status",
  "--modifier",
  "--country",
  "--ob",
  "--force-id",
]);

/** Lets option values start with "-" (modifier "-E", country "--"): "--modifier -E" -> "--modifier=-E". */
function joinValues(argv: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    const next = argv[i + 1];
    if (VALUE_OPTIONS.has(a) && next !== undefined) {
      out.push(a.startsWith("--") ? `${a}=${next}` : `${a}${next}`);
      i++;
    } else out.push(a);
  }
  return out;
}

const HINT = "Run with --help for usage.\n";

export async function run(argv: string[], io: CliIo): Promise<number> {
  let parsed;
  try {
    parsed = parseArgs({
      args: joinValues(argv),
      allowPositionals: true,
      options: {
        to: { type: "string", short: "t" },
        file: { type: "string", short: "f" },
        csv: { type: "string" },
        json: { type: "boolean" },
        lossy: { type: "boolean", short: "l" },
        fuzzy: { type: "boolean" },
        extended: { type: "boolean" },
        source: { type: "string" },
        affiliation: { type: "string" },
        status: { type: "string" },
        modifier: { type: "string" },
        country: { type: "string" },
        ob: { type: "string" },
        strict: { type: "boolean" },
        "force-id": { type: "string" },
        aggregate: { type: "boolean" },
        quiet: { type: "boolean", short: "q" },
        help: { type: "boolean", short: "h" },
      },
    });
  } catch (e) {
    io.stderr(`${(e as Error).message}\n${HINT}`);
    return 2;
  }
  const { values: v, positionals } = parsed;
  if (v.help) {
    io.stdout(USAGE);
    return 0;
  }

  let targets: Target[];
  let options: ConversionOptions;
  const extra: ExtraOptions = {};
  try {
    targets = targetsOf(v.to);
    options = optionsOf(v);
    if (v["force-id"] !== undefined) {
      const n = Number(v["force-id"]);
      if (!Number.isInteger(n) || n < 0 || n > 255)
        throw new UsageError(`Invalid --force-id "${v["force-id"]}".`);
      extra.forceId = n;
    }
    if (v.aggregate) extra.aggregate = true;
    if (positionals.length > 0 && (v.file || v.csv))
      throw new UsageError(
        "Give SIDCs as arguments or via --file/stdin, not both.",
      );
  } catch (e) {
    if (!(e instanceof UsageError)) throw e;
    io.stderr(`${e.message}\n${HINT}`);
    return 2;
  }

  let text: string | null = null;
  if (positionals.length === 0) {
    text = v.file ? await io.readFile(v.file) : await io.readStdin();
    if (text === null) {
      io.stdout(USAGE);
      return 2;
    }
  }

  const tally = new Map<string, number>();
  let failed = 0;
  let total = 0;
  const record = (r: Row) => {
    total++;
    if (!r.success) failed++;
    tally.set(r.matchQuality, (tally.get(r.matchQuality) ?? 0) + 1);
  };

  if (v.csv !== undefined) {
    const rows = parseCsv(text ?? "");
    const header = rows.shift() ?? [];
    const col = /^\d+$/.test(v.csv) ? Number(v.csv) : header.indexOf(v.csv);
    if (col < 0 || col >= Math.max(header.length, 1)) {
      io.stderr(
        `No column "${v.csv}" in the CSV header (${header.join(", ")}).\n`,
      );
      return 2;
    }
    const added = targets.flatMap((t) => [
      short(t),
      `${short(t)}_quality`,
      `${short(t)}_note`,
    ]);
    io.stdout(`${csvLine([...header, ...added])}\n`);
    for (const row of rows) {
      if (row.length === 1 && row[0] === "") continue;
      const code = row[col] ?? "";
      const cells = targets.flatMap((t) => {
        const r = convertOne(code, t, options, extra);
        record(r);
        return [r.output ?? "", r.matchQuality, why(r)];
      });
      io.stdout(`${csvLine([...row, ...cells])}\n`);
    }
  } else {
    const codes =
      positionals.length > 0
        ? positionals
        : (text ?? "").split(/\r?\n/).filter((l) => l.trim() !== "");
    for (const code of codes) {
      // Numeric codes, DIS and CoT types have one destination: 2525C.
      const ts: Target[] = isForeign(code) ? ["MIL-STD-2525C"] : targets;
      for (const t of ts) {
        const r = convertOne(code, t, options, extra);
        record(r);
        if (v.json) io.stdout(`${JSON.stringify(r.full)}\n`);
        else {
          const cols = [
            code,
            short(t),
            r.output ?? "-",
            r.matchQuality,
            why(r),
          ];
          io.stdout(`${cols.join("\t")}\n`);
        }
      }
    }
  }

  if (!v.quiet && total > 0) {
    const parts = [...tally].map(([q, n]) => `${q} ${n}`).join(", ");
    io.stderr(`${total - failed}/${total} converted (${parts})\n`);
  }
  return failed > 0 ? 1 : 0;
}
