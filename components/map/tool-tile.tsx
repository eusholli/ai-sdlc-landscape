"use client";

import { ArrowRightLeft } from "lucide-react";
import { memo, type ComponentType } from "react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import type { ToolLite } from "@/lib/types";
import { TileCompareButton } from "./tile-compare-button";
import type { ZoomLevel } from "./zoom-level";

export interface TileProps {
  tool: ToolLite;
  dimmed: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
}

function LogoTile({ tool, dimmed, selected, onSelect }: TileProps) {
  return (
    <div className={cn("group relative w-full transition-opacity duration-150", dimmed && "opacity-15")}>
      <button
        type="button"
        onClick={() => onSelect(tool.id)}
        aria-pressed={selected}
        title={`${tool.name}, ${tool.company}`}
        data-tool={tool.id}
        className={cn(
          "relative flex w-full flex-col items-center gap-1 rounded-lg border border-transparent p-1.5 text-center outline-none transition-[background-color,border-color] duration-150 hover:border-border hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
          selected && "border-foreground/40 bg-muted",
        )}
      >
        <Logo name={tool.name} src={tool.logo} phase={tool.primaryPhase} size={40} />
        <span className="line-clamp-2 w-full text-[11px] leading-tight font-medium break-words">{tool.name}</span>
        {tool.moved && (
          <>
            <ArrowRightLeft className="absolute top-1 right-1 size-3 text-muted-foreground" aria-hidden />
            <span className="sr-only">Acquired or shut down</span>
          </>
        )}
      </button>
      <TileCompareButton id={tool.id} name={tool.name} />
    </div>
  );
}

/** One renderer per semantic zoom level. Step 3 swaps in the heat block and the card. */
const RENDERERS: Record<ZoomLevel, ComponentType<TileProps>> = {
  overview: LogoTile,
  logos: LogoTile,
  cards: LogoTile,
};

export const ToolTile = memo(function ToolTile({ level, ...props }: TileProps & { level: ZoomLevel }) {
  const Renderer = RENDERERS[level];
  return <Renderer {...props} />;
});
