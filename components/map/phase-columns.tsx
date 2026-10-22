"use client";

import { motion, useReducedMotion } from "motion/react";
import { STAGES, phaseColor } from "@/lib/format";
import { PHASE_ORDER } from "@/lib/filters";
import type { Phase, PhaseId, ToolLite } from "@/lib/types";
import { cn } from "@/lib/utils";
import { COLUMN_GRID } from "./map-layout";
import { ToolTile } from "./tool-tile";
import type { ZoomLevel } from "./zoom-level";

const STAGGER = 0.04;

interface PhaseColumnsProps {
  phases: Phase[];
  byPhase: Record<PhaseId, ToolLite[]>;
  matched: Set<string> | null;
  selectedId: string | null;
  level: ZoomLevel;
  onSelect: (id: string) => void;
}

function useEntrance(index: number) {
  const reduceMotion = useReducedMotion();
  return reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.15 },
      }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: {
          type: "spring" as const,
          stiffness: 260,
          damping: 28,
          delay: index * STAGGER,
        },
      };
}

function StageHeader({ stage }: { stage: (typeof STAGES)[number] }) {
  const first = PHASE_ORDER.indexOf(stage.phases[0]);
  const entrance = useEntrance(first);
  return (
    <motion.div style={{ gridColumn: `${first + 1} / span ${stage.phases.length}` }} {...entrance}>
      <div className="h-1 rounded-full" style={{ background: `var(--stage-${stage.id})` }} />
      <h2 className="mt-1.5 text-xs font-semibold">{stage.label}</h2>
    </motion.div>
  );
}

interface ColumnProps extends Omit<PhaseColumnsProps, "phases" | "byPhase"> {
  phase: Phase;
  index: number;
  tools: ToolLite[];
  /** The largest column's count, which sets full intensity for the overview heat block. */
  max: number;
}

/** Overview level: the column as one block, count in large type, stage colour deeper with more tools. */
function HeatBlock({ phase, shown, max }: { phase: Phase; shown: number; max: number }) {
  const strength = max ? Math.round(12 + 68 * (shown / max)) : 12;
  return (
    <motion.div
      layout
      className="flex h-56 flex-col items-center justify-center rounded-lg"
      style={{
        background: `color-mix(in oklch, ${phaseColor(phase.id)} ${strength}%, var(--card))`,
      }}
    >
      <span className="font-mono text-7xl leading-none font-semibold tabular-nums">{shown}</span>
      <span className="mt-2 text-lg">{shown === 1 ? "tool" : "tools"}</span>
    </motion.div>
  );
}

function PhaseColumn({ phase, index, tools, max, matched, selectedId, level, onSelect }: ColumnProps) {
  const entrance = useEntrance(index);
  const shown = matched ? tools.filter((t) => matched.has(t.id)).length : tools.length;
  const noun = tools.length === 1 ? "tool" : "tools";
  return (
    <motion.section
      aria-labelledby={`phase-${phase.id}`}
      className="row-span-2 grid min-w-0 grid-rows-subgrid items-start"
      {...entrance}
    >
      <header className="border-t-2 pt-2" style={{ borderTopColor: phaseColor(phase.id) }}>
        <h3 id={`phase-${phase.id}`} className="text-[13px] leading-tight font-semibold">
          {phase.label}
        </h3>
        <p className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {matched ? `${shown} of ${tools.length}` : tools.length} {noun}
        </p>
      </header>
      {level === "overview" ? (
        <HeatBlock phase={phase} shown={shown} max={max} />
      ) : (
        <ul className={cn("grid gap-1 px-1", level === "cards" ? "grid-cols-1" : "grid-cols-2")}>
          {tools.map((tool) => (
            <li key={tool.id} className="min-w-0">
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
      )}
    </motion.section>
  );
}

export function PhaseColumns({ phases, byPhase, matched, selectedId, level, onSelect }: PhaseColumnsProps) {
  const phaseById = new Map(phases.map((p) => [p.id, p]));
  const max = Math.max(...PHASE_ORDER.map((id) => byPhase[id]?.length ?? 0));
  return (
    <div className="flex flex-col gap-3">
      <div style={COLUMN_GRID}>
        {STAGES.map((stage) => (
          <StageHeader key={stage.id} stage={stage} />
        ))}
      </div>
      {/* Each column is a two-row subgrid, so a label that wraps to three lines pushes every column's body down together. */}
      <div style={{ ...COLUMN_GRID, gridTemplateRows: "auto auto", rowGap: 8 }}>
        {PHASE_ORDER.map((id, index) => {
          const phase = phaseById.get(id);
          if (!phase) return null;
          return (
            <PhaseColumn
              key={id}
              phase={phase}
              index={index}
              tools={byPhase[id]}
              max={max}
              matched={matched}
              selectedId={selectedId}
              level={level}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </div>
  );
}
