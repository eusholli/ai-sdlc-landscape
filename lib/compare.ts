// The compare set lives in the `compare` URL key. These helpers hold the one rule that every
// "Add to compare" entry point shares. Client-safe: no data imports.
export const MAX_COMPARE = 4;

/** Unique ids, in URL order, capped at the maximum. */
export function normalizeCompare(ids: string[]): string[] {
  return [...new Set(ids)].slice(0, MAX_COMPARE);
}

/** Append an id. When the set is full, the oldest id is dropped to make room. */
export function addToCompare(current: string[], id: string): { next: string[]; dropped: string | null } {
  const base = normalizeCompare(current);
  if (base.includes(id)) return { next: base, dropped: null };
  if (base.length < MAX_COMPARE) return { next: [...base, id], dropped: null };
  return { next: [...base.slice(1), id], dropped: base[0] };
}
