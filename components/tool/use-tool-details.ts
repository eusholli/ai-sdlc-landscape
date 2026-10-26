"use client";

import useSWR from "swr";
import type { ToolDetailData } from "./types";

/** Each tool's /data/tools/<id>.json, or null when it failed to load. */
export type LoadedDetails = Record<string, ToolDetailData | null>;

async function fetchAll(ids: string[]): Promise<LoadedDetails> {
  const entries = await Promise.all(
    ids.map(async (id): Promise<[string, ToolDetailData | null]> => {
      try {
        const res = await fetch(`/data/tools/${encodeURIComponent(id)}.json`);
        return [id, res.ok ? ((await res.json()) as ToolDetailData) : null];
      } catch {
        return [id, null];
      }
    }),
  );
  return Object.fromEntries(entries);
}

/**
 * The full records for a set of tools, from the same static JSON the drawer reads, so a page can
 * show sources and changes without shipping the dataset. `scope` keeps one page's cache apart
 * from another's.
 */
export function useToolDetails(scope: string, ids: string[]) {
  return useSWR<LoadedDetails>(
    ids.length ? `${scope}:${ids.join(",")}` : null,
    (key: string) => fetchAll(key.slice(scope.length + 1).split(",")),
    { keepPreviousData: true, revalidateOnFocus: false },
  );
}
