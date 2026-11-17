import type { Diagnostic, DiagnosticCode, DiagnosticSeverity } from "./types";

/** Diagnostic codes that say the output leaves out something the input said. */
const LOSS = new Set<DiagnosticCode>([
  "FIELDS_DROPPED",
  "NO_MAPPING",
  "PARENT_SYMBOL_USED",
  "UNMAPPED_STANDARD_IDENTITY",
]);

/** Messages of the non-error diagnostics that describe a loss. */
export const lostMessages = (items: readonly Diagnostic[]): string[] =>
  items
    .filter((i) => i.severity !== "error" && LOSS.has(i.code))
    .map((i) => i.message);

/** Accumulates structured diagnostics; messages are derived for the string arrays of results. */
export class DiagnosticList {
  readonly items: Diagnostic[] = [];

  add(
    severity: DiagnosticSeverity,
    code: DiagnosticCode,
    message: string,
    positions?: number[],
  ): void {
    this.items.push(
      positions
        ? { severity, code, message, positions }
        : { severity, code, message },
    );
  }
  error(code: DiagnosticCode, message: string, positions?: number[]): void {
    this.add("error", code, message, positions);
  }
  warn(code: DiagnosticCode, message: string, positions?: number[]): void {
    this.add("warning", code, message, positions);
  }
  info(code: DiagnosticCode, message: string, positions?: number[]): void {
    this.add("info", code, message, positions);
  }
  extend(items: readonly Diagnostic[]): void {
    this.items.push(...items);
  }
  hasErrors(): boolean {
    return this.items.some((i) => i.severity === "error");
  }
  messages(severity: DiagnosticSeverity): string[] {
    return this.items
      .filter((i) => i.severity === severity)
      .map((i) => i.message);
  }
}
