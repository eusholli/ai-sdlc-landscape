"use client";

import { BAND_ICON, BAND_WORD } from "@/components/freshness-meta";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate } from "@/lib/format";
import type { FreshnessBand } from "@/lib/types";

/**
 * How recently a record's sources were checked. It reads only the record's own `checked` date, so
 * it works in the drawer, which has no build date.
 */
export function FreshnessChip({
  band,
  checked,
  description,
}: {
  band: FreshnessBand;
  checked: string;
  description: string;
}) {
  const Icon = BAND_ICON[band];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            className="inline-flex cursor-default items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Icon aria-hidden className="size-3.5 shrink-0 text-foreground" />
            <span className="font-medium text-foreground">{BAND_WORD[band]}</span>
            <span className="text-muted-foreground">
              sources checked since <time dateTime={checked} className="tabular-nums">{formatDate(checked)}</time>
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="flex-col items-start gap-0.5">
          <span className="font-medium">{description}</span>
          <span>How recently we checked this record&apos;s sources. It says nothing about the tool.</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
