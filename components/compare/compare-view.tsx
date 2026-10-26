"use client";

import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToolDetails } from "@/components/tool/use-tool-details";
import type { Phase, PhaseId, ToolLite } from "@/lib/types";
import { CompareTable, type CompareColumn } from "./compare-table";
import { buildRows } from "./compare-rows";

/**
 * Loads the records for `ids` once and builds compare columns for any subset of them, so one
 * page can show several tables from one fetch.
 */
export function useCompareColumns(scope: string, ids: string[], tools: ToolLite[]) {
  const liteById = useMemo(() => new Map(tools.map((t) => [t.id, t])), [tools]);
  const { data, mutate } = useToolDetails(scope, ids);
  const columnsFor = (subset: string[]): CompareColumn[] =>
    subset.map((id) => {
      const lite = liteById.get(id);
      if (!data || !(id in data)) return { id, lite, tool: null, status: "loading" };
      const detail = data[id];
      return detail ? { id, lite, tool: detail.tool, status: "ready" } : { id, lite, tool: null, status: "failed" };
    });
  return { columnsFor, retry: () => void mutate() };
}

/** The chosen tools side by side, with rows that differ marked and an option to hide the rest. */
export function CompareView({
  ids,
  tools,
  phases,
  onRemove,
}: {
  ids: string[];
  tools: ToolLite[];
  phases: Phase[];
  onRemove: (id: string) => void;
}) {
  const [hideMatching, setHideMatching] = useState(false);
  const { columnsFor, retry } = useCompareColumns("compare", ids, tools);
  const columns = columnsFor(ids);

  const allReady = columns.length > 0 && columns.every((c) => c.status === "ready");
  const anyFailed = columns.some((c) => c.status === "failed");
  const canCompare = allReady && columns.length >= 2;

  const rows = buildRows(columns.map((c) => c.tool));
  const differing = rows.filter((r) => r.differs).length;
  const visibleRows = hideMatching && canCompare ? rows.filter((r) => r.differs) : rows;

  const labelOf = (id: PhaseId) => phases.find((p) => p.id === id)?.label ?? id;

  if (ids.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-12 text-center">
        <p className="font-medium">Nothing to compare yet</p>
        <p className="max-w-prose text-sm text-muted-foreground">
          Choose two or more tools above to see their facts side by side.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-pressed={hideMatching}
          disabled={!canCompare}
          onClick={() => setHideMatching((v) => !v)}
        >
          {hideMatching && <Check aria-hidden />}
          Hide rows that match
        </Button>
        <p className="ml-auto text-sm text-muted-foreground tabular-nums" role="status">
          {ids.length === 1
            ? "Choose at least one more tool to see differences."
            : canCompare
              ? `${differing} of ${rows.length} rows differ.`
              : ""}
        </p>
      </div>

      {anyFailed && (
        <div role="alert" className="flex items-center gap-3 text-sm">
          <span>Some tools could not be loaded.</span>
          <Button type="button" variant="outline" size="sm" onClick={retry}>
            Try again
          </Button>
        </div>
      )}

      <CompareTable columns={columns} rows={visibleRows} labelOf={labelOf} onRemove={onRemove} />
    </div>
  );
}
