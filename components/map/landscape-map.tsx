"use client";

import { motion } from "motion/react";
import { useQueryStates } from "nuqs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { applyFilters, filterParsers, isFiltered } from "@/lib/filters";
import { cn } from "@/lib/utils";
import type { External, Layer, LayerId, Phase, PhaseId, RelationLite, Segment, ToolLite } from "@/lib/types";
import { PhaseList } from "@/components/list/phase-list";
import { NetworkView } from "@/components/network/network-view";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LayerBands, type LayerBand } from "./layer-bands";
import { MapControls } from "./map-controls";
import { MapInteractionProvider, type MapInteraction } from "./map-interaction";
import { WORLD_PAD, WORLD_W } from "./map-layout";
import { PhaseColumns } from "./phase-columns";
import { PlatformBars } from "./platform-bars";
import { RelationCurves } from "./relation-curves";
import { buildRelationIndex, NO_EDGES } from "./relation-index";
import { RelationLegend } from "./relation-legend";
import { handleTileArrowKeys } from "./tile-keys";
import { useIsMobile } from "./use-is-mobile";
import { usePanZoom } from "./use-pan-zoom";

export interface LandscapeMapProps {
  tools: ToolLite[];
  relations: RelationLite[];
  externals: External[];
  phases: Phase[];
  layers: Layer[];
  segments: Segment[];
  fullLifecycleIds: string[];
}

export function LandscapeMap(props: LandscapeMapProps) {
  const [{ view }] = useQueryStates(filterParsers);
  const isMobile = useIsMobile();
  if (view === "list" || (view === "map" && isMobile)) {
    return (
      <PhaseList
        tools={props.tools}
        phases={props.phases}
        layers={props.layers}
        segments={props.segments}
        fullLifecycleIds={props.fullLifecycleIds}
      />
    );
  }
  if (view === "map" && isMobile === null) {
    return <div aria-hidden className="h-[calc(100dvh-10.5rem-var(--intro-h,0rem))] min-h-[32rem] border-b bg-muted/30" />;
  }
  if (view === "network") {
    return (
      <NetworkView
        tools={props.tools}
        externals={props.externals}
        relations={props.relations}
        phases={props.phases}
        layers={props.layers}
      />
    );
  }
  return <MapCanvas {...props} />;
}

function MapCanvas({ tools, relations, externals, phases, layers, fullLifecycleIds }: LandscapeMapProps) {
  const [query, setQuery] = useQueryStates(filterParsers);
  const { viewportRef, worldRef, x, y, scale, zoomLevel, dragging, zoomIn, zoomOut, zoomTo, fit, viewportProps } =
    usePanZoom();

  const [activeId, setActiveId] = useState<string | null>(null);
  // Logos share a layoutId across zoom levels; switched on after the first paint so load does not animate.
  const [animateLevels, setAnimateLevels] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimateLevels(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const relationIndex = useMemo(
    () => buildRelationIndex(relations, new Set(tools.map((t) => t.id))),
    [relations, tools],
  );
  const names = useMemo(
    () => new Map([...tools, ...externals].map((n) => [n.id, n.name] as const)),
    [tools, externals],
  );

  const interaction = useMemo<MapInteraction>(() => {
    const edgesOf = (id: string) => relationIndex.get(id) ?? NO_EDGES;
    const related = activeId
      ? new Set([
          activeId,
          ...edgesOf(activeId)
            .filter((e) => e.onMap)
            .map((e) => e.other),
        ])
      : null;
    return {
      activeId,
      related,
      setActive: setActiveId,
      release: (id) => setActiveId((current) => (current === id ? null : current)),
      edgesOf,
      nameOf: (id) => names.get(id) ?? id,
      animateLevels,
    };
  }, [activeId, relationIndex, names, animateLevels]);
  const activeEdges = activeId ? interaction.edgesOf(activeId) : NO_EDGES;

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
    <MapInteractionProvider value={interaction}>
      <TooltipProvider delayDuration={300}>
        <div className="relative h-[calc(100dvh-10.5rem-var(--intro-h,0rem))] min-h-[32rem] overflow-hidden border-b bg-muted/30">
          <div
            ref={viewportRef}
            role="group"
            aria-roledescription="map"
            aria-label="AI SDLC landscape. Drag to pan, scroll or pinch to zoom. Plus and minus zoom, 0 fits, arrow keys pan. Tab into the map, then arrow keys move between tools."
            tabIndex={0}
            className={cn(
              "h-full w-full touch-none overflow-hidden outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset",
              dragging ? "cursor-grabbing" : "cursor-grab",
            )}
            {...viewportProps}
          >
            <motion.div
              ref={worldRef}
              onKeyDown={handleTileArrowKeys}
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
                <LayerBands
                  bands={bands}
                  matched={matched}
                  selectedId={query.tool}
                  level={zoomLevel}
                  onSelect={onSelect}
                />
              )}
              {activeId && (
                <RelationCurves activeId={activeId} edges={activeEdges} worldRef={worldRef} zoomLevel={zoomLevel} />
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

          {activeId && <RelationLegend edges={activeEdges} />}

          <MapControls
            level={zoomLevel}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onZoomTo={zoomTo}
            onFit={fit}
            fitLabel="Fit to width"
          />
        </div>
      </TooltipProvider>
    </MapInteractionProvider>
  );
}
