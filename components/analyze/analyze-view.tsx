"use client";

import { ArrowLeftRight, ListChecks } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useEffect, useMemo } from "react";
import { CompareView } from "@/components/compare/compare-view";
import { useCompare } from "@/components/compare/use-compare";
import { SegmentedSwitcher, type SegmentOption } from "@/components/segmented-switcher";
import { focusTools, splitChoices } from "@/lib/compare";
import { choiceCoverage, unlinkedChoices, type PhaseChoice } from "@/lib/connections";
import { filterParsers, type AnalyzeTab } from "@/lib/filters";
import type { Phase, PhaseId, RelationLite, ToolLite } from "@/lib/types";
import { ChoicePanel } from "./choice-panel";

const TABS: readonly SegmentOption<AnalyzeTab>[] = [
  { value: "choose", label: "Choose tools", icon: ListChecks },
  { value: "compare", label: "Compare tools", icon: ArrowLeftRight },
];

/** Analyze choices: the chosen tools and their phase coverage on top, then the tab's view. */
export function AnalyzeView({ tools, relations, phases }: { tools: ToolLite[]; relations: RelationLite[]; phases: Phase[] }) {
  const [{ tab: rawTab, focus }, setQuery] = useQueryStates(filterParsers);
  // An old link to the removed Analyze stacks tab opens Compare tools.
  const tab: AnalyzeTab = rawTab === "stack" ? "compare" : rawTab;
  useEffect(() => {
    if (rawTab === "stack") void setQuery({ tab: "compare" }, { history: "replace" });
  }, [rawTab, setQuery]);
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
  const unlinked = useMemo(
    () => unlinkedChoices(base, tools, relations),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [base.join(","), tools, relations],
  );
  const focused = focusTools(coverage, focus);
  const labelOf = (id: PhaseId) => phases.find((p) => p.id === id)?.label ?? id;

  /** Open Compare tools on one phase's choices and bring the table into view. */
  const compareIn = (phase: PhaseId) =>
    void setQuery({ tab: "compare", focus: phase }).then(() =>
      document.getElementById("compare-view")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Analyze choices</h1>
        <SegmentedSwitcher
          options={TABS}
          value={tab}
          onChange={(next) => void setQuery({ tab: next, focus: null })}
          label="Analysis"
          pillId="analyze-pill"
        />
      </div>

      <ChoicePanel
        tools={tools}
        phases={phases}
        ids={ids}
        added={added}
        coverage={coverage}
        unlinked={unlinked}
        onAdd={add}
        onAddVia={addVia}
        onRemove={remove}
        onClear={clear}
        onCompare={compareIn}
      />

      {tab === "compare" && (
        <div id="compare-view" className="scroll-mt-20">
          <CompareView
            ids={focused?.ids ?? ids}
            tools={tools}
            phases={phases}
            onRemove={remove}
            focus={focused ? { label: labelOf(focused.phase), onClear: () => void setQuery({ focus: null }) } : undefined}
          />
        </div>
      )}
    </div>
  );
}
