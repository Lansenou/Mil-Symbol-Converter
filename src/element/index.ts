/**
 * `<sidc-symbol>`: a custom element that draws any SIDC, DIS or CoT identifier, for apps without
 * React (plain HTML, Vue, Angular, Svelte). It reads the code with `readSidc`, fills what is
 * missing with `toRenderableSidc` and draws the result with milsymbol, which you pass in, so this
 * package does not depend on it:
 *
 *   import ms from "milsymbol";
 *   import { defineSidcSymbol } from "mil-symbol-converter/element";
 *   defineSidcSymbol(ms);
 *   // <sidc-symbol code="S*G*UCI---*****" size="40"></sidc-symbol>
 *
 * Attributes: `code` (required), `size` (default 40), `standard` ("2525" or "APP6"),
 * `affiliation` and `status` (fallbacks used only where the code has "*"), `force-id` and
 * `aggregate` (for DIS input). After each drawing the element carries `data-quality` (the match
 * quality, or "none") and a `title` listing what the drawing leaves out.
 */
import { readSidc } from "../read";
import { toRenderableSidc } from "../render";
import type { RenderOptions } from "../render";

/** The part of milsymbol the element uses. */
export interface MilsymbolLike {
  Symbol: new (
    sidc: string,
    options: { size: number; standard?: string },
  ) => { asSVG(): string; isValid(): unknown };
}

const ATTRIBUTES = [
  "code",
  "size",
  "standard",
  "affiliation",
  "status",
  "force-id",
  "aggregate",
] as const;

/**
 * Registers the element (default tag "sidc-symbol"). Does nothing outside a browser or if the tag
 * is already defined. Returns the element class, or undefined if nothing was registered.
 */
export function defineSidcSymbol(
  ms: MilsymbolLike,
  tagName = "sidc-symbol",
): CustomElementConstructor | undefined {
  if (typeof customElements === "undefined" || customElements.get(tagName))
    return undefined;

  class SidcSymbolElement extends HTMLElement {
    static get observedAttributes() {
      return ATTRIBUTES;
    }
    private readonly root = this.attachShadow({ mode: "open" });

    connectedCallback() {
      this.draw();
    }
    attributeChangedCallback() {
      if (this.isConnected) this.draw();
    }

    private draw() {
      const code = this.getAttribute("code") ?? "";
      const forceId = Number(this.getAttribute("force-id"));
      const read = readSidc(code, {
        ...(this.hasAttribute("force-id") &&
          Number.isInteger(forceId) && { forceId }),
        aggregate: this.hasAttribute("aggregate"),
      });
      const fallback: RenderOptions["fallback"] = {};
      const affiliation = this.getAttribute("affiliation");
      const status = this.getAttribute("status");
      if (affiliation) fallback.affiliation = affiliation as never;
      if (status) fallback.status = status as never;
      // Letter codes go straight to toRenderableSidc, which also repairs and completes them.
      const source = read.kind === "2525C" ? code : read.output;
      const drawn = source ? toRenderableSidc(source, { fallback }) : null;
      const lost = [...read.lost, ...(drawn?.lost ?? [])];
      const why =
        drawn?.diagnostics.find((x) => x.severity === "error")?.message ??
        read.diagnostics[0]?.message;

      let svg = "";
      if (drawn?.output) {
        const size = Number(this.getAttribute("size")) || 40;
        const standard =
          this.getAttribute("standard") === "APP6" ? "APP6" : "2525";
        try {
          const s = new ms.Symbol(drawn.output, { size, standard });
          // The code is a validated SIDC, so the markup comes from milsymbol alone.
          if (s.isValid() === true) svg = s.asSVG();
        } catch {
          svg = "";
        }
      }
      this.root.innerHTML = svg;
      this.dataset.quality = svg ? (drawn?.matchQuality ?? "none") : "none";
      if (svg && lost.length > 0) this.title = lost.join("\n");
      else if (!svg) this.title = why ?? "Nothing to draw";
      else this.removeAttribute("title");
    }
  }

  customElements.define(tagName, SidcSymbolElement);
  return SidcSymbolElement;
}
