"use client";

import { useQueryStates } from "nuqs";
import { filterParsers } from "@/lib/filters";

/** The X-ray selection from the URL, with add and remove. No cap, duplicates dropped. Needs a Suspense boundary above it. */
export function useXray() {
  const [{ xray }, setQuery] = useQueryStates(filterParsers);
  const ids = [...new Set(xray)];

  const add = (id: string) => {
    if (!ids.includes(id)) void setQuery({ xray: [...ids, id] });
  };
  const remove = (id: string) => void setQuery({ xray: ids.filter((x) => x !== id) });
  const clear = () => void setQuery({ xray: [] });

  return { ids, has: (id: string) => ids.includes(id), add, remove, clear };
}
