"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { searchLite } from "@/lib/filters";
import type { ToolLite } from "@/lib/types";

const MAX_RESULTS = 8;

export function AddToolPopover({
  tools,
  selected,
  onAdd,
}: {
  tools: ToolLite[];
  selected: string[];
  onAdd: (id: string, name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const hits = useMemo(() => searchLite(tools, trimmed).slice(0, MAX_RESULTS), [tools, trimmed]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus aria-hidden />
          Add a tool
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <Command shouldFilter={false} loop>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search by name, company or customer"
          />
          <CommandList>
            {trimmed ? (
              <CommandEmpty>No tools match.</CommandEmpty>
            ) : (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Type a name, company or customer.
              </p>
            )}
            {hits.length > 0 && (
              <CommandGroup>
                {hits.map((hit) => {
                  const added = selected.includes(hit.id);
                  return (
                    <CommandItem
                      key={hit.id}
                      value={`tool:${hit.id}`}
                      disabled={added}
                      onSelect={() => {
                        onAdd(hit.id, hit.name);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <Logo name={hit.name} src={hit.logo} phase={hit.primaryPhase} size={28} />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium">{hit.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{hit.company}</span>
                      </span>
                      {added && <span className="shrink-0 text-xs text-muted-foreground">Added</span>}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
