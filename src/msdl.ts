/**
 * Reads the symbols of an MSDL scenario (SISO-STD-007-2008, Military Scenario Definition Language)
 * as complete MIL-STD-2525C SIDCs.
 *
 * MSDL stores unit and equipment symbols as 15-character 2525B codes with "-" in the fields it
 * keeps elsewhere: affiliation (from the relationships between force sides), status (Present) and
 * country. Echelons are a separate element. `readMsdl` puts those back, so each code can go to
 * `toRenderableSidc`, `convertSidc` or a renderer. Affiliation depends on the point of view: pass
 * `viewpoint` (a force side's handle or name) to get friend/hostile/...; without it, it stays "*".
 *
 * Written from the element descriptions in the standard; no schema file is copied or required.
 */

export interface MsdlForceSide {
  handle: string;
  name: string;
  /** The force or side this one shows allegiance to; absent for top-level sides. */
  allegianceHandle?: string;
  /** Relationship to other force sides, as JC3IEDM hostility codes (FR, HO, NEUTRL, ...). */
  relationships: Record<string, string>;
}

export interface MsdlSymbol {
  kind: "unit" | "equipment" | "installation";
  handle: string;
  name: string;
  /** The SymbolIdentifier as written in the file. */
  symbolIdentifier: string;
  /** Force side the object belongs to (through its command or organic chain), if found. */
  forceSideHandle?: string;
  /** The SIDC with affiliation, status and echelon filled in where the file gives them. */
  sidc: string;
  /** What was filled in, and anything that could not be (as text). */
  notes: string[];
}

export interface MsdlScenario {
  forceSides: MsdlForceSide[];
  symbols: MsdlSymbol[];
}

export interface MsdlOptions {
  /** Force side (handle or name) whose point of view decides affiliation. */
  viewpoint?: string;
}

// ---- minimal XML reader (elements and text; namespace prefixes and attributes are ignored)

interface XmlNode {
  name: string;
  children: XmlNode[];
  text: string;
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};
const decode = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e: string) => {
    if (e[0] !== "#") return ENTITIES[e] ?? m;
    const cp =
      e[1] === "x" || e[1] === "X"
        ? parseInt(e.slice(2), 16)
        : parseInt(e.slice(1), 10);
    return cp <= 0x10ffff ? String.fromCodePoint(cp) : m;
  });

/**
 * Linear-time scanner: every step moves past what it read, so hostile input (thousands of "<",
 * unclosed comments) cannot make it slow.
 */
function parseXml(xml: string): XmlNode {
  const root: XmlNode = { name: "#document", children: [], text: "" };
  const stack = [root];
  const top = () => stack[stack.length - 1]!;
  const until = (end: string, from: number, what: string) => {
    const j = xml.indexOf(end, from);
    if (j < 0) throw new Error(`MSDL: unterminated ${what}`);
    return j;
  };
  let i = 0;
  while (i < xml.length) {
    const lt = xml.indexOf("<", i);
    if (lt < 0) {
      top().text += decode(xml.slice(i));
      break;
    }
    if (lt > i) top().text += decode(xml.slice(i, lt));
    if (xml.startsWith("<!--", lt)) i = until("-->", lt + 4, "comment") + 3;
    else if (xml.startsWith("<?", lt)) i = until("?>", lt + 2, "<?") + 2;
    else if (xml.startsWith("<![CDATA[", lt)) {
      const end = until("]]>", lt + 9, "CDATA section");
      top().text += xml.slice(lt + 9, end);
      i = end + 3;
    } else if (xml.startsWith("<!", lt)) i = until(">", lt + 2, "<!") + 1;
    else if (xml.startsWith("</", lt)) {
      const end = until(">", lt + 2, "end tag");
      const name = local(xml.slice(lt + 2, end).trim());
      if (stack.length > 1 && top().name === name) stack.pop();
      else throw new Error(`MSDL: unexpected </${name}>`);
      i = end + 1;
    } else {
      // Start tag: find its ">" outside quoted attribute values.
      let j = lt + 1;
      let quote = "";
      for (; j < xml.length; j++) {
        const c = xml[j]!;
        if (quote) {
          if (c === quote) quote = "";
        } else if (c === '"' || c === "'") quote = c;
        else if (c === ">") break;
      }
      if (j >= xml.length) throw new Error("MSDL: unterminated start tag");
      const selfClosing = xml[j - 1] === "/";
      const name = /^[^\s/>]+/.exec(xml.slice(lt + 1, j))?.[0];
      if (!name) throw new Error("MSDL: empty tag name");
      const node: XmlNode = { name: local(name), children: [], text: "" };
      top().children.push(node);
      if (!selfClosing) stack.push(node);
      i = j + 1;
    }
  }
  if (stack.length > 1) throw new Error(`MSDL: <${top().name}> is not closed`);
  return root;
}
const local = (n: string) => n.slice(n.indexOf(":") + 1);

