// Connections across the lifecycle: which tools on the map a tool is linked to, phase by phase.
// Client-safe: no data import. Callers pass the nodes and relations in.
//
// Only recorded tool-to-tool links count. A direct link is one relation; a two-step path is two
// relations joined at another tool on the map. Links are never inferred from a shared external,
// such as two tools that both integrate with GitHub, and nothing here ranks tools as a "fit".
import type { LayerId, PhaseId, RelationLite, RelationType } from "@/lib/types";

/** Relation types that mean two tools work together. Competition, ownership and models do not. */
export const CONNECTING: readonly RelationType[] = ["integrates_with", "ships_inside", "partners_with"];

export interface ConnNode {
  id: string;
  kind: "tool" | "model";
  primaryPhase: PhaseId | null;
  phases: PhaseId[];
  layer: LayerId | null;
}

export interface Connection<R extends RelationLite = RelationLite> {
  tool: string;
  /**
   * Direct: one path of one step. Two-step: every path found, best evidence first. Each step is
   * a recorded relation, in the direction its record states it.
   */
  paths: { via: string | null; steps: R[] }[];
}

/** Where a connected tool is listed: its primary phase, or the agent infrastructure band. */
export type ConnGroup = PhaseId | "agent-infra";

export interface ConnectionGroup<R extends RelationLite = RelationLite> {
  group: ConnGroup;
  direct: Connection<R>[];
  twoStep: Connection<R>[];
}

const groupOf = (n: ConnNode): ConnGroup | null => n.primaryPhase ?? (n.layer === "agent-infra" ? "agent-infra" : null);

/** Phases a node covers, primary included. */
export const phasesOf = (n: ConnNode): PhaseId[] => [...new Set([...(n.primaryPhase ? [n.primaryPhase] : []), ...n.phases])];

/** How much evidence a step carries: its source count when it has sources, else one. */
const weight = (r: RelationLite) => ("sources" in r && Array.isArray(r.sources) ? r.sources.length : 1);

/** Undirected adjacency over tools only. Models and externals are left out on both ends. */
function adjacency<R extends RelationLite>(nodes: Map<string, ConnNode>, rels: R[]) {
  const adj = new Map<string, Map<string, R[]>>();
  const link = (a: string, b: string, r: R) => {
    const m = adj.get(a) ?? new Map<string, R[]>();
    m.set(b, [...(m.get(b) ?? []), r]);
    adj.set(a, m);
  };
  for (const r of rels) {
    if (!CONNECTING.includes(r.type) || r.from === r.to) continue;
    const a = nodes.get(r.from);
    const b = nodes.get(r.to);
    if (a?.kind !== "tool" || b?.kind !== "tool") continue;
    link(r.from, r.to, r);
    link(r.to, r.from, r);
  }
  return adj;
}

const best = <R extends RelationLite>(rs: R[]) => [...rs].sort((x, y) => weight(y) - weight(x))[0];

/**
 * Every tool linked to `id` directly or through one other tool, grouped by where each sits on the
 * map, in `order`. A tool reached directly is not repeated as a two-step path. Within a group,
 * the path with more sources comes first, then the name order of `nameOf`.
 */
export function connectionsFor<R extends RelationLite>(
  id: string,
  nodeList: ConnNode[],
  rels: R[],
  order: ConnGroup[],
  nameOf: (id: string) => string = (x) => x,
): ConnectionGroup<R>[] {
  const nodes = new Map(nodeList.map((n) => [n.id, n]));
  const adj = adjacency(nodes, rels);
  const first = adj.get(id) ?? new Map<string, R[]>();

  const direct: Connection<R>[] = [...first].map(([tool, rs]) => ({ tool, paths: [{ via: null, steps: [best(rs)] }] }));

  const two = new Map<string, Connection<R>>();
  for (const [via, rs1] of first) {
    for (const [tool, rs2] of adj.get(via) ?? []) {
      if (tool === id || first.has(tool)) continue;
      const c = two.get(tool) ?? { tool, paths: [] };
      c.paths.push({ via, steps: [best(rs1), best(rs2)] });
      two.set(tool, c);
    }
  }
  const score = (p: Connection<R>["paths"][number]) => Math.min(...p.steps.map(weight));
  for (const c of two.values()) c.paths.sort((a, b) => score(b) - score(a) || nameOf(a.via!).localeCompare(nameOf(b.via!)));
  const rank = (a: Connection<R>, b: Connection<R>) =>
    score(b.paths[0]) - score(a.paths[0]) || nameOf(a.tool).localeCompare(nameOf(b.tool));

  return order
    .map((group) => ({
      group,
      direct: direct.filter((c) => groupOf(nodes.get(c.tool)!) === group).sort(rank),
      twoStep: [...two.values()].filter((c) => groupOf(nodes.get(c.tool)!) === group).sort(rank),
    }))
    .filter((g) => g.direct.length || g.twoStep.length);
}

