"use client";

import { useQueryStates } from "nuqs";
import { MAX_COMPARE, addToCompare, normalizeCompare } from "@/lib/compare";
import { filterParsers } from "@/lib/filters";
import { notify } from "@/lib/ui-events";

/**
 * The compare set from the URL, with add and remove. Adding a fifth tool replaces the oldest
 * and says so in a toast. Needs a Suspense boundary above it, like any nuqs hook.
 */
export function useCompare(nameOf?: (id: string) => string | undefined) {
  const [{ compare }, setQuery] = useQueryStates(filterParsers);
  const ids = normalizeCompare(compare);

  const add = (id: string, name?: string) => {
    const { next, dropped } = addToCompare(ids, id);
    if (next === ids || next.join() === ids.join()) return;
    void setQuery({ compare: next });
    if (!dropped) return;
    const added = name ?? nameOf?.(id);
    const removed = nameOf?.(dropped);
    const holds = `Compare holds ${MAX_COMPARE} tools.`;
    if (added && removed) notify(`${holds} ${added} replaced ${removed}.`);
    else if (added) notify(`${holds} ${added} replaced the oldest.`);
    else notify(`${holds} The oldest was replaced.`);
  };

  const remove = (id: string) => void setQuery({ compare: ids.filter((x) => x !== id) });

  const toggle = (id: string, name?: string) => (ids.includes(id) ? remove(id) : add(id, name));

  const clear = () => void setQuery({ compare: [] });

  return { ids, has: (id: string) => ids.includes(id), add, remove, toggle, clear };
}
