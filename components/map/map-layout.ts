import type { CSSProperties } from "react";
import { PHASE_ORDER } from "@/lib/filters";
import type { PhaseId } from "@/lib/types";

export const COL_W = 160;
export const COL_GAP = 10;
export const WORLD_PAD = 24;
export const TILE_W = 70;

export const GRID_W = PHASE_ORDER.length * COL_W + (PHASE_ORDER.length - 1) * COL_GAP;
export const WORLD_W = GRID_W + WORLD_PAD * 2;

/** The one grid every full-width row shares, so bars, stage headers and columns line up. */
export const COLUMN_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: `repeat(${PHASE_ORDER.length}, ${COL_W}px)`,
  columnGap: COL_GAP,
};

export interface CoverageRun {
  start: number;
  end: number;
  phases: PhaseId[];
}

/** Contiguous stretches of PHASE_ORDER a tool covers. A skipped phase ends one run and starts another. */
export function coverageRuns(covered: PhaseId[]): CoverageRun[] {
  const runs: CoverageRun[] = [];
  let start = -1;
  PHASE_ORDER.forEach((phase, i) => {
    const has = covered.includes(phase);
    if (has && start === -1) start = i;
    if (start !== -1 && (!has || i === PHASE_ORDER.length - 1)) {
      const end = has ? i : i - 1;
      runs.push({ start, end, phases: PHASE_ORDER.slice(start, end + 1) });
      start = -1;
    }
  });
  return runs;
}
