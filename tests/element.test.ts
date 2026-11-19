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

  it("draws direction and speed, and exposes the map anchor", () => {
    const el = make({
      code: "SFGPUCI----E---",
      size: "50",
      direction: "45",
      speed: "30",
    });
    expect(el.shadowRoot!.innerHTML).toContain("30 km/h");
    // The speed text widens the SVG to the left, so x moves with the frame; y is the staff end.
    const svgX = Number(el.dataset.anchorX);
    expect(el.dataset.anchorY).toBe("122");
    el.removeAttribute("speed");
    expect(Number(el.dataset.anchorX)).toBeLessThan(svgX);
    expect([el.dataset.anchorX, el.dataset.anchorY]).toEqual(["39.5", "122"]);
    el.setAttribute("speed", "30");
    // Text in attributes never reaches the markup: speed must be a number.
    el.setAttribute("speed", "<img src=x onerror=alert(1)>");
    expect(el.shadowRoot!.innerHTML).not.toContain("<img");
    el.setAttribute("speed-unit", "<b>");
    el.setAttribute("speed", "12");
    expect(el.shadowRoot!.innerHTML).toContain("12 km/h");
    el.removeAttribute("direction");
    expect(el.dataset.anchorY).toBe("47");
  });

  it("registers once", () => {
    expect(defineSidcSymbol(ms)).toBeUndefined();
  });
});
