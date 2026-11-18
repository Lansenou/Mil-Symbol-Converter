// @vitest-environment jsdom
import ms from "milsymbol";
import { describe, expect, it } from "vitest";
import { defineSidcSymbol } from "../src/element";

defineSidcSymbol(ms);
const make = (attrs: Record<string, string>) => {
  const el = document.createElement("sidc-symbol");
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.append(el);
  return el;
};

describe("<sidc-symbol>", () => {
  it("draws a code with missing fields and says what it assumed", () => {
    const el = make({ code: "S*G*UCI---*****" });
    expect(el.shadowRoot!.innerHTML).toContain("<svg");
    expect(el.dataset.quality).toBe("exact");
  });

  it("draws DIS and CoT identifiers", () => {
    const dis = make({ code: "1.1.225.1.1.3", "force-id": "2" });
    expect(dis.shadowRoot!.innerHTML).toContain("<svg");
    expect(dis.title).toMatch(/model/);
    const cot = make({ code: "a-h-G-U-C-A" });
    expect(cot.shadowRoot!.innerHTML).toContain("<svg");
  });

  it("redraws when the code changes, and draws nothing for nonsense", () => {
    const el = make({ code: "SFGPUCI--------" });
    el.setAttribute("code", "not a code");
    expect(el.shadowRoot!.innerHTML).toBe("");
    expect(el.dataset.quality).toBe("none");
    expect(el.title).not.toBe("");
  });

  it("registers once", () => {
    expect(defineSidcSymbol(ms)).toBeUndefined();
  });
});
