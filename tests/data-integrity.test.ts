import { describe, expect, it } from "vitest";
import provenance from "../src/data/provenance.json";
import contested from "../src/data/contested-codes.json";
import { catalog, entityName, jmsmlRows, milsymRows, modifierName } from "../src/data/index";

describe("generated data", () => {
  it("records pinned sources", () => {
    expect(provenance.sources.JMSML.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(provenance.sources["mil-sym-ts"].commit).toMatch(/^[0-9a-f]{40}$/);
    expect(provenance.sources["MIL-STD-2525C"].sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("parsed the MIL-STD-2525C tables", () => {
    expect(catalog.length).toBeGreaterThan(2000);
    for (const c of catalog) expect(c.template).toMatch(/^[A-Z0-9*-]{15}$/);
  });

  it("every live JMSML mapping resolves to a named 2525D catalog entry", () => {
    for (const r of jmsmlRows.filter((x) => !x.retired)) {
      expect(entityName("2525D", r.symbolSet, r.entity), `${r.template}`).toBeDefined();
      expect(modifierName("2525D", r.symbolSet, 1, r.m1), `${r.template} m1`).toBeDefined();
      expect(modifierName("2525D", r.symbolSet, 2, r.m2), `${r.template} m2`).toBeDefined();
    }
  });

  it("mapping rows have well-formed keys", () => {
    for (const r of jmsmlRows) expect(r.template).toHaveLength(15);
    for (const r of milsymRows) expect(r.basic).toHaveLength(15);
  });

  it("every contested code cites its sources", () => {
    for (const c of contested.codes) {
      expect(c.claims.length).toBeGreaterThanOrEqual(2);
      expect(c.reference).not.toBe("");
    }
  });
});
