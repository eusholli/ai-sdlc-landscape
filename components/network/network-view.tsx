"use client";

import { SlidersHorizontal } from "lucide-react";
import { useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import { useQueryStates } from "nuqs";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { RELATION_ORDER } from "@/components/map/relation-style";
import { MapControls } from "@/components/map/map-controls";
import { Button } from "@/components/ui/button";
import { applyFilters, filterParsers, isFiltered } from "@/lib/filters";
import type { External, Layer, Phase, RelationLite, RelationType, ToolLite } from "@/lib/types";
import { buildGraphModel, inIsolate, type GraphNode, type Isolate } from "./graph-model";
import type { NetworkCanvasHandle } from "./network-canvas";
import { NetworkPanel } from "./network-panel";
import { usePalette } from "./use-palette";

const VIEW_HEIGHT = "h-[calc(100dvh-10.5rem)] min-h-[32rem]";

const NetworkCanvas = dynamic(() => import("./network-canvas"), {
  ssr: false,
  loading: () => (
    <p role="status" className="p-8 text-sm text-muted-foreground">
      Loading the network.
    </p>
  ),
});

export interface NetworkViewProps {
  tools: ToolLite[];
  externals: External[];
  relations: RelationLite[];
  phases: Phase[];
  layers: Layer[];
}

const FADED = 0.15;

export function NetworkView({ tools, externals, relations, phases, layers }: NetworkViewProps) {
  const [query, setQuery] = useQueryStates(filterParsers);
  const reducedMotion = useReducedMotion() ?? false;
  const palette = usePalette();

  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<NetworkCanvasHandle | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [enabledTypes, setEnabledTypes] = useState<ReadonlySet<RelationType>>(() => new Set(RELATION_ORDER));
  const [showExternals, setShowExternals] = useState(false);
  const [isolate, setIsolate] = useState<Isolate | null>(null);
  const [pickedExternal, setPickedExternal] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const model = useMemo(() => buildGraphModel(tools, externals, relations), [tools, externals, relations]);

  const { nodes, links, typeCounts, externalCount } = useMemo(() => {
    const isExternal = (id: string) => model.nodeById.get(id)?.external ?? false;
    const reachable = model.links.filter((l) => showExternals || (!isExternal(l.from) && !isExternal(l.to)));

    const typeCounts = Object.fromEntries(RELATION_ORDER.map((t) => [t, 0])) as Record<RelationType, number>;
    for (const l of reachable) typeCounts[l.type] += 1;

    const links = reachable.filter((l) => enabledTypes.has(l.type));
    const linkedExternals = new Set<string>();
    for (const l of links) {
      if (isExternal(l.from)) linkedExternals.add(l.from);
      if (isExternal(l.to)) linkedExternals.add(l.to);
    }
    const nodes = model.nodes.filter((n) => !n.external || (showExternals && linkedExternals.has(n.id)));
    const externalCount = model.nodes.filter((n) => n.external).length;
    return { nodes, links, typeCounts, externalCount };
  }, [model, enabledTypes, showExternals]);

  const matched = useMemo(
    () => (isFiltered(query) ? new Set(applyFilters(tools, query).map((t) => t.id)) : null),
    [tools, query],
  );

  const focusId = useMemo(() => {
    const id = pickedExternal ?? query.tool;
    return id && model.nodeById.has(id) ? id : null;
  }, [pickedExternal, query.tool, model]);

  const neighbourhood = useMemo(() => {
    if (!focusId) return null;
    const ids = new Set<string>([focusId]);
    for (const l of links) {
      if (l.from === focusId) ids.add(l.to);
      if (l.to === focusId) ids.add(l.from);
    }
    return ids;
  }, [focusId, links]);

  const labelIds = useMemo(() => {
    if (!neighbourhood || !focusId) return null;
    const ids = new Set(neighbourhood);
    ids.delete(focusId);
    return ids;
  }, [neighbourhood, focusId]);

  const alphaById = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of nodes) {
      let alpha = n.external ? 0.85 : 1;
      if (matched && !matched.has(n.id)) alpha = Math.min(alpha, FADED);
      if (isolate && !inIsolate(n, isolate)) alpha = Math.min(alpha, 0.12);
      if (neighbourhood && !neighbourhood.has(n.id)) alpha = Math.min(alpha, FADED);
      map.set(n.id, alpha);
    }
    return map;
  }, [nodes, matched, isolate, neighbourhood]);

  const phaseLabels = useMemo(() => new Map(phases.map((p) => [p.id as string, p.label])), [phases]);
  const layerLabels = useMemo(() => new Map(layers.map((l) => [l.id as string, l.label])), [layers]);

  const describe = useCallback(
    (n: GraphNode) => {
      if (n.external) return "Outside the census";
      if (n.layer) return layerLabels.get(n.layer) ?? n.layer;
      return n.phase ? (phaseLabels.get(n.phase) ?? n.phase) : "No phase";
    },
    [layerLabels, phaseLabels],
  );

  const clearFocus = useCallback(() => {
    setPickedExternal(null);
    if (query.tool) void setQuery({ tool: null });
  }, [query.tool, setQuery]);

  const onNodeClick = useCallback(
    (id: string) => {
      const node = model.nodeById.get(id);
      if (!node) return;
      if (node.external) {
        setPickedExternal(id);
        void setQuery({ tool: null });
      } else {
        setPickedExternal(null);
        void setQuery({ tool: id });
      }
    },
    [model, setQuery],
  );

  const jumpTo = useCallback(
    (id: string) => {
      if (!id) return;
      onNodeClick(id);
      handleRef.current?.centerOn(id);
    },
    [onNodeClick],
  );

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const handle = handleRef.current;
    const step = 80;
    const actions: Record<string, (() => void) | undefined> = {
      "+": () => handle?.zoomIn(),
      "=": () => handle?.zoomIn(),
      "-": () => handle?.zoomOut(),
      _: () => handle?.zoomOut(),
      "0": () => handle?.fit(),
      ArrowLeft: () => handle?.pan(-step, 0),
      ArrowRight: () => handle?.pan(step, 0),
      ArrowUp: () => handle?.pan(0, -step),
      ArrowDown: () => handle?.pan(0, step),
      Escape: clearFocus,
    };
    const action = actions[e.key];
    if (!action) return;
    e.preventDefault();
    action();
  };

  const toggleType = (type: RelationType) =>
    setEnabledTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });

  const open = panelOpen ?? size.width >= 768;
  const selectable = useMemo(() => nodes.filter((n) => !n.external), [nodes]);
  const visibleExternals = nodes.length - selectable.length;

  return (
    <div ref={containerRef} className={`relative ${VIEW_HEIGHT} overflow-hidden border-b bg-muted/30`}>
      <div
        role="group"
        aria-roledescription="network graph"
        aria-label="Network of tools and their relations. Drag a node to move it, scroll to zoom. Plus and minus zoom, 0 fits, arrow keys pan, Escape clears the focus. Use Jump to a tool to pick a node by name."
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="absolute inset-0 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
      >
        {palette && size.width > 0 && (
          <NetworkCanvas
            nodes={nodes}
            links={links}
            width={size.width}
            height={size.height}
            palette={palette}
            alphaById={alphaById}
            focusId={focusId}
            labelIds={labelIds}
            describe={describe}
            reducedMotion={reducedMotion}
            fitKey={String(showExternals)}
            onNodeClick={onNodeClick}
            onBackgroundClick={clearFocus}
            handleRef={handleRef}
          />
        )}
      </div>

      <div className="pointer-events-none absolute inset-y-3 left-3 flex max-w-[calc(100%-1.5rem)] flex-col items-start gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={open}
          aria-controls="network-panel"
          onClick={() => setPanelOpen(!open)}
          className="pointer-events-auto bg-background"
        >
          <SlidersHorizontal aria-hidden />
          Legend and relations
        </Button>
        {open && (
          <div id="network-panel" className="pointer-events-auto min-h-0">
            <NetworkPanel
              isolate={isolate}
              onIsolate={setIsolate}
              enabledTypes={enabledTypes}
              typeCounts={typeCounts}
              onToggleType={toggleType}
              showExternals={showExternals}
              externalCount={externalCount}
              onToggleExternals={() => setShowExternals((v) => !v)}
            />
          </div>
        )}
      </div>

      <div className="absolute top-3 right-3">
        <label htmlFor="network-jump" className="sr-only">
          Jump to a tool
        </label>
        <select
          id="network-jump"
          value={focusId && !model.nodeById.get(focusId)?.external ? focusId : ""}
          onChange={(e) => jumpTo(e.target.value)}
          className="h-8 max-w-[14rem] rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Jump to a tool</option>
          {[...selectable]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
        </select>
      </div>

      <p
        aria-live="polite"
        className="pointer-events-none absolute bottom-4 left-4 hidden max-w-[calc(100%-6rem)] rounded-md bg-background/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur sm:block"
      >
        {selectable.length} tools and models
        {visibleExternals > 0 ? `, ${visibleExternals} outside companies` : ""}, {links.length} relations. Click a node to focus it.
      </p>

      {matched && matched.size === 0 && (
        <p
          role="status"
          className="absolute top-14 left-1/2 -translate-x-1/2 rounded-md border bg-background px-3 py-1.5 text-sm shadow-sm"
        >
          No tools match these filters. The network shows every node faded.
        </p>
      )}

      <MapControls
        onZoomIn={() => handleRef.current?.zoomIn()}
        onZoomOut={() => handleRef.current?.zoomOut()}
        onFit={() => handleRef.current?.fit()}
      />
    </div>
  );
}