const child = (n: XmlNode | undefined, name: string) =>
  n?.children.find((c) => c.name === name);
/** Text of the element at a path of child names, trimmed. */
const textAt = (n: XmlNode | undefined, ...path: string[]) => {
  let cur = n;
  for (const p of path) cur = child(cur, p);
  return cur?.text.trim() || undefined;
};
function* descendants(n: XmlNode, name: string): Generator<XmlNode> {
  for (const c of n.children) {
    if (c.name === name) yield c;
    yield* descendants(c, name);
  }
}

// ---- MSDL values to 2525C letters

/**
 * JC3IEDM object-item hostility status codes to 2525C standard identity. AIV/IV (involved) and
 * ANT (antagonist) have no 2525C counterpart and stay "*".
 */
export const MSDL_HOSTILITY_TO_AFFILIATION: Readonly<Record<string, string>> = {
  FR: "F",
  AFR: "A",
  HO: "H",
  AHO: "S", // assumed hostile: 2525C has no such identity; suspect is the closest
  SUSPCT: "S",
  NEUTRL: "N",
  PENDNG: "P",
  UNK: "U",
  JOKER: "J",
  FAKER: "K",
};

const BASE_AFFILIATION: Record<string, string> = {
  FRIEND: "F",
  HOSTILE: "H",
  NEUTRAL: "N",
  UNKNOWN: "U",
};

/** MSDL echelons to 2525C position 12 (Table A-II), merging the service-specific names. */
const ECHELON: Record<string, string> = {
  NONE: "-",
  TEAM: "A",
  CREW: "A",
  SQUAD: "B",
  SECTION: "C",
  PLATOON: "D",
  DETACHMENT: "D",
  COMPANY: "E",
  BATTERY: "E",
  TROOP: "E",
  BATTALION: "F",
  SQUADRON: "F",
  REGIMENT: "G",
  GROUP: "G",
  BRIGADE: "H",
  DIVISION: "I",
  CORPS: "J",
  ARMY: "K",
  ARMYGROUP: "L",
  FRONT: "L",
  REGION: "M",
};

const set = (s: string, pos: number, c: string) =>
  `${s.slice(0, pos - 1)}${c}${s.slice(pos)}`;

/**
 * Reads the force sides, units, equipment and installations of an MSDL document. Throws on XML it
 * cannot read; objects without a 15-character SymbolIdentifier are skipped.
 */
