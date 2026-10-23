import type { Change, FreshnessBand, Phase, Relation, RelationType, Tool } from "@/lib/types";

export type ToolRelation = Relation & { other: string; otherName: string; direction: "out" | "in" };

/** The shape of /data/tools/<id>.json. */
export interface ToolDetailData {
  tool: Tool;
  relations: ToolRelation[];
  /** This tool's changes, newest first. */
  changes: Change[];
  /** True when the tool was added in the last 30 days. Absent in older cached responses. */
  isNew?: boolean;
}

/**
 * Small reference data the server hands to the shared detail component. RELATION_LABELS lives in
 * the server-only data module, so the client drawer cannot import it and receives it as a prop.
 */
export interface ToolDetailRefs {
  phases: Phase[];
  relationLabels: Record<RelationType, { out: string; in: string }>;
  /** What each freshness band means, for the chip's tooltip. */
  freshnessLabels: Record<FreshnessBand, string>;
  /** Ids that have their own page or drawer. Any other relation endpoint is an external. */
  toolIds: string[];
}

export type DetailVariant = "drawer" | "page";
