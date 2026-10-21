"use client";

import { motion } from "motion/react";
import { useQueryStates } from "nuqs";
import { useCallback, useMemo } from "react";
import { applyFilters, filterParsers, isFiltered } from "@/lib/filters";
import { cn } from "@/lib/utils";
import type { Layer, LayerId, Phase, PhaseId, RelationLite, ToolLite } from "@/lib/types";
import { LayerBands, type LayerBand } from "./layer-bands";
import { MapControls } from "./map-controls";
import { WORLD_PAD, WORLD_W } from "./map-layout";
import { PhaseColumns } from "./phase-columns";
import { PlatformBars } from "./platform-bars";
import { usePanZoom } from "./use-pan-zoom";

export interface LandscapeMapProps {
  tools: ToolLite[];
  relations: RelationLite[];
  phases: Phase[];
  layers: Layer[];
  fullLifecycleIds: string[];
}

export function LandscapeMap(props: LandscapeMapProps) {
  const [{ view }] = useQueryStates(filterParsers);
  if (view !== "map") {
    return (
      <p className="mx-auto max-w-3xl p-8 text-sm text-muted-foreground">
        The {view} view is not built yet. Choose Map to see the landscape.
      </p>
    );
  }
  return <MapCanvas {...props} />;
}

function MapCanvas({ tools, phases, layers, fullLifecycleIds }: LandscapeMapProps) {
  const [query, setQuery] = useQueryStates(filterParsers);
  const { viewportRef, worldRef, x, y, scale, zoomLevel, dragging, zoomIn, zoomOut, fit, viewportProps } = usePanZoom();

  const { byPhase, platforms, bands } = useMemo(() => {
    const platformIds = new Set(fullLifecycleIds);
    const byId = new Map(tools.map((t) => [t.id, t]));
    const byPhase = Object.fromEntries(phases.map((p) => [p.id, [] as ToolLite[]])) as Record<PhaseId, ToolLite[]>;
    for (const t of tools) {
      if (t.layer || !t.primaryPhase || platformIds.has(t.id)) continue;
      byPhase[t.primaryPhase].push(t);
    }
    for (const list of Object.values(byPhase)) list.sort((a, b) => a.name.localeCompare(b.name));
    const platforms = fullLifecycleIds.map((id) => byId.get(id)).filter((t): t is ToolLite => !!t);
    const bands: LayerBand[] = layers.map((layer) => ({
      layer,
      tools: tools.filter((t) => t.layer === (layer.id as LayerId)).sort((a, b) => a.name.localeCompare(b.name)),
    }));
    return { byPhase, platforms, bands };
  }, [tools, phases, layers, fullLifecycleIds]);

  const filtered = isFiltered(query);
  const matched = useMemo(
    () => (filtered ? new Set(applyFilters(tools, query).map((t) => t.id)) : null),
    [tools, query, filtered],
  );

  const onSelect = useCallback((id: string) => void setQuery({ tool: id }), [setQuery]);

  return (
    <div className="relative h-[calc(100dvh-7rem)] min-h-[32rem] overflow-hidden border-b bg-muted/30">
      <div
        ref={viewportRef}
        role="group"
        aria-roledescription="map"
        aria-label="AI SDLC landscape. Drag to pan, scroll or pinch to zoom. Plus and minus zoom, 0 fits, arrow keys pan."
        tabIndex={0}
        className={cn(
          "h-full w-full touch-none overflow-hidden outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset",
          dragging ? "cursor-grabbing" : "cursor-grab",
        )}
        {...viewportProps}
      >
        <motion.div
          ref={worldRef}
          style={{ x, y, scale, originX: 0, originY: 0, width: WORLD_W, padding: WORLD_PAD }}
          className="absolute top-0 left-0 flex flex-col gap-6"
        >
          <PlatformBars platforms={platforms} matched={matched} selectedId={query.tool} onSelect={onSelect} />
          <PhaseColumns
            phases={phases}
            byPhase={byPhase}
            matched={matched}
            selectedId={query.tool}
            level={zoomLevel}
            onSelect={onSelect}
          />
          {query.layers && (
            <LayerBands bands={bands} matched={matched} selectedId={query.tool} level={zoomLevel} onSelect={onSelect} />
          )}
        </motion.div>
      </div>

      <p className="pointer-events-none absolute bottom-4 left-4 hidden rounded-md bg-background/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur sm:block">
        Drag to pan. Scroll or pinch to zoom. Keys: + - 0 and arrows.
      </p>

      {matched && matched.size === 0 && (
        <p
          role="status"
          className="absolute top-4 left-1/2 -translate-x-1/2 rounded-md border bg-background px-3 py-1.5 text-sm shadow-sm"
        >
          No tools match these filters. The map shows every tool faded.
        </p>
      )}

      <MapControls onZoomIn={zoomIn} onZoomOut={zoomOut} onFit={fit} />
    </div>
  );
}