export function readMsdl(xml: string, options: MsdlOptions = {}): MsdlScenario {
  const doc = parseXml(xml);

  const forceSides: MsdlForceSide[] = [...descendants(doc, "ForceSide")].map(
    (fs) => {
      const relationships: Record<string, string> = {};
      for (const a of descendants(fs, "Association")) {
        const other = textAt(a, "AffiliateHandle");
        const rel = textAt(a, "Relationship");
        if (other && rel) relationships[other] = rel;
      }
      const side: MsdlForceSide = {
        handle: textAt(fs, "ObjectHandle") ?? "",
        name: textAt(fs, "ForceSideName") ?? "",
        relationships,
      };
      const allegiance = textAt(fs, "AllegianceHandle");
      if (allegiance) side.allegianceHandle = allegiance;
      return side;
    },
  );
  const sideByHandle = new Map(forceSides.map((s) => [s.handle, s]));
  /** The chain from a force side up through its allegiances (the side itself first). */
  const sideChain = (handle: string | undefined) => {
    const chain: MsdlForceSide[] = [];
    for (
      let s = handle ? sideByHandle.get(handle) : undefined;
      s && !chain.includes(s);
      s = s.allegianceHandle ? sideByHandle.get(s.allegianceHandle) : undefined
    )
      chain.push(s);
    return chain;
  };

  const viewpoint = options.viewpoint
    ? forceSides.find(
        (s) => s.handle === options.viewpoint || s.name === options.viewpoint,
      )
    : undefined;
  if (options.viewpoint && !viewpoint)
    throw new Error(`MSDL: no force side "${options.viewpoint}"`);

  /** Affiliation letter of a force side seen from the viewpoint, or undefined. */
  const affiliationOf = (
    sideHandle: string | undefined,
  ): string | undefined => {
    if (!viewpoint) return undefined;
    const theirs = sideChain(sideHandle);
    const mine = sideChain(viewpoint.handle);
    if (theirs.length === 0) return undefined;
    if (theirs.some((s) => mine.includes(s))) return "F";
    // Most specific association first: from my force (or side) to theirs.
    for (const m of mine)
      for (const t of theirs) {
        const rel = m.relationships[t.handle];
        if (rel) return MSDL_HOSTILITY_TO_AFFILIATION[rel];
      }
    return undefined;
  };

  // Units: the force side through the command chain (or the organic chain).
  const units = [...descendants(doc, "Unit")];
  const unitByHandle = new Map(
    units.map((u) => [textAt(u, "ObjectHandle") ?? "", u]),
  );
  const unitSide = (
    u: XmlNode,
    seen = new Set<XmlNode>(),
  ): string | undefined => {
    if (seen.has(u)) return undefined;
    seen.add(u);
    const relations = child(u, "Relations");
    const direct =
      textAt(
        relations,
        "ForceRelation",
        "ForceRelationData",
        "ForceSideHandle",
      ) ??
      textAt(
        relations,
        "OrganicRelation",
        "OrganicRelationData",
        "OrganicForceSideHandle",
      );
    if (direct) return direct;
    const superior =
      textAt(
        relations,
        "ForceRelation",
        "ForceRelationData",
        "CommandRelation",
        "CommandingSuperiorHandle",
      ) ??
      textAt(
        relations,
        "OrganicRelation",
        "OrganicRelationData",
        "OrganicSuperiorHandle",
      );
    const up = superior ? unitByHandle.get(superior) : undefined;
    return up ? unitSide(up, seen) : undefined;
  };
  const ownerSide = (owner: XmlNode | undefined) => {
    const force = textAt(owner, "OwnerData", "ForceOwnerHandle");
    if (force) return force;
    const unit = textAt(owner, "OwnerData", "UnitOwnerHandle");
    const u = unit ? unitByHandle.get(unit) : undefined;
    return u ? unitSide(u) : undefined;
  };

  const symbols: MsdlSymbol[] = [];
  const add = (
    kind: MsdlSymbol["kind"],
    n: XmlNode,
    side: string | undefined,
    fixedAffiliation?: string,
  ) => {
    const raw = textAt(n, "SymbolIdentifier");
    if (!raw || raw.length !== 15) return;
    const notes: string[] = [];
    let sidc = raw.toUpperCase();
    // Affiliation (position 2): from the relationships, or the installation's own element.
    if (sidc[1] === "-" || sidc[1] === "*") {
      const aff = fixedAffiliation ?? affiliationOf(side);
      sidc = set(sidc, 2, aff ?? "*");
      if (aff)
        notes.push(`affiliation ${aff} from the force side relationships`);
      else
        notes.push(
          viewpoint
            ? "affiliation unknown: no relationship to this force side in the file"
            : "affiliation left as *: pass viewpoint to resolve it",
        );
    }
    // Status (position 4): MSDL says Present.
    if (sidc[3] === "-") sidc = set(sidc, 4, "P");
    // Echelon (position 12) for units.
    const echelon = textAt(n, "UnitSymbolModifiers", "Echelon")?.toUpperCase();
    const ech = echelon ? ECHELON[echelon] : undefined;
    if (kind === "unit" && ech && ech !== "-" && "-*".includes(sidc[11]!)) {
      sidc = set(sidc, 12, ech);
      if (sidc[10] === "*") sidc = set(sidc, 11, "-");
      notes.push(`echelon ${echelon} (${ech})`);
    }
    const sym: MsdlSymbol = {
      kind,
      handle: textAt(n, "ObjectHandle") ?? "",
      name: textAt(n, "Name") ?? "",
      symbolIdentifier: raw,
      sidc,
      notes,
    };
    if (side) sym.forceSideHandle = side;
    symbols.push(sym);
  };

  for (const u of units) add("unit", u, unitSide(u));
  for (const e of descendants(doc, "EquipmentItem")) {
    const relations = child(e, "Relations");
    const superior = textAt(relations, "OrganicSuperiorHandle");
    const up = superior ? unitByHandle.get(superior) : undefined;
    add(
      "equipment",
      e,
      ownerSide(child(relations, "HoldingOrganization")) ??
        (up ? unitSide(up) : undefined),
    );
  }
  for (const i of descendants(doc, "Installation")) {
    const base = textAt(i, "Affiliation")?.toUpperCase();
    add(
      "installation",
      i,
      ownerSide(child(i, "Owner")),
      base ? BASE_AFFILIATION[base] : undefined,
    );
  }

  return { forceSides, symbols };
}
