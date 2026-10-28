"use client";

import { Check, Plus, X } from "lucide-react";
import { useState } from "react";
import { AddToolPopover } from "@/components/compare/add-tool-popover";
import { Logo } from "@/components/logo";
import { ToolLink } from "@/components/tool/tool-actions";
import { Button } from "@/components/ui/button";
import { phaseColor } from "@/lib/format";
import { phaseState, unlinkedNote, type LinkTier, type PhaseChoice, type PhaseState, type Suggestion } from "@/lib/connections";
import type { Phase, PhaseId, ToolLite } from "@/lib/types";

/** How many suggestions a phase card lists before "Show more". Added ones are always listed. */
const CARD_SUGGESTIONS = 3;

const LINK = "font-medium underline-offset-2 hover:underline";
const TEXT_BUTTON =
  "self-start rounded-sm text-xs underline underline-offset-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 max-sm:min-h-11";

/** The tag after a suggestion reached by a weaker tier. A direct link has none. */
const TIER_TAG: Record<Exclude<LinkTier, "direct">, string> = { "two-step": "Two steps", shared: "Shared platform" };

/** What a phase card's corner says for each state. */
const STATE_LABEL: Record<Exclude<PhaseState, "via">, string> = {
  covered: "Covered",
  open: "Not covered",
  empty: "Nothing linked",
};

/**
 * The chosen tools, then one card per phase of the lifecycle, in order. A covered card lists the
 * choices that cover it. A phase the stack leaves empty lists the tools and platforms linked to the
 * choices that cover it; they are ticked in and out, and the phase stays open so several can be
 * compared. A phase nothing linked covers says so. The choices with no link at all are named below.
 */
