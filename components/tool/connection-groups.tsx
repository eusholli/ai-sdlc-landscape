import { ExternalLink } from "lucide-react";
import type { ConnGroup, Connection } from "@/lib/connections";
import { hostOf, layerColor, phaseColor } from "@/lib/format";
import { requestUrl } from "@/lib/site";
import type { Relation } from "@/lib/types";
import { SectionHeading, type HeadingTag } from "./section-heading";
import { ToolLink } from "./tool-actions";
import type { ToolDetailData, ToolDetailRefs } from "./types";

const LINK = "rounded-sm underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
const CHIP =
  "inline-block rounded-md border px-2 py-0.5 text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50";
/** Two-step paths shown before the rest fold away, per group. */
const SHOWN = 6;

function Sources({ urls }: { urls: string[] }) {
  return (
    <>
      {urls.map((url, i) => (
        <span key={url}>
          {i > 0 && ", "}
          <a href={url} target="_blank" rel="noopener noreferrer" className={LINK}>
            {hostOf(url)}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </span>
      ))}
    </>
  );
}

/** "Cursor integrates with GitHub Actions (cursor.com)": one recorded relation, as its record states it. */
function StepText({ step, names, labels }: { step: Relation; names: Record<string, string>; labels: ToolDetailRefs["relationLabels"] }) {
  return (
    <>
      {names[step.from] ?? step.from} {labels[step.type].out.toLowerCase()} {names[step.to] ?? step.to}
      {step.sources.length > 0 && (
        <span className="text-muted-foreground">
          {" ("}
          <Sources urls={step.sources} />
          {")"}
        </span>
      )}
    </>
  );
}

function Item({ c, names, labels }: { c: Connection<Relation>; names: Record<string, string>; labels: ToolDetailRefs["relationLabels"] }) {
  const [first, ...more] = c.paths;
  return (
    <li className="flex flex-col gap-0.5">
      <span className="flex flex-wrap items-baseline gap-x-2">
        <ToolLink id={c.tool} className={CHIP}>{names[c.tool] ?? c.tool}</ToolLink>
        {first.via && (
          <span className="text-xs text-muted-foreground">
            via {names[first.via] ?? first.via}
            {more.length > 0 && `, and ${more.length} other ${more.length === 1 ? "path" : "paths"}`}
          </span>
        )}
      </span>
      <ul className="pl-2 text-xs leading-5">
        {first.steps.map((s) => (
          <li key={`${s.from}|${s.type}|${s.to}`}>
            <StepText step={s} names={names} labels={labels} />
          </li>
        ))}
      </ul>
    </li>
  );
}

/**
 * Tools on the map with a recorded link to this one, grouped by phase. Direct links first, then
 * two-step paths through another tool on the map, each step with its own source.
 */
export function ConnectionGroups({
  name,
  connections,
  refs,
  heading,
}: {
  name: string;
  connections: NonNullable<ToolDetailData["connections"]>;
  refs: ToolDetailRefs;
  heading: HeadingTag;
}) {
  const { groups, names } = connections;
  const labelOf = (g: ConnGroup) =>
    g === "agent-infra" ? (refs.layers.find((l) => l.id === g)?.label ?? "Agent infrastructure") : (refs.phases.find((p) => p.id === g)?.label ?? g);
  const colourOf = (g: ConnGroup) => (g === "agent-infra" ? layerColor(g) : phaseColor(g));

  return (
    <section aria-labelledby="connections-heading" className="flex flex-col gap-3">
      <SectionHeading as={heading} id="connections-heading">
        Connections across the lifecycle
      </SectionHeading>
      <p className="text-xs text-muted-foreground">
        Tools on the map with a recorded link to {name}, by phase. A two-step path goes through another tool on the
        map and is derived from two records. Two tools that both connect to a service such as GitHub are not counted
        as linked. Nothing here rates how well tools fit.
      </p>
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No link to another tool on the map is recorded.{" "}
          <a href={requestUrl(name)} target="_blank" rel="noopener noreferrer" className={LINK}>
            Vendors can add their integrations
            <ExternalLink className="ml-0.5 inline size-3" aria-hidden />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {groups.map((g) => (
            <li key={g.group} className="flex flex-col gap-2">
              <p className="flex items-center gap-2 text-xs font-medium">
                <span aria-hidden className="size-2 rounded-full" style={{ background: colourOf(g.group) }} />
                {labelOf(g.group)}
              </p>
              {g.direct.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-muted-foreground">Direct</p>
                  <ul className="flex flex-col gap-2">
                    {g.direct.map((c) => <Item key={c.tool} c={c} names={names} labels={refs.relationLabels} />)}
                  </ul>
                </div>
              )}
              {g.twoStep.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-muted-foreground">Two steps, derived</p>
                  <ul className="flex flex-col gap-2">
                    {g.twoStep.slice(0, SHOWN).map((c) => <Item key={c.tool} c={c} names={names} labels={refs.relationLabels} />)}
                  </ul>
                  {g.twoStep.length > SHOWN && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-xs text-muted-foreground">
                        {g.twoStep.length - SHOWN} more two-step {g.twoStep.length - SHOWN === 1 ? "path" : "paths"}
                      </summary>
                      <ul className="mt-2 flex flex-col gap-2">
                        {g.twoStep.slice(SHOWN).map((c) => <Item key={c.tool} c={c} names={names} labels={refs.relationLabels} />)}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
