"use client";

import { useQueryStates } from "nuqs";
import { normalizeCompare, splitChoices } from "@/lib/compare";
import { filterParsers } from "@/lib/filters";

/**
 * The chosen tools from the `compare` URL key, with add and remove. No cap. `via` lists the ones
 * added from a linked suggestion on Analyze choices. Needs a Suspense boundary above it, like any
 * nuqs hook.
 */
export function useCompare() {
  const [{ compare, via: rawVia }, setQuery] = useQueryStates(filterParsers);
  const ids = normalizeCompare(compare);
  const via = splitChoices(ids, rawVia).added;

  const add = (id: string) => {
    if (!ids.includes(id)) void setQuery({ compare: [...ids, id] });
  };

  /** Add a tool from a linked suggestion, so the phase it fills stays open for more. */
  const addVia = (id: string) =>
    void setQuery({ compare: ids.includes(id) ? ids : [...ids, id], via: via.includes(id) ? via : [...via, id] });

  const remove = (id: string) =>
    void setQuery({ compare: ids.filter((x) => x !== id), via: via.filter((x) => x !== id) });

  const toggle = (id: string) => (ids.includes(id) ? remove(id) : add(id));

  const clear = () => void setQuery({ compare: [], via: [] });

  return { ids, via, has: (id: string) => ids.includes(id), add, addVia, remove, toggle, clear };
}
