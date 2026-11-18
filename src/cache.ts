/**
 * Results cache for the conversion functions. A conversion depends only on its input string and
 * options, and the tables never change at run time, so a repeated code (datasets often hold a few
 * hundred distinct codes many times over) can be answered from memory. Each caller gets its own
 * copy, so changing a result never changes another caller's.
 */

let limit = 1000;
const caches = new Set<Map<string, unknown>>();

/** Sets how many results each converter keeps (default 1000); 0 turns the cache off. */
export function setCacheSize(size: number): void {
  limit = Math.max(0, Math.floor(size));
  for (const c of caches) c.clear();
}

/** Plain-data copy: results hold only strings, numbers, booleans, null, arrays and plain objects. */
function copy<T>(v: T): T {
  if (Array.isArray(v)) return v.map(copy) as T;
  if (v !== null && typeof v === "object") {
    const o: Record<string, unknown> = {};
    for (const k in v) o[k] = copy((v as Record<string, unknown>)[k]);
    return o as T;
  }
  return v;
}

/** Options as a key; anything unusual (getters, cycles, functions) skips the cache. */
function keyOf(input: string, options: unknown): string | null {
  if (options === undefined) return input;
  if (options === null || typeof options !== "object") return null;
  try {
    let plain = true;
    const json = JSON.stringify(options, (_, v: unknown) => {
      if (typeof v === "function" || typeof v === "symbol") plain = false;
      return v;
    });
    return plain ? `${input}\u0000${json}` : null;
  } catch {
    return null;
  }
}

/** Wraps a converter of (input, options) with a bounded, least-recently-used cache. */
export function cached<O, R>(
  fn: (input: unknown, options?: O) => R,
): (input: unknown, options?: O) => R {
  const store = new Map<string, R>();
  caches.add(store as Map<string, unknown>);
  return (input, options) => {
    const key =
      limit > 0 && typeof input === "string" ? keyOf(input, options) : null;
    if (key === null) return fn(input, options);
    const hit = store.get(key);
    if (hit !== undefined) {
      store.delete(key);
      store.set(key, hit);
      return copy(hit);
    }
    const r = fn(input, options);
    store.set(key, copy(r));
    if (store.size > limit) store.delete(store.keys().next().value!);
    return r;
  };
}
