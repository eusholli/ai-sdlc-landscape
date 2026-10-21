import { stageOf, type StageId } from "@/lib/format";
import type { External, LayerId, PhaseId, RelationLite, RelationType, ToolLite } from "@/lib/types";

export type Isolate = { kind: "stage"; id: StageId } | { kind: "layer"; id: LayerId };

export interface GraphNode {
  id: string;
  name: string;
  external: boolean;
  logo: string | null;
  moved: boolean;
  phase: PhaseId | null;
  layer: LayerId | null;
  stage: StageId | null;
  /** Distinct relations in the whole census, whatever the toggles say. Drives node size. */
  degree: number;
  radius: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphLinkSeed {
  from: string;
  to: string;
  type: RelationType;
}

export interface GraphLinkData {
  type: RelationType;
}

export interface GraphModel {
  nodes: GraphNode[];
  nodeById: Map<string, GraphNode>;
  links: GraphLinkSeed[];
}

/** Types with a direction that reads from the tool to the thing it sits inside or belongs to. */
export const DIRECTED: ReadonlySet<RelationType> = new Set<RelationType>([
  "ships_inside",
  "built_on_model",
  "acquired_by",
]);

const SYMMETRIC: ReadonlySet<RelationType> = new Set<RelationType>([
  "integrates_with",
  "competes_with",
  "partners_with",
]);

/** A second cue next to colour, because stage and relation colours are not enough alone. */
export const LINE_STYLE: Record<RelationType, "solid" | "dashed" | "dotted"> = {
  integrates_with: "solid",
  competes_with: "dashed",
  ships_inside: "solid",
  partners_with: "dotted",
  acquired_by: "solid",
  built_on_model: "solid",
};

const GOLDEN_ANGLE = 2.399963229728653;

export function buildGraphModel(tools: ToolLite[], externals: External[], relations: RelationLite[]): GraphModel {
  const nodeById = new Map<string, GraphNode>();

  for (const t of tools) {
    const phase = t.primaryPhase;
    nodeById.set(t.id, {
      id: t.id,
      name: t.name,
      external: false,
      logo: t.logo,
      moved: t.moved,
      phase,
      layer: t.layer,
      stage: t.layer || !phase ? null : stageOf(phase),
      degree: 0,
      radius: 0,
    });
  }
  for (const e of externals) {
    nodeById.set(e.id, {
      id: e.id,
      name: e.name,
      external: true,
      logo: null,
      moved: false,
      phase: null,
      layer: null,
      stage: null,
      degree: 0,
      radius: 0,
    });
  }

  const seen = new Set<string>();
  const links: GraphLinkSeed[] = [];
  for (const { from, to, type } of relations) {
    if (from === to || !nodeById.has(from) || !nodeById.has(to)) continue;
    const key = SYMMETRIC.has(type) && from > to ? `${type}|${to}|${from}` : `${type}|${from}|${to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({ from, to, type });
    nodeById.get(from)!.degree += 1;
    nodeById.get(to)!.degree += 1;
  }

  const nodes = [...nodeById.values()].sort(
    (a, b) =>
      Number(a.external) - Number(b.external) ||
      (a.layer ?? "").localeCompare(b.layer ?? "") ||
      (a.stage ?? 9) - (b.stage ?? 9) ||
      a.name.localeCompare(b.name),
  );

  // Deterministic spiral seed: the same start every time, with same-stage tools next to each other.
  nodes.forEach((n, i) => {
    n.radius = n.external ? Math.min(2.5 + 1.1 * Math.sqrt(n.degree), 7) : Math.min(4 + 2.2 * Math.sqrt(n.degree), 22);
    const angle = i * GOLDEN_ANGLE;
    const distance = 9 * Math.sqrt(i + 1);
    n.x = Math.cos(angle) * distance;
    n.y = Math.sin(angle) * distance;
  });

  return { nodes, nodeById, links };
}

export function inIsolate(node: GraphNode, isolate: Isolate): boolean {
  if (node.external) return false;
  return isolate.kind === "stage" ? node.stage === isolate.id : node.layer === isolate.id;
}
