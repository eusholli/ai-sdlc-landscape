import { PHASE_ORDER } from "@/lib/filters";
import { phaseColor } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Phase, PhaseId, Tool } from "@/lib/types";
import { SectionHeading, type HeadingTag } from "./section-heading";

export function PhaseCoverage({
  tool,
  phases,
  heading,
}: {
  tool: Pick<Tool, "phases" | "primaryPhase">;
  phases: Phase[];
  heading: HeadingTag;
}) {
  const labelOf = (id: PhaseId) => phases.find((p) => p.id === id)?.label ?? id;
  const covered = new Set(tool.phases);
  const others = tool.phases.filter((p) => p !== tool.primaryPhase);

  return (
    <section aria-labelledby="coverage-heading" className="flex flex-col gap-2">
      <SectionHeading as={heading} id="coverage-heading">
        Phase coverage
      </SectionHeading>
      <ol className="flex items-end gap-1">
        {PHASE_ORDER.map((id) => {
          const isCovered = covered.has(id);
          const isPrimary = tool.primaryPhase === id;
          return (
            <li key={id} className="flex-1" title={labelOf(id)}>
              <span
                aria-hidden
                className={cn(
                  "block rounded-sm",
                  isCovered ? "h-3" : "h-3 bg-muted",
                  isPrimary && "h-5 ring-2 ring-foreground",
                )}
                style={isCovered ? { background: phaseColor(id) } : undefined}
              />
              <span className="sr-only">
                {labelOf(id)}: {isPrimary ? "primary phase" : isCovered ? "covered" : "not covered"}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-muted-foreground">
        {tool.phases.length === 0
          ? "Not tied to one lifecycle phase."
          : tool.primaryPhase
            ? `Primary: ${labelOf(tool.primaryPhase)}.${others.length ? ` Also covers ${others.map(labelOf).join(", ")}.` : ""}`
            : `Covers ${tool.phases.map(labelOf).join(", ")}.`}
      </p>
    </section>
  );
}
