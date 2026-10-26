// The chosen tools live in the `compare` URL key, in the order they were added. Those added from a
// linked suggestion on Analyze choices are also listed in `via`, so the phase they fill stays open
// for more. Every "Add to choices" entry point and Analyze choices share these helpers. Client-safe:
// no data imports.
import type { PhaseChoice } from "@/lib/connections";
import type { AnalyzeTab } from "@/lib/filters";
import type { PhaseId } from "@/lib/types";

/** Unique ids, in URL order. */
export const normalizeCompare = (ids: string[]): string[] => [...new Set(ids)];

/**
 * The chosen tools split in two: `added` came from a linked suggestion (in `via`), `base` is the
 * rest. Gaps and suggestions are worked out from `base`, so adding a suggestion keeps its phase open.
 * A `via` id that is not chosen is ignored.
 */
export function splitChoices(ids: string[], via: string[]): { base: string[]; added: string[] } {
  const chosen = normalizeCompare(ids);
  const fromVia = new Set(via);
  return { base: chosen.filter((id) => !fromVia.has(id)), added: chosen.filter((id) => fromVia.has(id)) };
}

/**
 * The chosen tools in the phase Compare tools is focused on, or null when the phase is unknown or
 * holds fewer than two choices, so the view falls back to every choice.
 */
export function focusTools(coverage: PhaseChoice[], focus: string | null): { phase: PhaseId; ids: string[] } | null {
  const c = focus ? coverage.find((x) => x.phase === focus) : undefined;
  return c && c.tools.length >= 2 ? { phase: c.phase, ids: c.tools } : null;
}

/**
 * The Analyze choices page for a selection, on a tab ("choose" is the default and is left out),
 * optionally focused on one phase's choices.
 */
export function analyzeHref(ids: string[], tab: AnalyzeTab = "choose", via: string[] = [], focus?: PhaseId): string {
  const { added } = splitChoices(ids, via);
  const list = (xs: string[]) => normalizeCompare(xs).map(encodeURIComponent).join(",");
  const params = [
    ...(tab === "choose" ? [] : [`tab=${tab}`]),
    ...(ids.length ? [`compare=${list(ids)}`] : []),
    ...(added.length ? [`via=${list(added)}`] : []),
    ...(focus ? [`focus=${encodeURIComponent(focus)}`] : []),
  ];
  return `/analyze${params.length ? `?${params.join("&")}` : ""}`;
}
