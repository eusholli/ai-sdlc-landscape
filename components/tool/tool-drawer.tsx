"use client";

import { useQueryStates } from "nuqs";
import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { filterParsers } from "@/lib/filters";
import { ToolDetail } from "./tool-detail";
import { ToolDetailSkeleton } from "./tool-detail-skeleton";
import type { ToolDetailData, ToolDetailRefs } from "./types";

class RequestError extends Error {
  constructor(readonly status: number) {
    super(`Request failed with status ${status}`);
  }
}

async function fetchTool(url: string): Promise<ToolDetailData> {
  const res = await fetch(url);
  if (!res.ok) throw new RequestError(res.status);
  return res.json();
}

/** Opens whenever the `tool` URL key is set, in any view, and fetches that tool's JSON. */
export function ToolDrawer({ refs }: { refs: ToolDetailRefs }) {
  const [{ tool }, setQuery] = useQueryStates(filterParsers);

  // Keep the last id while the sheet slides out, so the content does not vanish mid-animation.
  const [shownId, setShownId] = useState(tool);
  if (tool && tool !== shownId) setShownId(tool);

  const { data, error, mutate } = useSWR<ToolDetailData, RequestError>(
    shownId ? `/data/tools/${encodeURIComponent(shownId)}.json` : null,
    fetchTool,
    { revalidateOnFocus: false },
  );

  const notFound = error?.status === 404;

  return (
    <Sheet
      open={!!tool}
      onOpenChange={(open) => {
        if (!open) void setQuery({ tool: null });
      }}
    >
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-hidden data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
      >
        <SheetTitle className="sr-only">{data ? data.tool.name : "Tool details"}</SheetTitle>
        <SheetDescription className="sr-only">
          Facts, relations and sources for the selected tool.
        </SheetDescription>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-8">
          {error ? (
            <div role="alert" className="flex flex-col items-start gap-3 pr-10">
              <p className="text-sm font-semibold">{notFound ? "No such tool" : "Could not load this tool"}</p>
              <p className="text-sm text-muted-foreground">
                {notFound
                  ? `The landscape has no tool with the id "${shownId}".`
                  : "The request failed. Check your connection and try again."}
              </p>
              {!notFound && (
                <Button type="button" variant="outline" size="sm" onClick={() => void mutate()}>
                  Try again
                </Button>
              )}
            </div>
          ) : data && data.tool.id === shownId ? (
            <ToolDetail data={data} refs={refs} variant="drawer" headerClassName="pr-10" />
          ) : (
            <ToolDetailSkeleton />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
