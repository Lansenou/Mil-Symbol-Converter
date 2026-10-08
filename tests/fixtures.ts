import data from "./fixtures/verified-sidcs.json";
import type { ConversionOptions, MatchQuality, SidcStandard } from "../src";

export interface Fixture {
  source: string;
  sourceStandard: SidcStandard;
  target: string | null;
  targetStandard: SidcStandard;
  matchQuality: MatchQuality;
  options?: ConversionOptions;
  verification: "standard" | "dataset";
  reference: string;
  notes: string;
  expectedErrorCode?: string;
}

export const fixtures = data.fixtures as Fixture[];
export const failures = data.failures as Fixture[];
