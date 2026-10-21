"use client";

import { useQueryStates } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { FilterSheet } from "@/components/list/filter-sheet";
import { buildGroups } from "@/components/list/groups";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CLEAR_ALL_FILTERS } from "@/components/filters/facets";
import { applyFilters, filterParsers } from "@/lib/filters";
import type { Layer, Phase, Segment, ToolLite } from "@/lib/types";

export interface PhaseListProps {
  tools: ToolLite[];
  phases: Phase[];
  layers: Layer[];
  segments: Segment[];
  fullLifecycleIds: string[];
}

function useStickyHeaderHeight(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const header = document.querySelector<HTMLElement>("header.sticky");
    if (!header) return;
    const update = () => setHeight(header.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  return height;
}

export function PhaseList({ tools, phases, layers, segments, fullLifecycleIds }: PhaseListProps) {
  const [query, setQuery] = useQueryStates(filterParsers);
  const headerHeight = useStickyHeaderHeight();

  const groups = useMemo(
    () => buildGroups(tools, phases, layers, fullLifecycleIds, query.layers),
    [tools, phases, layers, fullLifecycleIds, query.layers],
  );

  const matched = useMemo(() => new Set(applyFilters(tools, query).map((t) => t.id)), [tools, query]);
  // Counts cover the census tools; the model providers are context, not part of the count.
  const census = useMemo(() => tools.filter((t) => t.layer !== "model"), [tools]);
  const censusShown = census.filter((t) => matched.has(t.id)).length;

  const visible = useMemo(
    () =>
      groups
        .map((group) => ({ ...group, shown: group.tools.filter((t) => matched.has(t.id)) }))
        .filter((group) => group.shown.length > 0),
    [groups, matched],
  );

  return (
    <div className="border-b">
      <div className="flex flex-col gap-2 border-b bg-background p-3 md:hidden">
        <div role="search" className="flex gap-2">
          <Input
            type="search"
            aria-label="Search tools"
            placeholder="Search tools"
            value={query.q}
            onChange={(event) => void setQuery({ q: event.target.value || null }, { history: "replace" })}
            className="h-9 flex-1"
          />
          <FilterSheet tools={tools} phases={phases} segments={segments} />
        </div>
        <p aria-live="polite" className="text-xs text-muted-foreground">
          Showing <span className="font-mono tabular-nums">{censusShown}</span> of{" "}
          <span className="font-mono tabular-nums">{census.length}</span>
        </p>
      </div>

      <div className="mx-auto max-w-3xl">
        {visible.length === 0 ? (
          <div role="status" className="flex flex-col items-start gap-3 p-6 text-sm">
            <p>No tools match these filters.</p>
            <Button variant="outline" size="sm" onClick={() => void setQuery({ ...CLEAR_ALL_FILTERS })}>
              Clear all filters
            </Button>
          </div>
        ) : (
          visible.map((group) => (
            <section key={group.id} aria-labelledby={`list-${group.id}`}>
              <h2
                id={`list-${group.id}`}
                className="sticky z-10 flex items-baseline justify-between border-y-0 border-t-2 border-b bg-background px-4 py-2 text-sm font-semibold"
                style={{ top: headerHeight, borderTopColor: group.colour }}
              >
                {group.label}
                <span className="font-mono text-xs font-normal text-muted-foreground tabular-nums">
                  {group.shown.length === group.tools.length
                    ? group.tools.length
                    : `${group.shown.length} of ${group.tools.length}`}
                </span>
              </h2>
              <ul className="divide-y">
                {group.shown.map((tool) => (
                  <li key={tool.id}>
                    <button
                      type="button"
                      onClick={() => void setQuery({ tool: tool.id })}
                      className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
                    >
                      <Logo name={tool.name} src={tool.logo} phase={tool.primaryPhase} size={36} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{tool.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {tool.company}
                          {tool.moved && " \u00B7 Acquired or shut down"}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
