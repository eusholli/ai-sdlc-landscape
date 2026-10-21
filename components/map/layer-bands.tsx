"use client";

import { motion } from "motion/react";
import { layerColor } from "@/lib/format";
import type { Layer, ToolLite } from "@/lib/types";
import { TILE_W } from "./map-layout";
import { ToolTile } from "./tool-tile";
import type { ZoomLevel } from "./zoom-level";

export interface LayerBand {
  layer: Layer;
  tools: ToolLite[];
}

interface LayerBandsProps {
  bands: LayerBand[];
  matched: Set<string> | null;
  selectedId: string | null;
  level: ZoomLevel;
  onSelect: (id: string) => void;
}

export function LayerBands({ bands, matched, selectedId, level, onSelect }: LayerBandsProps) {
  return (
    <div className="flex flex-col gap-3">
      {bands.map(({ layer, tools }) => (
        <motion.section
          key={layer.id}
          aria-labelledby={`band-${layer.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, delay: 0.2 }}
          className="rounded-lg border bg-card/60 p-3"
          style={{ borderLeft: `4px solid ${layerColor(layer.id)}` }}
        >
          <div className="mb-2 flex items-baseline gap-3">
            <h2 id={`band-${layer.id}`} className="text-sm font-semibold">
              {layer.label}
            </h2>
            <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{tools.length}</span>
            <p className="min-w-0 truncate text-xs text-muted-foreground">{layer.description}</p>
          </div>
          <ul className="grid gap-1" style={{ gridTemplateColumns: `repeat(auto-fill, ${TILE_W}px)` }}>
            {tools.map((tool) => (
              <li key={tool.id}>
                <ToolTile
                  tool={tool}
                  level={level}
                  dimmed={matched !== null && !matched.has(tool.id)}
                  selected={selectedId === tool.id}
                  onSelect={onSelect}
                />
              </li>
            ))}
          </ul>
        </motion.section>
      ))}
    </div>
  );
}