/** For each phase in `phaseIds`, the stack tools that cover it, primary or not, in stack order. */
export function stackCoverage(stack: string[], nodeList: ConnNode[], phaseIds: PhaseId[]): { phase: PhaseId; tools: string[] }[] {
  const nodes = new Map(nodeList.map((n) => [n.id, n]));
  const picked = stack.flatMap((id) => nodes.get(id) ?? []);
  return phaseIds.map((phase) => ({ phase, tools: picked.filter((n) => phasesOf(n).includes(phase)).map((n) => n.id) }));
}

/** The phases no tool in the stack covers, in `phaseIds` order. */
export const stackGaps = (stack: string[], nodeList: ConnNode[], phaseIds: PhaseId[]): PhaseId[] =>
  stackCoverage(stack, nodeList, phaseIds).filter((c) => c.tools.length === 0).map((c) => c.phase);

/**
 * For each phase the stack leaves empty, the tools covering it that have a recorded direct link to
 * a tool in the stack, with the stack tools they link to.
 */
export function gapFillers(
  stack: string[],
  gaps: PhaseId[],
  nodeList: ConnNode[],
  rels: RelationLite[],
): { phase: PhaseId; tools: { tool: string; linkedTo: string[] }[] }[] {
  const nodes = new Map(nodeList.map((n) => [n.id, n]));
  const adj = adjacency(nodes, rels);
  const inStack = new Set(stack);
  return gaps.map((phase) => {
    const found = new Map<string, Set<string>>();
    for (const s of stack) {
      for (const n of adj.get(s)?.keys() ?? []) {
        if (inStack.has(n) || !phasesOf(nodes.get(n)!).includes(phase)) continue;
        found.set(n, (found.get(n) ?? new Set()).add(s));
      }
    }
    const tools = [...found].map(([tool, to]) => ({ tool, linkedTo: [...to] }))
      .sort((a, b) => b.linkedTo.length - a.linkedTo.length || a.tool.localeCompare(b.tool));
    return { phase, tools };
  });
}

export interface PhaseChoice {
  phase: PhaseId;
  /** The chosen tools that cover the phase, added ones included, in choice order. */
  tools: string[];
  /** True when no tool in the stack covers the phase; tools added from a suggestion do not count. */
  gap: boolean;
  /** For a gap, the tools covering it that link straight to the stack, most links first. */
  suggested: { tool: string; linkedTo: string[] }[];
  /** The suggestions for this gap that are already chosen. */
  added: string[];
}

/**
 * Each phase for a set of choices split into the stack and the tools added from a suggestion
 * (`splitChoices` in `lib/compare.ts`). Gaps and suggestions come from the stack alone, so a phase
 * stays open while tools are added to it and several can be weighed side by side.
 */
export function choiceCoverage(
  stack: string[],
  added: string[],
  nodeList: ConnNode[],
  rels: RelationLite[],
  phaseIds: PhaseId[],
): PhaseChoice[] {
  const chosen = new Set([...stack, ...added]);
  const all = stackCoverage([...stack, ...added], nodeList, phaseIds);
  const gaps = stackGaps(stack, nodeList, phaseIds);
  const fill = new Map(gapFillers(stack, gaps, nodeList, rels).map((g) => [g.phase, g.tools]));
  return all.map(({ phase, tools }) => {
    const suggested = fill.get(phase) ?? [];
    return { phase, tools, gap: fill.has(phase), suggested, added: suggested.filter((s) => chosen.has(s.tool)).map((s) => s.tool) };
  });
}
