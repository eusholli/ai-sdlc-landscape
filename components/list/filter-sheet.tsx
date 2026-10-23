"use client";

import { SlidersHorizontal } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useMemo } from "react";
import {
  buildFacets,
  CLEAR_ALL_FILTERS,
  isNotPublished,
  labelFor,
  mergeOptions,
  type FacetDef,
  type FacetKey,
} from "@/components/filters/facets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { applyFilters, facetCounts, filterParsers } from "@/lib/filters";
import type { Phase, Segment, ToolLite } from "@/lib/types";

interface FilterSheetProps {
  tools: ToolLite[];
  phases: Phase[];
  segments: Segment[];
}

function CheckRow({
  label,
  checked,
  count,
  muted = false,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  count?: number;
  muted?: boolean;
  onCheckedChange: (on: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-1 text-sm has-[:focus-visible]:bg-muted">
      <Checkbox checked={checked} onCheckedChange={(state) => onCheckedChange(state === true)} />
      <span className={muted ? "flex-1 text-muted-foreground" : "flex-1"}>{label}</span>
      {count !== undefined && (
        <span className="font-mono text-xs text-muted-foreground tabular-nums">{count}</span>
      )}
    </label>
  );
}

export function FilterSheet({ tools, phases, segments }: FilterSheetProps) {
  const [state, setState] = useQueryStates(filterParsers);
  const facets = useMemo(() => buildFacets(phases, segments), [phases, segments]);

  const optionsByKey = useMemo(
    () =>
      Object.fromEntries(
        facets.map((def) => {
          const selected: string[] = state[def.key];
          return [def.key, mergeOptions(def, facetCounts(tools, state, def.key), selected)];
        }),
      ),
    [facets, tools, state],
  );

  const shown = useMemo(() => applyFilters(tools, state).length, [tools, state]);
  const anyNew = useMemo(() => tools.some((t) => t.isNew), [tools]);
  const activeCount =
    facets.reduce((sum, def) => sum + state[def.key].length, 0) +
    (state.oss ? 1 : 0) +
    (state.moved ? 1 : 0) +
    (state.recent ? 1 : 0);

  function patch(values: Record<string, string[] | boolean | null>) {
    void setState(values as never, { history: "replace" });
  }

  function toggle(key: FacetKey, value: string, on: boolean) {
    const current: string[] = state[key];
    const next = on ? [...current, value] : current.filter((v) => v !== value);
    patch({ [key]: next.length ? next : null });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="h-11"
          aria-label={activeCount ? `Filters, ${activeCount} active` : "Filters"}
        >
          <SlidersHorizontal aria-hidden />
          Filters
          {activeCount > 0 && (
            <Badge variant="secondary" className="min-w-5 px-1.5 font-mono tabular-nums">
              {activeCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-xl">
        <SheetHeader className="pb-0">
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Counts show how many tools each option would give.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {facets.map((def: FacetDef) => (
            <fieldset key={def.key} className="border-t py-2 first:border-t-0">
              <legend className="py-1 text-sm font-semibold">{def.label}</legend>
              {optionsByKey[def.key].map((option) => (
                <CheckRow
                  key={option.value}
                  label={labelFor(def, option.value)}
                  count={option.count}
                  muted={isNotPublished(option.value)}
                  checked={(state[def.key] as string[]).includes(option.value)}
                  onCheckedChange={(on) => toggle(def.key, option.value, on)}
                />
              ))}
            </fieldset>
          ))}
          <fieldset className="border-t py-2">
            <legend className="py-1 text-sm font-semibold">More</legend>
            <CheckRow
              label="Open source only"
              checked={state.oss}
              onCheckedChange={(on) => patch({ oss: on ? true : null })}
            />
            <CheckRow
              label="Acquired or shut down"
              checked={state.moved}
              onCheckedChange={(on) => patch({ moved: on ? true : null })}
            />
            {(anyNew || state.recent) && (
              <CheckRow
                label="Added in the last 30 days"
                checked={state.recent}
                onCheckedChange={(on) => patch({ recent: on ? true : null })}
              />
            )}
          </fieldset>
        </div>

        <SheetFooter className="flex-row border-t bg-popover">
          <Button variant="outline" className="flex-1" onClick={() => patch({ ...CLEAR_ALL_FILTERS })}>
            Clear all
          </Button>
          <SheetClose asChild>
            <Button className="flex-1">
              Show {shown} {shown === 1 ? "tool" : "tools"}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
