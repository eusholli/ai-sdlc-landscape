"use client";

import { Check, Plus } from "lucide-react";
import { useCompare } from "@/components/compare/use-compare";
import { cn } from "@/lib/utils";

/** Corner button on a map tile. Hidden until the tile is hovered or focused, unless the tool is already chosen. */
export function TileCompareButton({ id, name }: { id: string; name: string }) {
  const { has, toggle } = useCompare();
  const inSet = has(id);
  const Icon = inSet ? Check : Plus;

  return (
    <button
      type="button"
      aria-pressed={inSet}
      aria-label={inSet ? `Remove ${name} from your choices` : `Add ${name} to your choices`}
      onClick={(event) => {
        event.stopPropagation();
        toggle(id);
      }}
      className={cn(
        "absolute top-0.5 left-0.5 grid size-6 place-items-center rounded-md border bg-background text-muted-foreground opacity-0 outline-none transition-opacity hover:text-foreground focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50 group-focus-within:opacity-100 group-hover:opacity-100",
        inSet && "border-foreground/40 text-foreground opacity-100",
      )}
    >
      <Icon className="size-3.5" aria-hidden />
    </button>
  );
}
