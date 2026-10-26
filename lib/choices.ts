// The chosen tools are saved in the browser, so only an explicit add, remove or clear changes them.
// A link that leaves out `compare` and `via` cannot drop them. The URL is how a selection is shared:
// Analyze choices writes it there, and a link that carries one is read in (`incomingAction`).
// Client-safe: no data imports.
import { normalizeCompare, splitChoices } from "@/lib/compare";

export interface Choices {
  compare: string[];
  via: string[];
}

export const EMPTY_CHOICES: Choices = Object.freeze({ compare: [], via: [] }) as Choices;

export const CHOICES_KEY = "aisdlc:choices:v1";

const strings = (x: unknown): string[] => (Array.isArray(x) ? x.filter((v): v is string => typeof v === "string" && v !== "") : []);

/** Unique chosen ids, with `via` kept to the chosen ones, in chosen order. */
export function cleanChoices(compare: string[], via: string[]): Choices {
  const ids = normalizeCompare(compare);
  return { compare: ids, via: splitChoices(ids, via).added };
}

/** A saved selection, or none when the saved text is missing or not ours. */
export function parseChoices(raw: string | null): Choices {
  if (!raw) return EMPTY_CHOICES;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return EMPTY_CHOICES;
    const { compare, via } = value as Record<string, unknown>;
    return cleanChoices(strings(compare), strings(via));
  } catch {
    return EMPTY_CHOICES;
  }
}

/** Both selections: the saved ones first, then the new ids from the link. */
export function mergeChoices(saved: Choices, incoming: Choices): Choices {
  return cleanChoices([...saved.compare, ...incoming.compare], [...saved.via, ...incoming.via]);
}

export const sameChoices = (a: Choices, b: Choices): boolean =>
  a.compare.join(",") === b.compare.join(",") && a.via.join(",") === b.via.join(",");

/**
 * What to do with a selection read from a link. Nothing new in it: nothing to do. Nothing saved:
 * take it. Otherwise ask, since taking it would change a selection the user made.
 */
export function incomingAction(saved: Choices, link: Choices): "none" | "adopt" | "ask" {
  const have = new Set(saved.compare);
  const haveVia = new Set(saved.via);
  const isNew = link.compare.some((id) => !have.has(id)) || link.via.some((id) => !haveVia.has(id));
  if (!isNew) return "none";
  return saved.compare.length === 0 ? "adopt" : "ask";
}

type Events = Pick<Window, "addEventListener" | "removeEventListener">;

export interface ChoicesStore {
  get: () => Choices;
  set: (next: Choices) => void;
  subscribe: (listener: () => void) => () => void;
}

/**
 * The saved selection, for `useSyncExternalStore`. `get` returns the same object until the
 * selection changes. Storage can be missing or throw (private windows, blocked site data); the
 * selection then lives in memory for the visit. A change in another tab arrives as a `storage` event.
 */
export function createChoicesStore(storage: Storage | null, events: Events | null = null): ChoicesStore {
  const read = (): Choices => {
    try {
      return parseChoices(storage?.getItem(CHOICES_KEY) ?? null);
    } catch {
      return EMPTY_CHOICES;
    }
  };
  let current = read();
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((l) => l());

  const onStorage = (event: Event) => {
    const key = (event as StorageEvent).key;
    if (key !== null && key !== CHOICES_KEY) return;
    const next = read();
    if (sameChoices(next, current)) return;
    current = next;
    notify();
  };

  return {
    get: () => current,
    set: (next) => {
      const clean = cleanChoices(next.compare, next.via);
      if (sameChoices(clean, current)) return;
      current = clean.compare.length ? clean : EMPTY_CHOICES;
      try {
        if (current.compare.length) storage?.setItem(CHOICES_KEY, JSON.stringify(current));
        else storage?.removeItem(CHOICES_KEY);
      } catch {
        // Kept in memory for this visit.
      }
      notify();
    },
    subscribe: (listener) => {
      if (listeners.size === 0) events?.addEventListener("storage", onStorage);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) events?.removeEventListener("storage", onStorage);
      };
    },
  };
}

let browserStore: ChoicesStore | null = null;

/** The one store for this page, made on first use in the browser. */
export function choicesStore(): ChoicesStore {
  if (!browserStore) {
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }
    browserStore = createChoicesStore(storage, window);
  }
  return browserStore;
}
