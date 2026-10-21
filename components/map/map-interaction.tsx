"use client";

import { useReducedMotion } from "motion/react";
import { createContext, useContext, type KeyboardEvent, type PointerEvent, type ReactElement } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { notPublished } from "@/lib/format";
import type { ToolLite } from "@/lib/types";
import type { RelationEdge } from "./relation-index";

export interface MapInteraction {
  /** The tile under the pointer or keyboard focus. */
  activeId: string | null;
  /** The active tile plus every tile on the map it relates to; null when nothing is active. */
  related: ReadonlySet<string> | null;
  setActive: (id: string | null) => void;
  /**
   * Clears the active id only if it is still `id`. Leave, blur and tooltip-close events from a
   * tile the pointer already passed can land after the next tile's enter; they must not clear it.
   */
  release: (id: string) => void;
  edgesOf: (id: string) => RelationEdge[];
  nameOf: (id: string) => string;
  /** Shared logo layout animation is switched on after the first paint, so load does not animate. */
  animateLevels: boolean;
}

const MapInteractionContext = createContext<MapInteraction | null>(null);

export const MapInteractionProvider = MapInteractionContext.Provider;

export function useMapInteraction(): MapInteraction {
  const value = useContext(MapInteractionContext);
  if (!value) throw new Error("useMapInteraction must be used inside the landscape map");
  return value;
}

/** Hover, focus, dimming and the shared logo id for one tile. */
export function useTileBehaviour(tool: ToolLite, filterDimmed: boolean) {
  const { related, setActive, release, animateLevels } = useMapInteraction();
  const reduceMotion = useReducedMotion();
  const id = tool.id;

  const fade = related !== null && !related.has(id) ? "opacity-20" : filterDimmed ? "opacity-15" : "";

  const handlers = {
    onPointerEnter: (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType === "touch" || e.buttons !== 0) return;
      setActive(id);
    },
    onPointerLeave: (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType === "touch") return;
      release(id);
    },
    onFocus: () => setActive(id),
    onBlur: () => release(id),
    // The card is dismissible without moving the pointer or focus (WCAG 1.4.13).
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === "Escape") release(id);
    },
  };

  return {
    fade,
    handlers,
    reduceMotion: !!reduceMotion,
    layoutId: animateLevels && !reduceMotion ? `logo-${id}` : undefined,
  };
}

function HoverCardBody({ tool }: { tool: ToolLite }) {
  const { edgesOf, nameOf } = useMapInteraction();
  const edges = edgesOf(tool.id);
  const offMap = [...new Set(edges.filter((e) => !e.onMap).map((e) => nameOf(e.other)))];

  return (
    <div className="flex w-64 flex-col gap-1.5 py-0.5 text-left leading-snug">
      <div>
        <p className="text-[13px] font-semibold">{tool.name}</p>
        <p className="opacity-70">{tool.company}</p>
      </div>
      <p className="line-clamp-3 opacity-90">{tool.summary ? `\u201C${tool.summary}\u201D` : notPublished(null)}</p>
      <p className="font-mono tabular-nums opacity-70">
        {edges.length} {edges.length === 1 ? "relation" : "relations"}
      </p>
      {offMap.length > 0 && <p className="line-clamp-2 opacity-70">Not on the map: {offMap.join(", ")}</p>}
    </div>
  );
}

/**
 * Wraps a tile in a controlled tooltip. Open state comes only from the shared active id, so pointer
 * hover and keyboard focus behave the same and the card never fights the dimming. Radix's own
 * open and close events are not wired in: they arrive late and cleared the next tile's hover.
 */
export function TileHover({
  tool,
  enabled = true,
  children,
}: {
  tool: ToolLite;
  /** Lets a tool drawn as several elements show the card on one of them only. */
  enabled?: boolean;
  children: ReactElement;
}) {
  const { activeId } = useMapInteraction();
  return (
    <Tooltip open={enabled && activeId === tool.id} disableHoverableContent>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      {/* The card only informs. Its wrapper is made pointer-transparent in globals.css: a card that takes
          the pointer and then unmounts leaves React without an enter event for the tile beneath. */}
      <TooltipContent side="top" sideOffset={8} collisionPadding={12} className="pointer-events-none" data-map-card="">
        <HoverCardBody tool={tool} />
      </TooltipContent>
    </Tooltip>
  );
}
