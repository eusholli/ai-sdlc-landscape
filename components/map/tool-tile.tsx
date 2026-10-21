"use client";

import { ArrowRightLeft, Code2 } from "lucide-react";
import { motion } from "motion/react";
import { memo, type ComponentType } from "react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import type { ToolLite } from "@/lib/types";
import { TileHover, useTileBehaviour } from "./map-interaction";
import { TileCompareButton } from "./tile-compare-button";
import type { ZoomLevel } from "./zoom-level";

export interface TileProps {
  tool: ToolLite;
  dimmed: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
}

/** The logo carries `layoutId`, so it travels between the logo grid and the card at a level change. */
function TileLogo({ tool, size, layoutId }: { tool: ToolLite; size: number; layoutId?: string }) {
  return (
    <motion.span layoutId={layoutId} className="inline-flex shrink-0">
      <Logo name={tool.name} src={tool.logo} phase={tool.primaryPhase} size={size} />
    </motion.span>
  );
}

function LogoTile({ tool, dimmed, selected, onSelect }: TileProps) {
  const { fade, handlers, layoutId } = useTileBehaviour(tool, dimmed);
  return (
    <div className={cn("group relative w-full transition-opacity duration-150", fade)}>
      <TileHover tool={tool}>
        <button
          type="button"
          onClick={() => onSelect(tool.id)}
          aria-pressed={selected}
          data-tool={tool.id}
          {...handlers}
          className={cn(
            "relative flex w-full flex-col items-center gap-1 rounded-lg border border-transparent p-1.5 text-center outline-none transition-[background-color,border-color] duration-150 hover:border-border hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
            selected && "border-foreground/40 bg-muted",
          )}
        >
          <TileLogo tool={tool} size={40} layoutId={layoutId} />
          <span className="line-clamp-2 w-full text-[11px] leading-tight font-medium break-words">{tool.name}</span>
          {tool.moved && (
            <>
              <ArrowRightLeft className="absolute top-1 right-1 size-3 text-muted-foreground" aria-hidden />
              <span className="sr-only">, acquired or shut down</span>
            </>
          )}
        </button>
      </TileHover>
      <TileCompareButton id={tool.id} name={tool.name} />
    </div>
  );
}

function CardTile({ tool, dimmed, selected, onSelect }: TileProps) {
  const { fade, handlers, layoutId } = useTileBehaviour(tool, dimmed);
  return (
    <div className={cn("group relative w-full transition-opacity duration-150", fade)}>
      <TileHover tool={tool}>
        <button
          type="button"
          onClick={() => onSelect(tool.id)}
          aria-pressed={selected}
          data-tool={tool.id}
          {...handlers}
          className={cn(
            "flex w-full flex-col gap-1.5 rounded-lg border bg-card p-2 text-left outline-none transition-[background-color,border-color] duration-150 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
            selected && "border-foreground/40 bg-muted",
          )}
        >
          <span className="flex items-center gap-2">
            <TileLogo tool={tool} size={28} layoutId={layoutId} />
            <span className="min-w-0">
              <span className="block truncate text-xs leading-tight font-semibold">{tool.name}</span>
              <span className="block truncate text-[10px] leading-tight text-muted-foreground">{tool.company}</span>
            </span>
          </span>
          <span className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">
            {tool.summary ? `“${tool.summary}”` : "Not published"}
          </span>
          {(tool.openSource || tool.moved) && (
            <span className="flex flex-wrap gap-1">
              {tool.openSource && (
                <span className="inline-flex items-center gap-1 rounded border px-1 text-[9px] leading-4">
                  <Code2 className="size-2.5" aria-hidden />
                  Open source
                </span>
              )}
              {tool.moved && (
                <span className="inline-flex items-center gap-1 rounded border px-1 text-[9px] leading-4">
                  <ArrowRightLeft className="size-2.5" aria-hidden />
                  Acquired or shut down
                </span>
              )}
            </span>
          )}
        </button>
      </TileHover>
      <TileCompareButton id={tool.id} name={tool.name} />
    </div>
  );
}

/**
 * One renderer per semantic zoom level. Phase columns draw their own heat block at overview, so
 * the overview renderer only reaches the layer bands, which stay as logos.
 */
const RENDERERS: Record<ZoomLevel, ComponentType<TileProps>> = {
  overview: LogoTile,
  logos: LogoTile,
  cards: CardTile,
};

export const ToolTile = memo(function ToolTile({ level, ...props }: TileProps & { level: ZoomLevel }) {
  const Renderer = RENDERERS[level];
  return <Renderer {...props} />;
});
