"use client";

import { Check, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useQueryStates } from "nuqs";
import { Suspense, useMemo } from "react";
import { FacetPopover } from "@/components/filters/facet-popover";
import {
  buildFacets,
  CLEAR_ALL_FILTERS,
  labelFor,
  mergeOptions,
  type FacetDef,
  type FacetKey,
} from "@/components/filters/facets";
import { SITE_CONTAINER } from "@/components/site-name";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { applyFilters, facetCounts, filterParsers } from "@/lib/filters";
import type { Phase, Segment, ToolLite } from "@/lib/types";

const BAR_HEIGHT = "h-[3.25rem]";

interface FilterBarProps {
  tools: ToolLite[];
  phases: Phase[];
  segments: Segment[];
}

export function FilterBar(props: FilterBarProps) {
  const pathname = usePathname();
  if (pathname !== "/") return null;
  return (
    <Suspense fallback={<div aria-hidden className={`${BAR_HEIGHT} border-b`} />}>
      <FilterBarContent {...props} />
    </Suspense>
  );
}

interface Chip {
  id: string;
  label: string;
  remove: () => void;
}

function FilterBarContent({ tools, phases, segments }: FilterBarProps) {
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

  // Counts cover the census tools; the model providers are context, not part of the count.
  const census = useMemo(() => tools.filter((t) => t.layer !== "model"), [tools]);
  const shown = useMemo(() => applyFilters(census, state).length, [census, state]);

  function patchUrl(values: Record<string, string[] | boolean | null>) {
    void setState(values as never, { history: "replace" });
  }

  function setFacet(key: FacetKey, next: string[]) {
    patchUrl({ [key]: next.length ? next : null });
  }

  const chips: Chip[] = [];
  if (state.q) chips.push({ id: "q", label: `Search: ${state.q}`, remove: () => patchUrl({ q: null }) });
  for (const def of facets) {
    const selected: string[] = state[def.key];
    for (const value of selected) {
      chips.push({
        id: `${def.key}:${value}`,
        label: `${def.label}: ${labelFor(def, value)}`,
        remove: () =>
          setFacet(
            def.key,
            selected.filter((v) => v !== value),
          ),
      });
    }
  }
  if (state.oss) chips.push({ id: "oss", label: "Open source only", remove: () => patchUrl({ oss: null }) });
  if (state.moved) {
    chips.push({ id: "moved", label: "Acquired or shut down", remove: () => patchUrl({ moved: null }) });
  }

  return (
    <div className="border-b bg-background">
      <div className={SITE_CONTAINER}>
        <div className="flex items-center gap-3 py-1.5">
          <div
            role="group"
            aria-label="Filters"
            className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto p-1 [&>*]:shrink-0"
          >
            {facets.map((def: FacetDef) => (
              <FacetPopover
                key={def.key}
                def={def}
                options={optionsByKey[def.key]}
                selected={state[def.key]}
                onChange={(next) => setFacet(def.key, next)}
              />
            ))}
            <Separator orientation="vertical" className="mx-1 h-5" />
            <Button
              variant={state.oss ? "default" : "outline"}
              size="sm"
              aria-pressed={state.oss}
              onClick={() => patchUrl({ oss: state.oss ? null : true })}
            >
              {state.oss && <Check aria-hidden />}
              Open source only
            </Button>
            <Button
              variant={state.moved ? "default" : "outline"}
              size="sm"
              aria-pressed={state.moved}
              onClick={() => patchUrl({ moved: state.moved ? null : true })}
            >
              {state.moved && <Check aria-hidden />}
              Acquired or shut down
            </Button>
          </div>
          <p aria-live="polite" className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">
            Showing <span className="font-mono tabular-nums">{shown}</span> of{" "}
            <span className="font-mono tabular-nums">{census.length}</span>
          </p>
        </div>

        {chips.length > 0 && (
          <ul aria-label="Active filters" className="flex flex-wrap items-center gap-1.5 pb-2">
            {chips.map((chip) => (
              <li
                key={chip.id}
                className="inline-flex items-center gap-0.5 rounded-full border bg-muted/50 py-0.5 pr-0.5 pl-2.5 text-xs"
              >
                <span>{chip.label}</span>
                <button
                  type="button"
                  onClick={chip.remove}
                  aria-label={`Remove filter ${chip.label}`}
                  className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <X aria-hidden className="size-3" />
                </button>
              </li>
            ))}
            <li>
              <Button variant="link" size="xs" onClick={() => patchUrl({ ...CLEAR_ALL_FILTERS })}>
                Clear all
              </Button>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
