import { describe, expect, it, vi } from "vitest";
import {
  CHOICES_KEY,
  EMPTY_CHOICES,
  createChoicesStore,
  incomingAction,
  mergeChoices,
  parseChoices,
} from "@/lib/choices";

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, v),
  };
}

const throwing: Storage = {
  length: 0,
  clear: () => {},
  key: () => null,
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
  removeItem: () => {
    throw new Error("blocked");
  },
};

describe("parseChoices", () => {
  it("reads nothing from missing or foreign text", () => {
    for (const raw of [null, "", "not json", "null", "42", '{"compare":"a"}']) {
      expect(parseChoices(raw)).toEqual(EMPTY_CHOICES);
    }
  });

  it("keeps unique strings in order and drops a via id that is not chosen", () => {
    const raw = JSON.stringify({ compare: ["a", "b", "a", 3, "", "c"], via: ["c", "x", null] });
    expect(parseChoices(raw)).toEqual({ compare: ["a", "b", "c"], via: ["c"] });
  });
});

describe("mergeChoices", () => {
  it("keeps the saved order, then adds the link's new ids", () => {
    expect(mergeChoices({ compare: ["a", "b"], via: ["b"] }, { compare: ["c", "a"], via: ["c"] })).toEqual({
      compare: ["a", "b", "c"],
      via: ["b", "c"],
    });
  });
});

describe("incomingAction", () => {
  const saved = { compare: ["a", "b"], via: ["b"] };

  it("does nothing when the link adds nothing", () => {
    expect(incomingAction(saved, EMPTY_CHOICES)).toBe("none");
    expect(incomingAction(saved, { compare: ["b"], via: ["b"] })).toBe("none");
  });

  it("takes the link when nothing is saved", () => {
    expect(incomingAction(EMPTY_CHOICES, { compare: ["c"], via: [] })).toBe("adopt");
  });

  it("asks when the link would change a saved selection", () => {
    expect(incomingAction(saved, { compare: ["c"], via: [] })).toBe("ask");
    expect(incomingAction(saved, { compare: ["a"], via: ["a"] })).toBe("ask");
  });
});

describe("createChoicesStore", () => {
  it("reads what was saved and saves each change", () => {
    const storage = memoryStorage({ [CHOICES_KEY]: JSON.stringify({ compare: ["a"], via: [] }) });
    const store = createChoicesStore(storage);
    expect(store.get()).toEqual({ compare: ["a"], via: [] });

    store.set({ compare: ["a", "b"], via: ["b"] });
    expect(parseChoices(storage.getItem(CHOICES_KEY))).toEqual({ compare: ["a", "b"], via: ["b"] });

    store.set(EMPTY_CHOICES);
    expect(storage.getItem(CHOICES_KEY)).toBeNull();
  });

  it("returns the same object until the selection changes, and tells listeners once per change", () => {
    const store = createChoicesStore(memoryStorage());
    const listener = vi.fn();
    store.subscribe(listener);
    const first = store.get();
    store.set(EMPTY_CHOICES);
    expect(store.get()).toBe(first);
    expect(listener).not.toHaveBeenCalled();

    store.set({ compare: ["a"], via: [] });
    const second = store.get();
    store.set({ compare: ["a", "a"], via: [] });
    expect(store.get()).toBe(second);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("keeps the selection in memory when storage throws", () => {
    const store = createChoicesStore(throwing);
    expect(store.get()).toEqual(EMPTY_CHOICES);
    store.set({ compare: ["a"], via: [] });
    expect(store.get()).toEqual({ compare: ["a"], via: [] });
  });

  it("follows a change made in another tab", () => {
    const storage = memoryStorage();
    const events = new EventTarget();
    const store = createChoicesStore(storage, events as unknown as Window);
    const listener = vi.fn();
    const stop = store.subscribe(listener);

    storage.setItem(CHOICES_KEY, JSON.stringify({ compare: ["z"], via: [] }));
    events.dispatchEvent(Object.assign(new Event("storage"), { key: CHOICES_KEY }));
    expect(store.get()).toEqual({ compare: ["z"], via: [] });
    expect(listener).toHaveBeenCalledTimes(1);

    events.dispatchEvent(Object.assign(new Event("storage"), { key: "other" }));
    expect(listener).toHaveBeenCalledTimes(1);

    stop();
    storage.setItem(CHOICES_KEY, JSON.stringify({ compare: ["y"], via: [] }));
    events.dispatchEvent(Object.assign(new Event("storage"), { key: CHOICES_KEY }));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
