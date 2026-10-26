"use client";

import { ArrowLeftRight, Layers, ListChecks } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useMemo } from "react";
import { CompareView } from "@/components/compare/compare-view";
import { useCompare } from "@/components/compare/use-compare";
import { SegmentedSwitcher, type SegmentOption } from "@/components/segmented-switcher";
import { splitChoices } from "@/lib/compare";
import { choiceCoverage, type PhaseChoice } from "@/lib/connections";
import { filterParsers, type AnalyzeTab } from "@/lib/filters";
import type { Phase, RelationLite, ToolLite } from "@/lib/types";
import { ChoicePanel } from "./choice-panel";
import { StackAnalysis } from "./stack-analysis";

const TABS: readonly SegmentOption<AnalyzeTab>[] = [
  { value: "choose", label: "Choose tools", icon: ListChecks },
  { value: "compare", label: "Compare tools", icon: ArrowLeftRight },
  { value: "stack", label: "Analyze stacks", icon: Layers },
];

/** Analyze choices: the chosen tools and their phase coverage on top, then the tab's view. */
export function AnalyzeView({ tools, relations, phases }: { tools: ToolLite[]; relations: RelationLite[]; phases: Phase[] }) {
  const [{ tab }, setQuery] = useQueryStates(filterParsers);
  const selection = useCompare();
  // A shared link can name a tool that has since been removed or renamed; leave it out.
  const known = useMemo(() => new Set(tools.map((t) => t.id)), [tools]);
  const ids = selection.ids.filter((id) => known.has(id));
  const { add, addVia, remove, clear } = selection;
  const { base, added } = splitChoices(ids, selection.via);

  // Gaps and suggestions come from the stack; tools added from a suggestion keep their phase open.
  const coverage = useMemo<PhaseChoice[]>(
    () => choiceCoverage(base, added, tools, relations, phases.map((p) => p.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [base.join(","), added.join(","), tools, relations, phases],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Analyze choices</h1>
        <SegmentedSwitcher
          options={TABS}
          value={tab}
          onChange={(next) => void setQuery({ tab: next })}
          label="Analysis"
          pillId="analyze-pill"
        />
      </div>

      <ChoicePanel
        tools={tools}
        phases={phases}
        ids={ids}
        coverage={coverage}
        onAdd={add}
        onAddVia={addVia}
        onRemove={remove}
        onClear={clear}
        onMore={() => void setQuery({ tab: "stack" })}
      />

      {tab === "compare" && <CompareView ids={ids} tools={tools} phases={phases} onRemove={remove} />}
      {tab === "stack" && (
        <StackAnalysis tools={tools} phases={phases} ids={ids} coverage={coverage} onAddVia={addVia} onRemove={remove} />
      )}
    </div>
  );
}
