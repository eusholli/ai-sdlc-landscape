"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface HeatmapRow {
  id: string;
  label: string;
}

export interface HeatmapColumn {
  id: string;
  label: string;
}

interface CoverageHeatmapProps {
  columns: HeatmapColumn[];
  rows: HeatmapRow[];
  /** Keyed `${rowId}|${columnId}`. */
  counts: Record<string, number>;
}

const MIN_MIX = 12;
const MAX_MIX = 70;

const cellKey = (rowId: string, columnId: string) => `${rowId}|${columnId}`;

function rampColour(count: number, max: number): string {
  if (count === 0) return "transparent";
  const mix = MIN_MIX + (MAX_MIX - MIN_MIX) * (count / max);
  return `color-mix(in oklab, var(--stage-1) ${mix}%, var(--background))`;
}

const noun = (n: number) => (n === 1 ? "tool" : "tools");

export function CoverageHeatmap({ columns, rows, counts }: CoverageHeatmapProps) {
  const [view, setView] = useState<"heatmap" | "table">("heatmap");
  const max = Math.max(1, ...Object.values(counts));
  const gridTemplate = `minmax(8rem, 11rem) repeat(${columns.length}, minmax(2.25rem, 1fr))`;

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Coverage view" className="flex gap-1.5">
        {(["heatmap", "table"] as const).map((option) => (
          <Button
            key={option}
            size="sm"
            className="max-md:h-11 max-md:px-4"
            variant={view === option ? "default" : "outline"}
            aria-pressed={view === option}
            onClick={() => setView(option)}
          >
            {option === "heatmap" ? "Heatmap" : "Table"}
          </Button>
        ))}
      </div>

      {view === "heatmap" ? (
        <TooltipProvider>
          <div
            role="region"
            aria-label="Coverage heatmap, scrolls sideways on narrow screens"
            tabIndex={0}
            className="overflow-x-auto pb-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <div className="grid min-w-[44rem] gap-1" style={{ gridTemplateColumns: gridTemplate }}>
              <div aria-hidden />
              {columns.map((column) => (
                <div
                  key={column.id}
                  className="flex justify-center pb-1 text-xs text-muted-foreground [writing-mode:vertical-rl] rotate-180"
                >
                  {column.label}
                </div>
              ))}
              {rows.map((row) => (
                <div key={row.id} className="contents">
                  <div className="flex items-center pr-2 text-sm font-medium">{row.label}</div>
                  {columns.map((column) => {
                    const n = counts[cellKey(row.id, column.id)] ?? 0;
                    return (
                      <Tooltip key={column.id}>
                        <TooltipTrigger asChild>
                          <div
                            role="img"
                            aria-label={`${row.label}, ${column.label}: ${n} ${noun(n)}`}
                            className="flex h-11 items-center justify-center rounded-sm border border-dashed border-transparent font-mono text-xs tabular-nums data-[empty=true]:border-border data-[empty=true]:text-muted-foreground"
                            data-empty={n === 0}
                            style={{ background: rampColour(n, max) }}
                          >
                            {n}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {n} {noun(n)} in {row.label} cover {column.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono tabular-nums">0</span>
            <span
              aria-hidden
              className="h-2 w-32 rounded-full border"
              style={{
                background: `linear-gradient(to right, ${rampColour(1, max * 1000)}, ${rampColour(max, max)})`,
              }}
            />
            <span className="font-mono tabular-nums">{max}</span>
            <span>tools per cell. Use the Table view for exact values.</span>
          </div>
        </TooltipProvider>
      ) : (
        <Table>
          <caption className="sr-only">Number of tools covering each phase, by segment</caption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Segment</TableHead>
              {columns.map((column) => (
                <TableHead key={column.id} scope="col" className="text-right">
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableHead scope="row" className="font-medium">
                  {row.label}
                </TableHead>
                {columns.map((column) => (
                  <TableCell key={column.id} className="text-right font-mono tabular-nums">
                    {counts[cellKey(row.id, column.id)] ?? 0}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
