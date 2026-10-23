import { FRESHNESS_LABELS, RELATION_LABELS, allTools, phases } from "@/lib/data";
import type { ToolDetailRefs } from "@/components/tool/types";

/** Server-side reference data for the tool drawer and the tool page. */
export const toolDetailRefs = (): ToolDetailRefs => ({
  phases: phases(),
  relationLabels: RELATION_LABELS,
  freshnessLabels: FRESHNESS_LABELS,
  toolIds: allTools().map((t) => t.id),
});
