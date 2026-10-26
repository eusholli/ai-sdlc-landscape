"use client";

import { Check, Plus, X } from "lucide-react";
import { useState } from "react";
import { AddToolPopover } from "@/components/compare/add-tool-popover";
import { Logo } from "@/components/logo";
import { ToolLink } from "@/components/tool/tool-actions";
import { Button } from "@/components/ui/button";
import { phaseColor } from "@/lib/format";
import { unlinkedNote, type PhaseChoice } from "@/lib/connections";
import type { Phase, PhaseId, ToolLite } from "@/lib/types";

/** How many suggestions a phase card lists before "Show more". Added ones are always listed. */
const CARD_SUGGESTIONS = 3;

const LINK = "font-medium underline-offset-2 hover:underline";
const TEXT_BUTTON =
  "self-start rounded-sm text-xs underline underline-offset-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 max-sm:min-h-11";

/**
 * The chosen tools, then one card per phase the stack leaves empty that a linked tool or platform
 * covers. Suggestions are ticked in and out; the phase stays open so several can be compared. The
 * phases already covered, the gaps nothing linked covers and the choices with no link at all are
 * named below.
 */
export function ChoicePanel({
  tools,
  phases,
  ids,
  coverage,
  unlinked,
  onAdd,
  onAddVia,
  onRemove,
  onClear,
  onMore,
}: {
  /** Tools and platforms; the picker lists the tools only. */
  tools: ToolLite[];
  phases: Phase[];
  ids: string[];
  coverage: PhaseChoice[];
  /** Chosen ids with no recorded link to anything on the map. */
  unlinked: string[];
  onAdd: (id: string) => void;
  /** Add a linked suggestion, keeping its phase open. */
  onAddVia: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  /** Open Analyze stacks, where every suggestion is compared. */
  onMore: () => void;
}) {
  const byId = new Map(tools.map((t) => [t.id, t]));
  const nameOf = (id: string) => byId.get(id)?.name ?? id;
  const labelOf = (id: PhaseId) => phases.find((p) => p.id === id)?.label ?? id;
  const chosen = ids.flatMap((id) => byId.get(id) ?? []);
  const covered = coverage.filter((c) => c.tools.length > 0).length;
  const open = coverage.filter((c) => c.gap && c.suggested.length > 0);
  const closed = coverage.filter((c) => !c.gap).map((c) => c.phase);
  const unfilled = coverage.filter((c) => c.gap && c.suggested.length === 0).map((c) => c.phase);
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
            Add the tools you run or are weighing. For each phase none of them covers, you see the tools and
            platforms with a recorded integration or partnership with one you chose, and can tick several to compare. You can also add a tool
            from the map, the search or a tool&apos;s detail view.
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

          {open.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Each card is a phase your stack leaves empty. Tick as many linked tools in a phase as you like, then
                compare them side by side in{" "}
                <button type="button" onClick={onMore} className={`${LINK} rounded-sm text-foreground underline outline-none focus-visible:ring-3 focus-visible:ring-ring/50`}>
                  Analyze stacks
                </button>
                .
              </p>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Phases you can fill">
                {open.map((c) => {
                  const isOpen = expanded.has(c.phase);
                  const shown = isOpen ? c.suggested : c.suggested.filter((s, i) => i < CARD_SUGGESTIONS || c.added.includes(s.tool));
                  const hidden = c.suggested.length - shown.length;
                  return (
                    <li
                      key={c.phase}
                      className={`flex flex-col gap-1.5 rounded-lg border border-l-4 bg-card px-3 py-2 text-sm ${c.added.length ? "" : "border-dashed"}`}
                      style={{ borderLeftColor: phaseColor(c.phase) }}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-medium">{labelOf(c.phase)}</h3>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {c.added.length ? `${c.added.length} added` : "Not covered"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Linked to your choices:</p>
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
                                )}{" "}
                                <span className="text-xs text-muted-foreground">via {s.linkedTo.map(nameOf).join(", ")}</span>
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
                        {c.added.length > 0 && (
                          <button type="button" onClick={onMore} className={TEXT_BUTTON}>
                            {`Compare ${c.added.length} added in Analyze stacks`}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No phase your stack leaves empty has a tool or platform with a recorded link to your choices.
            </p>
          )}
          {(closed.length > 0 || unfilled.length > 0 || note) && (
            <p className="text-sm text-muted-foreground">
              {[
                closed.length > 0 && `Covered by your choices: ${closed.map(labelOf).join(", ")}.`,
                unfilled.length > 0 && `Nothing linked to your choices covers ${unfilled.map(labelOf).join(", ")}.`,
                note,
              ].filter(Boolean).join(" ")}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            A suggestion covers a phase none of your choices covers and has a recorded integration, partnership or
            bundling with one of them. A platform, such as a code host or tracker, is not an AI tool; it is listed
            because tools integrate with it. A link is a sourced record, not a judgement of fit.
          </p>
        </>
      )}
    </section>
  );
}
