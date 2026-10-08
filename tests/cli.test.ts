import { describe, expect, it } from "vitest";
import { parseCsv, run } from "../src/cli/run";

async function cli(args: string[], stdin: string | null = null) {
  let out = "";
  let err = "";
  const code = await run(args, {
    stdout: (t) => (out += t),
    stderr: (t) => (err += t),
    readStdin: async () => stdin,
    readFile: async (p) => {
      if (p === "codes.txt") return "SFGPUCI--------\nSHAPMFB--------\n";
      throw new Error(`ENOENT: ${p}`);
    },
  });
  return { code, out, err, lines: out.replace(/\n$/, "").split("\n") };
}

describe("cli", () => {
  it("converts arguments, numeric ones back to 2525C", async () => {
    const r = await cli(["SFGPUCIC---E---", "10031000151211000002"]);
    expect(r.code).toBe(0);
    expect(r.lines).toEqual([
      "SFGPUCIC---E---\t2525D\t10031000151211000002\texact\t",
      "10031000151211000002\t2525C\tSFGPUCIC---E---\texact\t",
    ]);
    expect(r.err).toBe("2/2 converted (exact 2)\n");
  });

  it("--to all gives one line per target", async () => {
    const r = await cli(["-t", "all", "-q", "SFGPUCI--------"]);
    expect(r.lines.map((l) => l.split("\t")[1])).toEqual([
      "2525D",
      "APP-6D",
      "2525E",
      "APP-6E",
      "LEGACY-12",
    ]);
    expect(r.err).toBe("");
  });

  it("accepts option values starting with a dash", async () => {
    const r = await cli([
      "S*GPUCI---*****",
      "--affiliation",
      "h",
      "--modifier",
      "-E",
    ]);
    expect(r.lines[0]?.split("\t")[2]).toBe("10061000151211000000");
  });

  it("reads lines from stdin and files; exit 1 when one fails", async () => {
    const s = await cli(["-q"], "SFGPUCI--------\n\nnot-a-sidc\n");
    expect(s.code).toBe(1);
    expect(s.lines).toHaveLength(2);
    expect(s.lines[1]).toMatch(/^not-a-sidc\t2525D\t-\tunsupported\t/);
    expect((await cli(["-f", "codes.txt", "-q"])).lines).toHaveLength(2);
  });

  it("CSV: keeps the columns and appends results", async () => {
    const r = await cli(
      ["--csv", "sidc", "-q"],
      'name,sidc\n"Inf, 1st",SFGPUCI--------\nBad,XYZ\n',
    );
    expect(r.code).toBe(1);
    expect(parseCsv(r.out)).toEqual([
      ["name", "sidc", "2525D", "2525D_quality", "2525D_note"],
      ["Inf, 1st", "SFGPUCI--------", "10031000001211000000", "exact", ""],
      ["Bad", "XYZ", "", "unsupported", expect.stringMatching(/15 characters/)],
    ]);
  });

  it("--json prints the full result", async () => {
    const r = await cli(["--json", "-q", "SFGPUCI--------"]);
    expect(JSON.parse(r.out)).toMatchObject({
      output: "10031000001211000000",
      matchQuality: "exact",
    });
  });

  it.each([
    [["--to", "nope", "X"], /Unknown target/],
    [["--affiliation", "Q", "X"], /Invalid --affiliation/],
    [["--bogus"], /Unknown option/],
    [["--csv", "missing"], /No column/],
  ])("usage errors exit 2: %j", async (args, msg) => {
    const r = await cli(args, "a,b\n");
    expect(r.code).toBe(2);
    expect(r.err).toMatch(msg);
  });

  it("prints help", async () => {
    const r = await cli(["--help"]);
    expect([r.code, r.out]).toEqual([0, expect.stringMatching(/^Usage:/)]);
  });

  it("parseCsv handles quotes, doubled quotes and CRLF", () => {
    expect(parseCsv('a,"b ""x"", c"\r\n1,2\r\n')).toEqual([
      ["a", 'b "x", c'],
      ["1", "2"],
    ]);
  });
});
