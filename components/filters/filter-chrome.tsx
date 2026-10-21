"use client";

import { Suspense } from "react";
import { FilterBar } from "@/components/filters/filter-bar";
import { SearchPalette } from "@/components/filters/search-palette";
import type { Phase, Segment, ToolLite } from "@/lib/types";

/** One client entry point so the lite tools cross the server boundary once for both consumers. */
export function FilterChrome({
  tools,
  phases,
  segments,
}: {
  tools: ToolLite[];
  phases: Phase[];
  segments: Segment[];
}) {
  return (
    <>
      <Suspense fallback={null}>
        <SearchPalette tools={tools} phases={phases} />
      </Suspense>
      <div className="hidden md:block">
        <FilterBar tools={tools} phases={phases} segments={segments} />
      </div>
    </>
  );
}
