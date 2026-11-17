// Targets, examples and option lists of the demo.
import type { SidcStandard } from "../src";

export const TARGETS: {
  id: SidcStandard;
  label: string;
  std: "2525" | "APP6";
}[] = [
  { id: "MIL-STD-2525D", label: "MIL-STD-2525D", std: "2525" },
  { id: "APP-6D", label: "APP-6(D)", std: "APP6" },
  { id: "MIL-STD-2525E", label: "MIL-STD-2525E Ch. 1", std: "2525" },
  { id: "APP-6E", label: "APP-6(E) Ch. 2", std: "APP6" },
  { id: "LEGACY-12", label: "12-character prefix", std: "2525" },
];

export const EXAMPLES: { sidc: string; note: string }[] = [
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
  { sidc: "1.1.225.1.1.3", note: "DIS entity type (M1A2)" },
  { sidc: "a-h-G-U-C-A", note: "Cursor on Target type" },
];

export const NAMES = (o: Record<string, string>) =>
  Object.entries(o).map(([name, code]) => ({
    code,
    name: name.replace(/([a-z])([A-Z])/g, "$1 $2"),
  }));
