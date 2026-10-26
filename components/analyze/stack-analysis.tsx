"use client";

import { CompareTable } from "@/components/compare/compare-table";
import { buildRows } from "@/components/compare/compare-rows";
import { useCompareColumns } from "@/components/compare/compare-view";
import { Button } from "@/components/ui/button";
import { MAX_SUGGESTED } from "@/lib/compare";
import type { PhaseChoice } from "@/lib/connections";
import { phaseColor } from "@/lib/format";
import type { Phase, PhaseId, ToolLite } from "@/lib/types";

/**
 * For each phase the stack leaves empty, the tools ticked for it and then the top suggestions,
 * side by side, so a team can weigh what would fill the gap. Suggestions come from recorded
 * links only.
 */
export function StackAnalysis({
  tools,
  phases,
  ids,
  coverage,
  onAddVia,
  onRemove,
}: {
  tools: ToolLite[];
  phases: Phase[];
  ids: string[];
  coverage: PhaseChoice[];
  onAddVia: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const gaps = coverage.filter((c) => c.gap);
  const filled = gaps.filter((g) => g.suggested.length > 0);
  const unfilled = gaps.filter((g) => g.suggested.length === 0);
  // Every tool added for the phase, then the top suggestions not yet added, up to MAX_SUGGESTED.
  const topOf = (g: PhaseChoice) => {
    const rest = g.suggested.map((s) => s.tool).filter((id) => !g.added.includes(id));
    return [...g.added, ...rest.slice(0, Math.max(0, MAX_SUGGESTED - g.added.length))];
  };
  const allIds = [...new Set(filled.flatMap(topOf))];
  const { columnsFor, retry } = useCompareColumns("stack", allIds, tools);
  const labelOf = (id: PhaseId) => phases.find((p) => p.id === id)?.label ?? id;

  if (ids.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-12 text-center">
        <p className="font-medium">Nothing to analyze yet</p>
        <p className="max-w-prose text-sm text-muted-foreground">
          Choose the tools in your stack above. For each phase they leave empty, the tools you tick and the
          tools linked to them are compared here.
        </p>
      </div>
    );
  }

  if (gaps.length === 0) {
    return <p className="text-sm text-muted-foreground">Your choices cover every phase.</p>;
  }

  const columns = columnsFor(allIds);
  const anyFailed = columns.some((c) => c.status === "failed");

  return (
    <div className="flex flex-col gap-8">
      {anyFailed && (
        <div role="alert" className="flex items-center gap-3 text-sm">
          <span>Some tools could not be loaded.</span>
          <Button type="button" variant="outline" size="sm" onClick={retry}>
            Try again
          </Button>
        </div>
      )}
      {filled.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No tool covering an empty phase has a recorded link to your choices.
        </p>
      )}
      {filled.map((g) => {
        const cols = columnsFor(topOf(g));
        return (
          <section key={g.phase} aria-labelledby={`gap-${g.phase}`} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 id={`gap-${g.phase}`} className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <span aria-hidden className="h-5 w-1 rounded-full" style={{ background: phaseColor(g.phase) }} />
                {labelOf(g.phase)}
              </h2>
              <p className="text-sm text-muted-foreground">{blurb(g)}</p>
            </div>
            <CompareTable
              columns={cols}
              rows={buildRows(cols.map((c) => c.tool))}
              labelOf={labelOf}
              actionFor={(id) =>
                g.added.includes(id) ? { kind: "added", run: onRemove } : { kind: "add", run: onAddVia }
              }
              caption={`Tools suggested for ${labelOf(g.phase)}, one column per tool`}
            />
          </section>
        );
      })}
      {unfilled.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {`No tool with a recorded link to your choices covers ${unfilled.map((g) => labelOf(g.phase)).join(", ")}.`}
        </p>
      )}
    </div>
  );
}

/** What a phase's table holds. */
function blurb(g: PhaseChoice): string {
  const n = g.added.length;
  const shown = Math.max(n, Math.min(MAX_SUGGESTED, g.suggested.length));
  const of = `${g.suggested.length} that cover this phase and link to your choices`;
  if (n === 0) {
    return g.suggested.length > MAX_SUGGESTED
      ? `The ${MAX_SUGGESTED} tools with the most links to your choices, of ${of}. Add one with its + button.`
      : "The tools that cover this phase and link to your choices. Add one with its + button.";
  }
  const added = n === 1 ? "The tool you added" : `The ${n} tools you added`;
  return shown > n ? `${added}, then the ones with the most links to your choices, of ${of}.` : `${added}, of ${of}.`;
}
