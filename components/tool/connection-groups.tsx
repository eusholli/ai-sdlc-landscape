import { ArrowUpRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { analyzeHref } from "@/lib/compare";
import { byPlatform, linkStrength, type ConnGroup, type Connection, type LinkTier } from "@/lib/connections";
import { PHASE_ORDER } from "@/lib/filters";
import { hostOf, layerColor, phaseColor } from "@/lib/format";
import { requestUrl } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { PhaseId, Relation } from "@/lib/types";
import { SectionHeading, type HeadingTag } from "./section-heading";
import { ToolLink } from "./tool-actions";
import type { ToolDetailData, ToolDetailRefs } from "./types";

const LINK = "rounded-sm underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
const CHIP =
  "inline-block rounded-md border px-2 py-0.5 text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50";
/** Two-step paths, or tools sharing one platform, shown before the rest fold away, per group. */
const SHOWN = 6;

const TIER_LABEL: Record<LinkTier, string> = {
  direct: "Direct link",
  "two-step": "Two steps",
  shared: "Shares a platform",
};

/** One segment's look for a tier: solid, faded or outlined in the phase colour, muted when nothing. */
function Segment({ phase, tier, className }: { phase: PhaseId; tier: LinkTier | null; className?: string }) {
  const colour = phaseColor(phase);
  return (
    <span
      aria-hidden
      className={cn("block h-3 rounded-sm", tier === null && "bg-muted", tier === "shared" && "border-2", className)}
      style={
        tier === "direct"
          ? { background: colour }
          : tier === "two-step"
            ? { background: `color-mix(in oklab, ${colour} 45%, transparent)` }
            : tier === "shared"
              ? { borderColor: colour }
              : undefined
      }
    />
  );
}

/** The lifecycle phases in order, each marked by the strongest tier that reaches it, with a legend. */
function ConnectionStrip({ strength, labelOf }: { strength: Partial<Record<ConnGroup, LinkTier | null>>; labelOf: (g: ConnGroup) => string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <ol className="flex gap-1" aria-label="Links by phase">
        {PHASE_ORDER.map((id) => {
          const tier = strength[id] ?? null;
          return (
            <li key={id} className="flex-1" title={`${labelOf(id)}: ${tier ? TIER_LABEL[tier] : "nothing recorded"}`}>
              <Segment phase={id} tier={tier} />
              <span className="sr-only">
                {labelOf(id)}: {tier ? TIER_LABEL[tier].toLowerCase() : "nothing recorded"}
              </span>
            </li>
          );
        })}
      </ol>
      <ul aria-hidden className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {([...Object.keys(TIER_LABEL), null] as (LinkTier | null)[]).map((t) => (
          <li key={t ?? "none"} className="flex items-center gap-1.5">
            <Segment phase="code" tier={t} className="h-2.5 w-4" />
            {t ? TIER_LABEL[t] : "Nothing recorded"}
          </li>
        ))}
      </ul>
    </div>
  );
}

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
 * Tools sharing one platform with this tool: the platform, then the tools as chips. Each relation
 * and its source is on the platform's page and on each tool's own page.
 */
function SharedPlatform({ platform, tools, names }: { platform: string; tools: Connection<Relation>[]; names: Record<string, string> }) {
  const chips = (cs: Connection<Relation>[]) =>
    cs.map((c) => (
      <li key={c.tool}>
        <ToolLink id={c.tool} className={CHIP}>{names[c.tool] ?? c.tool}</ToolLink>
      </li>
    ));
  return (
    <li className="flex flex-col gap-1">
      <p className="text-xs">
        Also works with{" "}
        <ToolLink id={platform} className={LINK}>
          {names[platform] ?? platform}
        </ToolLink>
      </p>
      <ul className="flex flex-wrap gap-1.5">{chips(tools.slice(0, SHOWN))}</ul>
      {tools.length > SHOWN && (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs text-muted-foreground">{tools.length - SHOWN} more</summary>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">{chips(tools.slice(SHOWN))}</ul>
        </details>
      )}
    </li>
  );
}

/**
 * Every phase of the lifecycle, then agent infrastructure and platforms, with the tools linked to
 * this one: direct links, two-step paths through another tool on the map, each step with its own
 * source, and, apart, tools that share a platform with it. A strip on top shows the strongest tier
 * per phase, and a link opens this tool in Analyze choices.
 */
export function ConnectionGroups({
  id,
  name,
  connections,
  refs,
  heading,
}: {
  id: string;
  name: string;
  connections: NonNullable<ToolDetailData["connections"]>;
  refs: ToolDetailRefs;
  heading: HeadingTag;
}) {
  const { names } = connections;
  // A response cached before shared platforms were listed has no `shared`.
  const groups = connections.groups.map((g) => ({ ...g, shared: g.shared ?? [] }));
  const strength = linkStrength(groups);
  const hasAny = Object.values(strength).some(Boolean);
  const labelOf = (g: ConnGroup) =>
    g === "agent-infra" || g === "systems" ? (refs.layers.find((l) => l.id === g)?.label ?? g) : (refs.phases.find((p) => p.id === g)?.label ?? g);
  const colourOf = (g: ConnGroup) => (g === "agent-infra" || g === "systems" ? layerColor(g) : phaseColor(g));

  return (
    <section aria-labelledby="connections-heading" className="flex flex-col gap-3">
      <SectionHeading as={heading} id="connections-heading">
        Connections across the lifecycle
      </SectionHeading>
      <p className="text-xs text-muted-foreground">
        Tools on the map with a recorded link to {name}, phase by phase. A two-step path goes through another tool on
        the map and is derived from two records. Tools that only share a platform with {name}, such as GitHub, are
        listed apart: that is not a link between them. Nothing here rates how well tools fit.
      </p>
      <ConnectionStrip strength={strength} labelOf={labelOf} />
      <p className="text-sm">
        <Link href={analyzeHref([id])} prefetch={false} className={LINK}>
          See {name} across the lifecycle in Analyze choices
          <ArrowUpRight className="ml-0.5 inline size-3.5" aria-hidden />
        </Link>
      </p>
      <ul className="flex flex-col gap-4">
        {groups.map((g) => {
          const empty = !g.direct.length && !g.twoStep.length && !g.shared.length;
          return (
            <li key={g.group} className="flex flex-col gap-2">
              <p className="flex items-center gap-2 text-xs font-medium">
                <span aria-hidden className="size-2 rounded-full" style={{ background: colourOf(g.group) }} />
                {labelOf(g.group)}
                {empty && <span className="font-normal text-muted-foreground">Nothing recorded</span>}
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
              {g.shared.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-muted-foreground">Shares a platform, not a link</p>
                  <ul className="flex flex-col gap-2">
                    {byPlatform(g.shared).map((p) => (
                      <SharedPlatform key={p.platform} platform={p.platform} tools={p.tools} names={names} />
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground">
        {hasAny ? "Missing an integration? " : "No link to another tool on the map is recorded. "}
        <a href={requestUrl(name)} target="_blank" rel="noopener noreferrer" className={LINK}>
          Vendors can add their integrations
          <ExternalLink className="ml-0.5 inline size-3" aria-hidden />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        .
      </p>
    </section>
  );
}
