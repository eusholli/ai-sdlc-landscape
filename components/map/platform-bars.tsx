"use client";

import { motion } from "motion/react";
import { Logo } from "@/components/logo";
import { phaseColor } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ToolLite } from "@/lib/types";
import { COLUMN_GRID, COL_GAP, coverageRuns } from "./map-layout";
import { useMapInteraction } from "./map-interaction";

interface PlatformBarsProps {
  platforms: ToolLite[];
  matched: Set<string> | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function PlatformBars({ platforms, matched, selectedId, onSelect }: PlatformBarsProps) {
  const { related, setActive, release } = useMapInteraction();
  if (!platforms.length) return null;

  return (
    <motion.section
      aria-labelledby="platforms-heading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <h2 id="platforms-heading" className="mb-2 text-xs font-semibold text-muted-foreground">
        Full-lifecycle platforms
        <span className="ml-2 font-normal">Each bar spans the phases a platform covers</span>
      </h2>
      <ul className="flex flex-col gap-1.5">
        {platforms.map((tool) => {
          const runs = coverageRuns(tool.phases);
          const dimmed = matched !== null && !matched.has(tool.id);
          const unrelated = related !== null && !related.has(tool.id);
          const covered = runs.reduce((n, r) => n + r.phases.length, 0);
          return (
            <li key={tool.id} style={COLUMN_GRID}>
              {runs.map((run, i) => (
                <button
                  key={run.start}
                  tabIndex={i === 0 ? undefined : -1}
                  type="button"
                  onClick={() => onSelect(tool.id)}
                  onPointerEnter={(e) => {
                    if (e.pointerType !== "touch" && e.buttons === 0) setActive(tool.id);
                  }}
                  onPointerLeave={(e) => {
                    if (e.pointerType !== "touch") release(tool.id);
                  }}
                  onFocus={() => setActive(tool.id)}
                  onBlur={() => release(tool.id)}
                  aria-pressed={selectedId === tool.id}
                  data-tool={tool.id}
                  style={{ gridColumn: `${run.start + 1} / ${run.end + 2}`, gridRow: 1 }}
                  className={cn(
                    "flex min-w-0 flex-col overflow-hidden rounded-md border bg-card text-left outline-none transition-[opacity,background-color,border-color] duration-150 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                    selectedId === tool.id && "border-foreground/40",
                    unrelated ? "opacity-20" : dimmed && "opacity-15",
                  )}
                >
                  <span className="flex h-7 items-center gap-2 px-2">
                    <Logo name={tool.name} src={tool.logo} phase={tool.primaryPhase} size={20} />
                    <span className="truncate text-xs font-semibold">{tool.name}</span>
                    <span className="sr-only">, </span>
                    <span className="truncate text-xs text-muted-foreground">{tool.company}</span>
                    <span className="sr-only">, covers {covered} of 13 phases</span>
                  </span>
                  <span
                    aria-hidden
                    className="grid h-1"
                    style={{ gridTemplateColumns: `repeat(${run.phases.length}, 1fr)`, columnGap: COL_GAP }}
                  >
                    {run.phases.map((phase) => (
                      <span key={phase} style={{ background: phaseColor(phase) }} />
                    ))}
                  </span>
                </button>
              ))}
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}
