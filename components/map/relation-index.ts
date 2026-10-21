import type { RelationLite, RelationType } from "@/lib/types";

export interface RelationEdge {
  other: string;
  type: RelationType;
  direction: "out" | "in";
  /** False for externals, which are not tools in the census and have no tile. */
  onMap: boolean;
}

const SYMMETRIC = new Set<RelationType>(["integrates_with", "competes_with", "partners_with"]);

export const NO_EDGES: RelationEdge[] = [];

/** Edges per id. Symmetric types listed in both directions in the data count once. */
export function buildRelationIndex(
  relations: RelationLite[],
  toolIds: ReadonlySet<string>,
): Map<string, RelationEdge[]> {
  const index = new Map<string, RelationEdge[]>();
  const seen = new Set<string>();

  const push = (id: string, edge: RelationEdge) => {
    const list = index.get(id);
    if (list) list.push(edge);
    else index.set(id, [edge]);
  };

  for (const { from, to, type } of relations) {
    if (from === to) continue;
    const key = SYMMETRIC.has(type) && from > to ? `${type}|${to}|${from}` : `${type}|${from}|${to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    push(from, { other: to, type, direction: "out", onMap: toolIds.has(to) });
    push(to, { other: from, type, direction: "in", onMap: toolIds.has(from) });
  }
  return index;
}
