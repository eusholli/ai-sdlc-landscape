"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_CHOICES, choicesStore } from "@/lib/choices";

const subscribe = (listener: () => void) => choicesStore().subscribe(listener);
const getSnapshot = () => choicesStore().get();
const getServerSnapshot = () => EMPTY_CHOICES;

/**
 * The chosen tools, saved in the browser (`lib/choices.ts`), with add and remove. No cap. `via`
 * lists the ones added from a linked suggestion on Analyze choices. Only these actions change the
 * selection; following a link never does. `ChoicesUrlSync` reads a shared link in.
 */
export function useCompare() {
  const { compare: ids, via } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = (id: string) => {
    if (!ids.includes(id)) choicesStore().set({ compare: [...ids, id], via });
  };

  /** Add a tool from a linked suggestion, so the phase it fills stays open for more. */
  const addVia = (id: string) => choicesStore().set({ compare: [...ids, id], via: [...via, id] });

  const remove = (id: string) =>
    choicesStore().set({ compare: ids.filter((x) => x !== id), via: via.filter((x) => x !== id) });

  const toggle = (id: string) => (ids.includes(id) ? remove(id) : add(id));

  const clear = () => choicesStore().set(EMPTY_CHOICES);

  return { ids, via, has: (id: string) => ids.includes(id), add, addVia, remove, toggle, clear };
}
