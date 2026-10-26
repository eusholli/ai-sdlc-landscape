"use client";

import { Check } from "lucide-react";
import { RELATION_ORDER, RELATION_STYLE } from "@/components/map/relation-style";
import { STAGES } from "@/lib/format";
import type { RelationType } from "@/lib/types";
import { LINE_STYLE, type Isolate } from "./graph-model";

const LAYER_ITEMS = [
  { id: "agent-infra", label: "Agent infrastructure", color: "var(--layer-infra)" },
  { id: "model", label: "Model providers", color: "var(--layer-model)" },
  { id: "systems", label: "Platforms tools connect to", color: "var(--layer-model)" },
] as const;

interface NetworkPanelProps {
  isolate: Isolate | null;
  onIsolate: (next: Isolate | null) => void;
  enabledTypes: ReadonlySet<RelationType>;
  typeCounts: Record<RelationType, number>;
  onToggleType: (type: RelationType) => void;
  showExternals: boolean;
  externalCount: number;
  onToggleExternals: () => void;
}

const rowClass =
  "flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50";

export function NetworkPanel({
  isolate,
  onIsolate,
  enabledTypes,
  typeCounts,
  onToggleType,
  showExternals,
  externalCount,
  onToggleExternals,
}: NetworkPanelProps) {
  const isStage = (id: number) => isolate?.kind === "stage" && isolate.id === id;
  const isLayer = (id: string) => isolate?.kind === "layer" && isolate.id === id;

  return (
    <div className="max-h-full w-64 space-y-4 overflow-y-auto rounded-lg border bg-background/95 p-3 shadow-sm backdrop-blur">
      <section aria-labelledby="network-stages">
        <h2 id="network-stages" className="px-2 pb-1 text-xs font-semibold">
          Stages
        </h2>
        <p className="px-2 pb-1.5 text-xs text-muted-foreground">Click a stage to show only its tools.</p>
        <ul className="space-y-0.5">
          {STAGES.map((stage) => (
            <li key={stage.id}>
              <button
                type="button"
                aria-pressed={isStage(stage.id)}
                onClick={() => onIsolate(isStage(stage.id) ? null : { kind: "stage", id: stage.id })}
                className={`${rowClass} aria-pressed:bg-muted aria-pressed:font-medium`}
              >
                <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: `var(--stage-${stage.id})` }} />
                <span className="flex-1">{stage.label}</span>
                {isStage(stage.id) && <Check aria-hidden className="size-3.5" />}
              </button>
            </li>
          ))}
          {LAYER_ITEMS.map((layer) => (
            <li key={layer.id}>
              <button
                type="button"
                aria-pressed={isLayer(layer.id)}
                onClick={() => onIsolate(isLayer(layer.id) ? null : { kind: "layer", id: layer.id })}
                className={`${rowClass} aria-pressed:bg-muted aria-pressed:font-medium`}
              >
                <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: layer.color }} />
                <span className="flex-1">{layer.label}</span>
                {isLayer(layer.id) && <Check aria-hidden className="size-3.5" />}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="network-relations">
        <h2 id="network-relations" className="px-2 pb-1 text-xs font-semibold">
          Relations
        </h2>
        <ul className="space-y-0.5">
          {RELATION_ORDER.map((type) => (
            <li key={type}>
              <label className={`${rowClass} cursor-pointer has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50`}>
                <input
                  type="checkbox"
                  checked={enabledTypes.has(type)}
                  onChange={() => onToggleType(type)}
                  className="size-3.5 shrink-0 accent-foreground outline-none"
                />
                <span
                  aria-hidden
                  className="w-5 shrink-0 border-t-2"
                  style={{ borderTopColor: RELATION_STYLE[type].color, borderTopStyle: LINE_STYLE[type] }}
                />
                <span className="flex-1">{RELATION_STYLE[type].label}</span>
                <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{typeCounts[type]}</span>
              </label>
            </li>
          ))}
        </ul>
        <p className="px-2 pt-1.5 text-xs text-muted-foreground">
          Arrows point from a tool to what it ships inside, is built on, or was acquired by.
        </p>
      </section>

      <section aria-labelledby="network-externals">
        <h2 id="network-externals" className="sr-only">
          Companies outside the census
        </h2>
        <label className={`${rowClass} cursor-pointer has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50`}>
          <input
            type="checkbox"
            checked={showExternals}
            onChange={onToggleExternals}
            className="size-3.5 shrink-0 accent-foreground outline-none"
          />
          <span className="flex-1">Show companies outside the census</span>
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{externalCount}</span>
        </label>
      </section>
    </div>
  );
}
