import type { MarketMove, PhaseId } from "@/lib/types";

/** A market move joined with the display fields of its tool, safe to pass to client components. */
export interface MoveItem {
  toolId: string;
  toolName: string;
  logo: string | null;
  phase: PhaseId | null;
  kind: MarketMove["kind"];
  acquirer: string | null;
  /** ISO date or year-month taken from the status text, or null. Never guessed. */
  date: string | null;
  status: string;
  sources: string[];
}
