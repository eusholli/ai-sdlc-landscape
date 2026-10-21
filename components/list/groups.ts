import { phaseColor } from "@/lib/format";
import type { Layer, Phase, ToolLite } from "@/lib/types";

export interface Group {
  id: string;
  label: string;
  colour: string;
  tools: ToolLite[];
}

const byName = (a: ToolLite, b: ToolLite) => a.name.localeCompare(b.name);

/** Platforms first, then the phases in lifecycle order, then the layers when they are shown. */
export function buildGroups(
  tools: ToolLite[],
  phases: Phase[],
  layers: Layer[],
  fullLifecycleIds: string[],
  showLayers: boolean,
): Group[] {
  const platformIds = new Set(fullLifecycleIds);
  const platforms = tools.filter((t) => platformIds.has(t.id)).sort(byName);
  const phaseGroups = [...phases]
    .sort((a, b) => a.order - b.order)
    .map((phase) => ({
      id: phase.id,
      label: phase.label,
      colour: phaseColor(phase.id),
      tools: tools.filter((t) => !t.layer && !platformIds.has(t.id) && t.primaryPhase === phase.id).sort(byName),
    }));
  const layerGroups = showLayers
    ? layers.map((layer) => ({
        id: `layer-${layer.id}`,
        label: layer.label,
        colour: "var(--muted-foreground)",
        tools: tools.filter((t) => t.layer === layer.id).sort(byName),
      }))
    : [];
  return [
    { id: "platforms", label: "Full-lifecycle platforms", colour: "var(--muted-foreground)", tools: platforms },
    ...phaseGroups,
    ...layerGroups,
  ];
}
