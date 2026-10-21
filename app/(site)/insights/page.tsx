import type { Metadata } from "next";
import { CoverageHeatmap } from "@/components/insights/coverage-heatmap";
import { CrowdedPhases } from "@/components/insights/crowded-phases";
import { FieldCompleteness } from "@/components/insights/field-completeness";
import type { HeatmapData } from "@/components/insights/types";
import { SITE_CONTAINER } from "@/components/site-name";
import { coverageMatrix, fieldCompleteness, layers, phases, segments, toolsByPhase } from "@/lib/data";

export const metadata: Metadata = {
  title: "Insights",
  description: "Where the AI SDLC tools sit, which phases are crowded, and how much vendors publish about themselves.",
};

const ROW_ORDER = ["full-lifecycle", "multi-phase", "point", "layer"] as const;

function heatmapData(): HeatmapData {
  const phaseList = phases();
  const cells = coverageMatrix();
  const segmentLabel = new Map(segments().map((s) => [s.id as string, s.label]));
  segmentLabel.set("layer", layers().find((l) => l.id === "agent-infra")?.label ?? "Agent infrastructure layer");

  const rows = ROW_ORDER.map((id) => ({
    id,
    label: segmentLabel.get(id) ?? id,
    counts: Object.fromEntries(cells.filter((c) => c.segment === id).map((c) => [c.phase, c.count])),
  }));
  const max = Math.max(1, ...cells.map((c) => c.count));

  return { phases: phaseList.map((p) => ({ id: p.id, label: p.label })), rows, max };
}

function crowdedRows() {
  const byPhase = toolsByPhase();
  return phases()
    .map((p) => ({ id: p.id, label: p.label, count: byPhase[p.id].length, order: p.order }))
    .sort((a, b) => b.count - a.count || a.order - b.order)
    .map(({ id, label, count }) => ({ id, label, count }));
}

export default function InsightsPage() {
  const completeness = fieldCompleteness();
  const total = completeness[0]?.total ?? 0;

  return (
    <main id="main" className={`${SITE_CONTAINER} py-8`}>
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Where the tools sit, which phases are crowded, and how much vendors say about themselves.
        </p>

        <section aria-labelledby="coverage-heading" className="mt-10">
          <h2 id="coverage-heading" className="text-lg font-semibold tracking-tight">
            Coverage by phase and segment
          </h2>
          <p className="mt-1 mb-5 max-w-2xl text-sm text-muted-foreground">
            Each cell counts the tools that cover a phase. A tool that covers several phases counts once in each.
          </p>
          <CoverageHeatmap data={heatmapData()} />
        </section>

        <section aria-labelledby="crowded-heading" className="mt-14">
          <h2 id="crowded-heading" className="text-lg font-semibold tracking-tight">
            Most and least crowded phases
          </h2>
          <p className="mt-1 mb-4 max-w-2xl text-sm text-muted-foreground">
            Tools per primary phase. Agent infrastructure and model providers sit outside the phases and are not counted.
          </p>
          <CrowdedPhases rows={crowdedRows()} />
        </section>

        <section aria-labelledby="published-heading" className="mt-14">
          <h2 id="published-heading" className="text-lg font-semibold tracking-tight">
            What vendors publish
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Go-to-market partners are published for few tools. Treat thin fields as a floor, not a census.
          </p>
          <p className="mt-1 mb-4 max-w-2xl text-sm text-muted-foreground">
            Known of {total} tools, by field.
          </p>
          <FieldCompleteness rows={completeness.map(({ label, known, total }) => ({ label, known, total }))} />
        </section>
      </div>
    </main>
  );
}
