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
 * `aggregate` (for DIS input), `direction` (heading in degrees from north: the direction of
 * movement arrow) and `speed` with `speed-unit` (a number; "km/h", "kn", "m/s" or "mph", default
 * "km/h"). After each drawing the element carries `data-quality` (the match quality, or "none"),
 * `data-anchor-x` and `data-anchor-y` (the pixel that belongs on the map position; see
 * `symbolAnchor`) and a `title` listing what the drawing leaves out.
 */
import { readSidc } from "../read";
import { toRenderableSidc } from "../render";
import type { RenderOptions } from "../render";
import { symbolAnchor, type MilsymbolSymbolLike } from "./anchor";

export { symbolAnchor, type MilsymbolSymbolLike } from "./anchor";

/** The part of milsymbol the element uses. */
export interface MilsymbolLike {
  Symbol: new (
    sidc: string,
    options: {
      size: number;
      standard?: string;
      direction?: number;
      speed?: string;
    },
  ) => { asSVG(): string; isValid(): unknown } & Partial<MilsymbolSymbolLike>;
}

const ATTRIBUTES = [
  "code",
  "size",
  "standard",
  "affiliation",
  "status",
  "force-id",
  "aggregate",
  "direction",
  "speed",
  "speed-unit",
] as const;

const SPEED_UNITS = new Set(["km/h", "kn", "m/s", "mph"]);

/** A finite number from an attribute, or undefined. */
const numberOf = (v: string | null) =>
  v !== null && v.trim() !== "" && Number.isFinite(Number(v))
    ? Number(v)
    : undefined;

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
      let anchor: { x: number; y: number } | undefined;
      if (drawn?.output) {
        const size = Number(this.getAttribute("size")) || 40;
        const standard =
          this.getAttribute("standard") === "APP6" ? "APP6" : "2525";
        const direction = numberOf(this.getAttribute("direction"));
        const speed = numberOf(this.getAttribute("speed"));
        const unit = this.getAttribute("speed-unit") ?? "km/h";
        try {
          // Only numbers and fixed unit names reach milsymbol, so the markup holds no
          // attribute text: the code is a validated SIDC and the speed is formatted here.
          const s = new ms.Symbol(drawn.output, {
            size,
            standard,
            ...(direction !== undefined && { direction }),
            ...(speed !== undefined && {
              speed: `${Math.round(speed)} ${SPEED_UNITS.has(unit) ? unit : "km/h"}`,
            }),
          });
          if (s.isValid() === true) {
            svg = s.asSVG();
            if (s.getAnchor)
              anchor = symbolAnchor(s as MilsymbolSymbolLike, drawn.output);
          }
        } catch {
          svg = "";
        }
      }
      this.root.innerHTML = svg;
      if (anchor) {
        this.dataset.anchorX = String(anchor.x);
        this.dataset.anchorY = String(anchor.y);
      } else {
        delete this.dataset.anchorX;
        delete this.dataset.anchorY;
      }
      this.dataset.quality = svg ? (drawn?.matchQuality ?? "none") : "none";
      if (svg && lost.length > 0) this.title = lost.join("\n");
      else if (!svg) this.title = why ?? "Nothing to draw";
      else this.removeAttribute("title");
    }
  }

  customElements.define(tagName, SidcSymbolElement);
  return SidcSymbolElement;
}
