"use client";

import { Check, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryStates } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { useCompare } from "@/components/compare/use-compare";
import { Logo } from "@/components/logo";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { phaseColor } from "@/lib/format";
import { filterParsers, searchLite, type SearchHit } from "@/lib/filters";
import type { Phase, ToolLite } from "@/lib/types";
import { OPEN_SEARCH_EVENT } from "@/lib/ui-events";

const MAX_TOOL_RESULTS = 20;

const reasonFor = (hit: SearchHit): string => {
  switch (hit.matched) {
    case "name": return "Name";
    case "company": return "Company";
    case "customer": return `Customer: ${hit.match}`;
    case "summary": return "Claim";
  }
};

export function SearchPalette({ tools, phases }: { tools: ToolLite[]; phases: Phase[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState("");
  const [, setState] = useQueryStates(filterParsers);
  const { has, toggle } = useCompare();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_SEARCH_EVENT, onOpen);
  }, []);

  const trimmed = query.trim();

  const toolHits = useMemo(() => searchLite(tools, trimmed).slice(0, MAX_TOOL_RESULTS), [tools, trimmed]);

  const phaseHits = useMemo(() => {
    const ordered = [...phases].sort((a, b) => a.order - b.order);
    if (!trimmed) return ordered;
    const needle = trimmed.toLowerCase();
    return ordered.filter((p) => p.label.toLowerCase().includes(needle) || p.id.includes(needle));
  }, [phases, trimmed]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setQuery("");
  }

  function openTool(id: string) {
    handleOpenChange(false);
    if (pathname === "/") void setState({ tool: id });
    else router.push(`/tools/${encodeURIComponent(id)}`);
  }

  function filterByPhase(id: string) {
    handleOpenChange(false);
    if (pathname === "/") void setState({ phase: [id], tool: null });
    else router.push(`/?phase=${encodeURIComponent(id)}`);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Search the landscape"
      description="Find a tool by name, company or customer, or filter the map by phase."
      className="sm:max-w-xl"
    >
      <Command
        shouldFilter={false}
        loop
        value={highlighted}
        onValueChange={setHighlighted}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || !event.shiftKey || event.nativeEvent.isComposing) return;
          if (!highlighted.startsWith("tool:")) return;
          event.preventDefault();
          toggle(highlighted.slice("tool:".length));
        }}
      >
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search tools, companies, customers or phases"
        />
        <CommandList className="max-h-[min(24rem,60dvh)]">
          <CommandEmpty>No tools or phases match.</CommandEmpty>

          {toolHits.length > 0 && (
            <CommandGroup heading="Tools">
              {toolHits.map((hit) => {
                const inSet = has(hit.id);
                const Icon = inSet ? Check : Plus;
                return (
                  <CommandItem key={hit.id} value={`tool:${hit.id}`} onSelect={() => openTool(hit.id)}>
                    <Logo name={hit.name} src={hit.logo} phase={hit.primaryPhase} size={28} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">{hit.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{hit.company}</span>
                    </span>
                    <span className="max-w-32 shrink-0 truncate text-xs text-muted-foreground">
                      {reasonFor(hit)}
                    </span>
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-pressed={inSet}
                      aria-label={inSet ? `Remove ${hit.name} from your choices` : `Add ${hit.name} to your choices`}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggle(hit.id);
                      }}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md border bg-background px-1.5 py-0.5 text-xs text-muted-foreground outline-none hover:text-foreground"
                    >
                      <Icon className="size-3" aria-hidden />
                      {inSet ? "Chosen" : "Choose"}
                    </button>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {phaseHits.length > 0 && (
            <CommandGroup heading={trimmed ? "Phases" : "Filter the map by phase"}>
              {phaseHits.map((phase) => (
                <CommandItem key={phase.id} value={`phase:${phase.id}`} onSelect={() => filterByPhase(phase.id)}>
                  <span
                    aria-hidden
                    className="h-5 w-1 shrink-0 rounded-full"
                    style={{ background: phaseColor(phase.id) }}
                  />
                  <span className="min-w-0 flex-1 truncate">{phase.label}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">Filter the map</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
        <p className="border-t px-3 py-2 text-xs text-muted-foreground">
          Enter opens a tool. Shift and Enter adds it to your choices.
        </p>
      </Command>
    </CommandDialog>
  );
}
