import { Rss } from "lucide-react";
import type { Metadata } from "next";
import { ChangeEntry, LaunchCard, type ChangeItem, type LaunchItem, type TouchedTool } from "@/components/changes/change-entry";
import { RevealItem } from "@/components/changes/reveal-item";
import { MoveEntry, type MoveItem } from "@/components/moves/move-entry";
import { SITE_CONTAINER } from "@/components/site-name";
import { Button } from "@/components/ui/button";
import { launch, timeline, toolById } from "@/lib/data";
import { formatDate, hostOf } from "@/lib/format";
import type { Change, TimelineEntry } from "@/lib/types";

export const metadata: Metadata = {
  title: "What changed",
  description:
    "Every change to the AI SDLC Landscape data, from the public git history, and the market moves the data records.",
  alternates: { canonical: "/changes" },
};

type Row =
  | { type: "change"; key: string; item: ChangeItem }
  | { type: "launch"; key: string; item: LaunchItem }
  | { type: "move"; key: string; item: MoveItem };

interface Month {
  key: string;
  label: string;
  rows: Row[];
}

function touchedTools(changes: Change[]): TouchedTool[] {
  const seen = new Map<string, TouchedTool>();
  for (const change of changes) {
    const ids = change.tool ? [change.tool] : change.tools;
    for (const id of ids) {
      if (seen.has(id)) continue;
      const tool = toolById(id);
      seen.set(
        id,
        tool
          ? { id, name: tool.name, logo: tool.logo, phase: tool.primaryPhase, linkable: true }
          : { id, name: change.name ?? id, logo: null, phase: null, linkable: false },
      );
    }
  }
  return [...seen.values()];
}

function toRow(entry: TimelineEntry, launchCommit: string | undefined): Row | null {
  if (entry.kind === "move") {
    const tool = toolById(entry.move.tool);
    if (!tool) return null;
    return {
      type: "move",
      key: `move-${entry.move.tool}-${entry.date}`,
      item: {
        id: tool.id,
        name: tool.name,
        logo: tool.logo,
        phase: tool.primaryPhase,
        headline: entry.text,
        date: formatDate(entry.date),
        dateIso: entry.date,
        status: entry.move.status,
        sources: entry.move.sources.map((url) => ({ url, host: hostOf(url) })),
      },
    };
  }

  const { date, commit, author, requestedBy, text } = entry;
  if (launchCommit && commit === launchCommit && entry.changes.some((c) => c.kind === "batch")) {
    return { type: "launch", key: `launch-${commit}`, item: { commit, date, text, author, requestedBy } };
  }
  return {
    type: "change",
    key: `change-${commit}`,
    item: {
      commit,
      date,
      text,
      author,
      requestedBy,
      tools: touchedTools(entry.changes),
      lines: entry.changes.map((c) => c.text),
    },
  };
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function groupByMonth(entries: TimelineEntry[], launchCommit: string | undefined): Month[] {
  const months: Month[] = [];
  for (const entry of entries) {
    const row = toRow(entry, launchCommit);
    if (!row) continue;
    const key = entry.date.slice(0, 7);
    let month = months.find((m) => m.key === key);
    if (!month) {
      month = { key, label: monthLabel(key), rows: [] };
      months.push(month);
    }
    month.rows.push(row);
  }
  return months;
}

export default function ChangesPage() {
  const months = groupByMonth(timeline(), launch()?.commit);

  return (
    <main id="main" className={`${SITE_CONTAINER} py-10`}>
      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="flex min-w-0 flex-1 basis-72 flex-col gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-balance">What changed</h1>
            <p className="text-pretty text-muted-foreground">
              Every change to the data, from the public git history, and the market moves the data records. Newest
              first.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <a href="/changes.xml">
              <Rss aria-hidden />
              Feed
              <span className="sr-only">(RSS)</span>
            </a>
          </Button>
        </header>

        {months.map((month) => (
          <section key={month.key} aria-labelledby={`month-${month.key}`} className="flex flex-col gap-4">
            <h2 id={`month-${month.key}`} className="border-b pb-2 text-lg font-semibold tracking-tight">
              {month.label}
            </h2>
            <ol className="flex flex-col gap-5">
              {month.rows.map((row, index) => (
                <RevealItem key={row.key} index={index}>
                  {row.type === "change" ? (
                    <ChangeEntry item={row.item} />
                  ) : row.type === "launch" ? (
                    <LaunchCard item={row.item} />
                  ) : (
                    <MoveEntry item={row.item} label="Market move" />
                  )}
                </RevealItem>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </main>
  );
}
