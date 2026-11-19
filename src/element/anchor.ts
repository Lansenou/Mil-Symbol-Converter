/**
 * Where a milsymbol symbol touches the map.
 *
 * MIL-STD-2525C 3.2.38: a staff connects a symbol with its location, and "the free end of the
 * staff indicates the location of the track or object". For ground symbols the direction of
 * movement arrow stands on such a staff, one frame height below the frame (5.3.4.1, 5.4.1 c).
 * milsymbol draws that staff but its `getAnchor()` still returns the frame center; for the
 * headquarters staff it already returns the free end. `symbolAnchor` returns the free end in both
 * cases, and milsymbol's own anchor everywhere else.
 */
import { detectInput } from "../input";

/** The part of a milsymbol `Symbol` that `symbolAnchor` reads. */
export interface MilsymbolSymbolLike {
  getAnchor(): { x: number; y: number };
  getOctagonAnchor?(): { x: number; y: number };
  options?: { direction?: unknown };
  style?: { size?: number };
  metadata?: {
    headquarters?: boolean;
    baseGeometry?: { bbox?: { y2?: number } };
  };
}

/** Numeric symbol sets drawn as ground symbols: land unit, land civilian, land equipment, installation. */
const LAND_SETS = new Set(["10", "11", "15", "20"]);

/** True for SIDCs whose direction arrow stands on a staff below the frame. */
function isGround(sidc: string): boolean {
  const s = sidc.trim();
  const kind = detectInput(s);
  if (kind === "numeric") return LAND_SETS.has(s.slice(4, 6));
  // 2525C letters: battle dimension G (ground) or F (special operations forces).
  if (kind === "2525C") return /^[A-Z*][A-Z*-][GF]/i.test(s);
  return false;
}

/**
 * The pixel of `symbol.asSVG()` that belongs on the symbol's map position, for an icon anchor
 * (Leaflet `iconAnchor`, OpenLayers `anchor`) or a CSS offset. `sidc` is the code the symbol was
 * drawn from.
 */
export function symbolAnchor(
  symbol: MilsymbolSymbolLike,
  sidc: string,
): { x: number; y: number } {
  const own = symbol.getAnchor();
  const direction = symbol.options?.direction;
  const hasArrow =
    direction !== undefined &&
    direction !== null &&
    direction !== "" &&
    Number.isFinite(Number(direction));
  // Headquarters: milsymbol already anchors at the end of the headquarters staff.
  if (!hasArrow || symbol.metadata?.headquarters || !isGround(sidc)) return own;
  const frameBottom = symbol.metadata?.baseGeometry?.bbox?.y2;
  const center = symbol.getOctagonAnchor?.();
  const size = symbol.style?.size;
  // milsymbol draws in units where the frame center is (100, 100) and `size` pixels are 100
  // units; the staff runs from the frame bottom down 100 units (one frame height).
  if (frameBottom === undefined || !center || !size) return own;
  const staffEnd = frameBottom + 100;
  return { x: center.x, y: center.y + (staffEnd - 100) * (size / 100) };
}
