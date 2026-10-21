"use client";

import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import type { ToolDetailData } from "@/components/tool/types";
import { MAX_COMPARE } from "@/lib/compare";
import type { Phase, PhaseId, ToolLite } from "@/lib/types";
import { AddToolPopover } from "./add-tool-popover";
import { CompareTable, type CompareColumn } from "./compare-table";
import { buildRows } from "./compare-rows";
import { useCompare } from "./use-compare";

type Loaded = Record<string, ToolDetailData | null>;

const KEY_PREFIX = "compare:";

async function fetchAll(ids: string[]): Promise<Loaded> {
  const entries = await Promise.all(
    ids.map(async (id): Promise<[string, ToolDetailData | null]> => {
      try {
        const res = await fetch(`/data/tools/${encodeURIComponent(id)}.json`);
        return [id, res.ok ? ((await res.json()) as ToolDetailData) : null];
      } catch {
        return [id, null];
      }
    }),
  );
  return Object.fromEntries(entries);
}

export function CompareView({ tools, phases }: { tools: ToolLite[]; phases: Phase[] }) {
  const liteById = useMemo(() => new Map(tools.map((t) => [t.id, t])), [tools]);
  const { ids, add, remove, clear } = useCompare((id) => liteById.get(id)?.name);
  const [hideMatching, setHideMatching] = useState(false);

  const { data, mutate } = useSWR<Loaded>(
    ids.length ? `${KEY_PREFIX}${ids.join(",")}` : null,
    (key: string) => fetchAll(key.slice(KEY_PREFIX.length).split(",")),
    { keepPreviousData: true, revalidateOnFocus: false },
  );

  const columns: CompareColumn[] = ids.map((id) => {
    const lite = liteById.get(id);
    if (!data || !(id in data)) return { id, lite, tool: null, status: "loading" };
    const detail = data[id];
    return detail ? { id, lite, tool: detail.tool, status: "ready" } : { id, lite, tool: null, status: "failed" };
  });

  const allReady = columns.length > 0 && columns.every((c) => c.status === "ready");
  const anyFailed = columns.some((c) => c.status === "failed");
  const canCompare = allReady && columns.length >= 2;

  const rows = buildRows(columns.map((c) => c.tool));
  const differing = rows.filter((r) => r.differs).length;
  const visibleRows = hideMatching && canCompare ? rows.filter((r) => r.differs) : rows;

  const labelOf = (id: PhaseId) => phases.find((p) => p.id === id)?.label ?? id;

  const status =
    ids.length === 0
      ? ""
      : ids.length === 1
        ? "Add at least one more tool to see differences."
        : canCompare
          ? `${differing} of ${rows.length} rows differ.`
          : "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <AddToolPopover tools={tools} selected={ids} onAdd={add} />
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
        {ids.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            Clear all
          </Button>
        )}
        <p className="ml-auto text-sm text-muted-foreground tabular-nums" role="status">
          {ids.length > 0 && <span className="mr-3">{`${ids.length} of ${MAX_COMPARE} tools`}</span>}
          {status}
        </p>
      </div>

      {anyFailed && (
        <div role="alert" className="flex items-center gap-3 text-sm">
          <span>Some tools could not be loaded.</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void mutate()}>
            Try again
          </Button>
        </div>
      )}

      {ids.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
          <p className="font-medium">Nothing to compare yet</p>
          <p className="max-w-prose text-sm text-muted-foreground">
            Add two to four tools to see their facts side by side. You can also add a tool from the map, the search
            palette or a tool&apos;s detail view.
          </p>
          <AddToolPopover tools={tools} selected={ids} onAdd={add} />
        </div>
      ) : (
        <CompareTable columns={columns} rows={visibleRows} labelOf={labelOf} onRemove={remove} />
      )}
    </div>
  );
}
