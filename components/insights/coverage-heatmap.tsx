"use client";

import { useState } from "react";
import type { HeatmapData } from "@/components/insights/types";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { phaseColor } from "@/lib/format";

type Mode = "heatmap" | "table";

const MIN_PERCENT = 14;
const MAX_PERCENT = 70;

const tint = (percent: number) => `color-mix(in oklab, var(--stage-1) ${percent}%, var(--background))`;

function percentFor(count: number, max: number) {
  if (count <= 0 || max <= 0) return 0;
  return MIN_PERCENT + (MAX_PERCENT - MIN_PERCENT) * (count / max);
}

const toolsLabel = (n: number) => `${n} ${n === 1 ? "tool" : "tools"}`;

export function CoverageHeatmap({ data }: { data: HeatmapData }) {
  const [mode, setMode] = useState<Mode>("heatmap");
  const heat = mode === "heatmap";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Show the matrix as" className="inline-flex gap-1">
          <Button
            type="button"
            size="sm"
            variant={heat ? "secondary" : "outline"}
            aria-pressed={heat}
            onClick={() => setMode("heatmap")}
          >
            Heatmap
          </Button>
          <Button
            type="button"
            size="sm"
            variant={heat ? "outline" : "secondary"}
            aria-pressed={!heat}
            onClick={() => setMode("table")}
          >
            Table
          </Button>
        </div>

        {heat && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground" aria-hidden>
            <span className="font-mono tabular-nums">0</span>
            <span
              className="h-2 w-28 rounded-full border"
              style={{ background: `linear-gradient(to right, ${tint(MIN_PERCENT)}, ${tint(MAX_PERCENT)})` }}
            />
            <span className="font-mono tabular-nums">{data.max}</span>
          </div>
        )}
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border">
        <TooltipProvider delayDuration={100}>
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <caption className="sr-only">Number of tools covering each phase, by segment</caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-10 w-40 bg-background px-3 py-2 text-left text-xs font-medium text-muted-foreground"
                >
                  Segment
                </th>
                {data.phases.map((phase) => (
                  <th key={phase.id} scope="col" className="px-1 py-2 text-center align-bottom text-xs font-medium">
                    <span aria-hidden className="mx-auto mb-1.5 block h-0.5 w-8 rounded-full" style={{ background: phaseColor(phase.id) }} />
                    {phase.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-background px-3 py-2 text-left text-sm font-medium"
                  >
                    {row.label}
                  </th>
                  {data.phases.map((phase) => {
                    const count = row.counts[phase.id] ?? 0;
                    if (!heat) {
                      return (
                        <td
                          key={phase.id}
                          className={`px-1 py-2 text-center font-mono tabular-nums ${count === 0 ? "text-muted-foreground" : ""}`}
                        >
                          {count}
                        </td>
                      );
                    }
                    const percent = percentFor(count, data.max);
                    return (
                      <td key={phase.id} className="p-0.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              aria-label={`${phase.label}, ${row.label}: ${toolsLabel(count)}`}
                              className={`flex h-11 w-full items-center justify-center rounded-sm font-mono tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                                count === 0 ? "bg-muted/40 text-muted-foreground" : "text-foreground"
                              }`}
                              style={count === 0 ? undefined : { background: tint(percent) }}
                            >
                              {count}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {phase.label}, {row.label}: {toolsLabel(count)}
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </TooltipProvider>
      </div>
    </div>
  );
}
