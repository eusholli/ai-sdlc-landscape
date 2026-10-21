"use client";

import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { isNotPublished, labelFor, type FacetDef, type FacetOption } from "@/components/filters/facets";

export function FacetPopover({
  def,
  options,
  selected,
  onChange,
}: {
  def: FacetDef;
  options: FacetOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const regular = options.filter((o) => !isNotPublished(o.value));
  const unpublished = options.find((o) => isNotPublished(o.value));

  function toggle(value: string, on: boolean) {
    onChange(on ? [...selected, value] : selected.filter((v) => v !== value));
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={selected.length ? `${def.label}, ${selected.length} selected` : def.label}
        >
          {def.label}
          {selected.length > 0 && (
            <Badge variant="secondary" className="min-w-5 px-1.5 font-mono tabular-nums">
              {selected.length}
            </Badge>
          )}
          <ChevronDown aria-hidden className="opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 gap-0 p-0">
        <div className="flex items-center justify-between border-b px-3 py-1.5">
          <span className="text-xs font-medium text-muted-foreground">{def.label}</span>
          {selected.length > 0 && (
            <Button variant="ghost" size="xs" onClick={() => onChange([])}>
              Clear
            </Button>
          )}
        </div>
        <div role="group" aria-label={def.label} className="max-h-72 overflow-y-auto p-1">
          {regular.map((option) => (
            <OptionRow
              key={option.value}
              label={labelFor(def, option.value)}
              checked={selected.includes(option.value)}
              onCheckedChange={(on) => toggle(option.value, on)}
              trailing={
                <span className="font-mono text-xs text-muted-foreground tabular-nums">{option.count}</span>
              }
            />
          ))}
          {unpublished && (
            <>
              {regular.length > 0 && <div role="presentation" className="mx-2 my-1 h-px bg-border" />}
              <OptionRow
                label={`Not published (${unpublished.count})`}
                muted
                checked={selected.includes(unpublished.value)}
                onCheckedChange={(on) => toggle(unpublished.value, on)}
              />
            </>
          )}
          {options.length === 0 && <p className="px-2 py-3 text-sm text-muted-foreground">No options.</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function OptionRow({
  label,
  checked,
  muted = false,
  trailing,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  muted?: boolean;
  trailing?: React.ReactNode;
  onCheckedChange: (on: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-sm px-2 py-1.5 text-sm hover:bg-muted has-[:focus-visible]:bg-muted">
      <Checkbox
        checked={checked}
        onCheckedChange={(state) => onCheckedChange(state === true)}
        className="mt-0.5"
      />
      <span className={muted ? "min-w-0 flex-1 leading-snug text-muted-foreground" : "min-w-0 flex-1 leading-snug"}>
        {label}
      </span>
      {trailing}
    </label>
  );
}
