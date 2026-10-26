// One page per lifecycle phase at /phases/<id>: the tools whose main phase it is, then the tools
// that also cover it. Client-safe and pure: callers pass the phases and tools in.
//
// Layer records (agent infrastructure, model providers) are left out, as on the map's phase
// columns: they cut across every phase.
import type { Phase, PhaseId } from "@/lib/types";

interface PhaseNode {
  id: string;
  name: string;
  layer: string | null;
  primaryPhase: PhaseId | null;
  phases: PhaseId[];
}

export interface PhasePage<T extends PhaseNode> {
  phase: Phase;
  /** Tools whose primary phase this is, by name. */
  primary: T[];
  /** Tools that cover this phase but list another as primary, by name. */
  alsoCovers: T[];
  prev: Phase | null;
  next: Phase | null;
}

const byName = (a: PhaseNode, b: PhaseNode) => a.name.localeCompare(b.name);

export function phasePage<T extends PhaseNode>(id: string, phases: Phase[], tools: T[]): PhasePage<T> | null {
  const ordered = [...phases].sort((a, b) => a.order - b.order);
  const index = ordered.findIndex((p) => p.id === id);
  if (index < 0) return null;
  const phase = ordered[index];
  const onMap = tools.filter((t) => !t.layer);
  return {
    phase,
    primary: onMap.filter((t) => t.primaryPhase === phase.id).sort(byName),
    alsoCovers: onMap.filter((t) => t.primaryPhase !== phase.id && t.phases.includes(phase.id)).sort(byName),
    prev: ordered[index - 1] ?? null,
    next: ordered[index + 1] ?? null,
  };
}

/** "Code review: AI tools". Reads for any label, verb or noun. */
export const phaseTitle = (phase: Pick<Phase, "label">): string => `${phase.label}: AI tools`;

const tools = (n: number) => `${n} ${n === 1 ? "tool" : "tools"}`;

/** One sentence with the counts, for the page lede and its description. */
export function phaseCountLine(page: Pick<PhasePage<PhaseNode>, "primary" | "alsoCovers">): string {
  const main = `${tools(page.primary.length)} ${page.primary.length === 1 ? "lists" : "list"} this as the main phase`;
  const more = page.alsoCovers.length;
  if (!more) return `${main}.`;
  return `${main}, and ${more} more ${more === 1 ? "tool covers" : "tools cover"} it.`;
}
