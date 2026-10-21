import type { PhaseId } from "@/lib/types";

export interface HeatmapData {
  phases: { id: PhaseId; label: string }[];
  rows: { id: string; label: string; counts: Partial<Record<PhaseId, number>> }[];
  max: number;
}
