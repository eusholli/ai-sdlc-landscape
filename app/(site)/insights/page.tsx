import type { Metadata } from "next";
import { CoverageHeatmap } from "@/components/insights/coverage-heatmap";
import { SITE_CONTAINER } from "@/components/site-name";
import { coverageMatrix, fieldCompleteness, layers, phases, segments, toolsByPhase } from "@/lib/data";
import { phaseColor } from "@/lib/format";

export const metadata: Metadata = {
  title: "Insights",
  description: "Where AI tools cluster across the software lifecycle, and how much vendors publish about themselves.",
  alternates: { canonical: "/insights" },
};

function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-xl font-semibold tracking-tight">
          {title}
        </h2>
        <p className="max-w-2xl text-sm text-pretty text-muted-foreground">{intro}</p>
      </div>
      {children}
    </section>
  );
}

function BarRow({ label, value, max, colour, trailing }: { label: string; value: number; max: number; colour: string; trailing: string }) {
  return (
    <li className="grid grid-cols-[minmax(7rem,12rem)_minmax(0,1fr)_auto] items-center gap-3 text-sm sm:grid-cols-[14rem_minmax(0,1fr)_auto]">
      <span className="truncate">{label}</span>
      <span aria-hidden className="h-2.5 overflow-hidden rounded-full bg-muted">
        <span className="block h-full rounded-full" style={{ width: `${(value / max) * 100}%`, background: colour }} />
      </span>
      <span className="text-right font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums">
        {trailing}
      </span>
    </li>
  );
}

export default function InsightsPage() {
  const phaseList = phases();
  const columns = phaseList.map((p) => ({ id: p.id, label: p.label }));
  const infraLabel = layers().find((l) => l.id === "agent-infra")?.label ?? "Agent infrastructure";
  const rows = [...segments().map((s) => ({ id: s.id as string, label: s.label })), { id: "layer", label: infraLabel }];
  const counts = Object.fromEntries(coverageMatrix().map((c) => [`${c.segment}|${c.phase}`, c.count]));

  const grouped = toolsByPhase();
  const crowded = phaseList
    .map((phase) => ({ phase, count: grouped[phase.id].length }))
    .sort((a, b) => b.count - a.count || a.phase.order - b.phase.order);
  const crowdedMax = Math.max(1, crowded[0]?.count ?? 1);
  const most = crowded[0];
  const least = crowded[crowded.length - 1];

  const completeness = fieldCompleteness();

  return (
    <main id="main" className={`${SITE_CONTAINER} py-10`}>
      <div className="mx-auto flex max-w-4xl flex-col gap-14">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">Insights</h1>
          <p className="max-w-2xl text-pretty text-muted-foreground">
            Where tools cluster across the lifecycle, and how much vendors say about themselves. Counts cover the tools
            in the census, not the model providers.
          </p>
        </header>

        <Section
          id="coverage-heading"
          title="Coverage by phase and segment"
          intro="Each cell counts tools that cover a phase at all, not only those whose main phase it is, so a full-lifecycle platform appears in every phase it spans."
        >
          <CoverageHeatmap columns={columns} rows={rows} counts={counts} />
        </Section>

        <Section
          id="crowded-heading"
          title="Most and least crowded phases"
          intro={
            most && least
              ? `${most.phase.label} has the most tools (${most.count}). ${least.phase.label} has the fewest (${least.count}). Each tool counts once, under its primary phase.`
              : "Each tool counts once, under its primary phase."
          }
        >
          <ol className="flex flex-col gap-2.5">
            {crowded.map(({ phase, count }) => (
              <BarRow
                key={phase.id}
                label={phase.label}
                value={count}
                max={crowdedMax}
                colour={phaseColor(phase.id)}
                trailing={`${count} ${count === 1 ? "tool" : "tools"}`}
              />
            ))}
          </ol>
        </Section>

        <Section
          id="published-heading"
          title="What vendors publish"
          intro="Go-to-market partners are published for few tools. Treat thin fields as a floor, not a census."
        >
          <ul className="flex flex-col gap-2.5">
            {completeness.map(({ field, label, known, total }) => (
              <BarRow
                key={field}
                label={label}
                value={known}
                max={total}
                colour="color-mix(in oklab, var(--foreground) 70%, var(--background))"
                trailing={`${known} of ${total}`}
              />
            ))}
          </ul>
        </Section>
      </div>
    </main>
  );
}