export function ChoicePanel({
  tools,
  phases,
  ids,
  added: addedIds,
  coverage,
  unlinked,
  onAdd,
  onAddVia,
  onRemove,
  onClear,
  onCompare,
}: {
  /** Tools and platforms; the picker lists the tools only. */
  tools: ToolLite[];
  phases: Phase[];
  ids: string[];
  /** The chosen ids added from a linked suggestion. */
  added: string[];
  coverage: PhaseChoice[];
  /** Chosen ids with no recorded link to anything on the map. */
  unlinked: string[];
  onAdd: (id: string) => void;
  /** Add a linked suggestion, keeping its phase open. */
  onAddVia: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  /** Open Compare tools on the choices in one phase. */
  onCompare: (phase: PhaseId) => void;
}) {
  const byId = new Map(tools.map((t) => [t.id, t]));
  const nameOf = (id: string) => byId.get(id)?.name ?? id;
  const list = (ids: string[]) => ids.map(nameOf).join(", ");
  /** How a suggestion reaches your choices, in its own words for each tier. */
  const howLinked = (s: Suggestion) =>
    s.tier === "direct"
      ? `via ${list(s.linkedTo)}`
      : s.tier === "two-step"
        ? `via ${list(s.through)}, linked to ${list(s.linkedTo)}`
        : `also on ${list(s.through)}, like ${list(s.linkedTo)}`;
  const labelOf = (id: PhaseId) => phases.find((p) => p.id === id)?.label ?? id;
  const chosen = ids.flatMap((id) => byId.get(id) ?? []);
  const covered = coverage.filter((c) => c.tools.length > 0).length;
  const fromVia = new Set(addedIds);
  const note = unlinkedNote(unlinked.map(nameOf));
  const pickable = tools.filter((t) => t.kind === "tool");
  const [expanded, setExpanded] = useState<Set<PhaseId>>(new Set());
  const toggleExpanded = (phase: PhaseId) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(phase)) next.add(phase);
      return next;
    });

  return (
    <section aria-labelledby="choices-heading" className="flex flex-col gap-4">
      <h2 id="choices-heading" className="sr-only">
        Your choices
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        <AddToolPopover tools={pickable} selected={ids} onAdd={(id) => onAdd(id)} />
        {chosen.length > 0 && (
          <Button type="button" variant="ghost" size="sm" className="max-sm:h-11" onClick={onClear}>
            Clear all
          </Button>
        )}
        {chosen.length > 0 && (
          <p className="ml-auto text-sm text-muted-foreground tabular-nums" role="status">
            {`${chosen.length} chosen, covering ${covered} of ${coverage.length} phases`}
          </p>
        )}
      </div>

      {chosen.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-12 text-center">
          <p className="font-medium">No tools chosen yet</p>
          <p className="max-w-prose text-sm text-muted-foreground">
            Add the tools you run or are weighing. For each phase none of them covers, you see the tools linked to
            one you chose: directly, through one other tool, or by sharing a platform such as GitHub. Tick several to
            compare. You can also add a tool from the map, the search or a tool&apos;s detail view.
          </p>
        </div>
      ) : (
        <>
          <ul className="flex flex-wrap gap-2" aria-label="Chosen tools">
            {chosen.map((t) => (
              <li key={t.id} className="flex items-center gap-1.5 rounded-full border py-0.5 pr-0.5 pl-1 text-sm">
                <Logo name={t.name} src={t.logo} phase={t.primaryPhase} size={22} />
                <ToolLink id={t.id} className={LINK}>
                  {t.name}
                </ToolLink>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-full max-sm:size-11"
                  onClick={() => onRemove(t.id)}
                >
                  <X aria-hidden />
                  <span className="sr-only">Remove {t.name}</span>
                </Button>
              </li>
            ))}
          </ul>

          <p className="text-sm text-muted-foreground">
            Each card is a phase of the lifecycle. Where your choices leave a phase empty, tick as many linked
            tools as you like. A phase with two or more of your choices can be compared side by side.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Lifecycle phases">
            {coverage.map((c) => {
              const state = phaseState(c);
              const isOpen = expanded.has(c.phase);
              const shown = isOpen ? c.suggested : c.suggested.filter((s, i) => i < CARD_SUGGESTIONS || c.added.includes(s.tool));
              const hidden = c.suggested.length - shown.length;
              const compare = c.tools.length >= 2 && (
                <button
                  type="button"
                  onClick={() => onCompare(c.phase)}
                  className={TEXT_BUTTON}
                  aria-label={`Compare your ${c.tools.length} choices in ${labelOf(c.phase)}`}
                >
                  Compare tools
                </button>
              );
              return (
                <li
                  key={c.phase}
                  className={`flex flex-col gap-1.5 rounded-lg border border-l-4 px-3 py-2 text-sm ${
                    state === "covered" || state === "via" ? "bg-card" : "border-dashed"
                  }`}
                  style={{ borderLeftColor: phaseColor(c.phase) }}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className={`font-medium ${state === "empty" ? "text-muted-foreground" : ""}`}>{labelOf(c.phase)}</h3>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {state === "via" ? `${c.added.length} added via a link` : STATE_LABEL[state]}
                    </span>
                  </div>

                  {state === "covered" && (
                    <ul className="flex flex-col gap-1" aria-label={`Your choices in ${labelOf(c.phase)}`}>
                      {c.tools.map((id) => {
                        const t = byId.get(id);
                        return (
                          <li key={id} className="flex items-center gap-1.5">
                            {t && <Logo name={t.name} src={t.logo} phase={t.primaryPhase} size={18} />}
                            <ToolLink id={id} className={`${LINK} min-w-0 truncate`}>
                              {nameOf(id)}
                            </ToolLink>
                            {fromVia.has(id) && <span className="text-xs text-muted-foreground">added via a link</span>}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {state === "covered" && compare}

                  {state === "empty" && (
                    <p className="text-xs text-muted-foreground">Nothing recorded links to your choices here.</p>
                  )}

                  {(state === "open" || state === "via") && (
                    <>
                      <p className="text-xs text-muted-foreground">Linked to your choices, strongest first:</p>
                      <ul className="flex flex-col gap-1">
                        {shown.map((s) => {
                          const added = c.added.includes(s.tool);
                          return (
                            <li key={s.tool} className="flex items-center gap-1.5">
                              <span className="min-w-0 flex-1">
                                <ToolLink id={s.tool} className={LINK}>
                                  {nameOf(s.tool)}
                                </ToolLink>{" "}
                                {byId.get(s.tool)?.kind === "platform" && (
                                  <span className="rounded-sm border px-1 text-[0.6875rem] text-muted-foreground">Platform</span>
                                )}
                                {s.tier !== "direct" && (
                                  <span className="rounded-sm border border-dashed px-1 text-[0.6875rem] whitespace-nowrap text-muted-foreground">
                                    {TIER_TAG[s.tier]}
                                  </span>
                                )}{" "}
                                <span className="text-xs text-muted-foreground">{howLinked(s)}</span>
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-pressed={added}
                                className={`size-7 shrink-0 max-sm:size-11 ${added ? "text-success hover:text-success" : ""}`}
                                onClick={() => (added ? onRemove(s.tool) : onAddVia(s.tool))}
                              >
                                {added ? <Check strokeWidth={3} aria-hidden /> : <Plus aria-hidden />}
                                <span className="sr-only">
                                  {added ? `Remove ${nameOf(s.tool)} from your choices` : `Add ${nameOf(s.tool)} to your choices`}
                                </span>
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                      <div className="flex flex-wrap gap-x-3">
                        {(hidden > 0 || isOpen) && c.suggested.length > CARD_SUGGESTIONS && (
                          <button type="button" onClick={() => toggleExpanded(c.phase)} className={TEXT_BUTTON}>
                            {isOpen ? "Show fewer" : `Show ${hidden} more`}
                          </button>
                        )}
                        {compare}
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
          {note && <p className="text-sm text-muted-foreground">{note}</p>}
          <p className="text-xs text-muted-foreground">
            A suggestion covers a phase none of your choices covers. A direct one has a recorded integration,
            partnership or bundling with one of your choices. A two-step one is linked to another tool that is linked to
            one of them. A shared-platform one integrates with a platform one of them uses, which is not a link between
            the two. A platform, such as a code host or tracker, is not an AI tool; it is listed because tools integrate
            with it. Each link is a sourced record, not a judgement of fit.
          </p>
        </>
      )}
    </section>
  );
}
