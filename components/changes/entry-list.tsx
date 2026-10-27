import { ChangeEntry, LaunchCard, type ChangeItem, type LaunchItem, type TouchedTool } from "@/components/changes/change-entry";
import { RevealItem } from "@/components/changes/reveal-item";
import { MoveEntry, type MoveItem } from "@/components/moves/move-entry";
import { launch, toolById } from "@/lib/data";
import { formatDate, hostOf } from "@/lib/format";
import type { Change, TimelineEntry } from "@/lib/types";

export type Row =
  | { type: "change"; key: string; item: ChangeItem }
  | { type: "launch"; key: string; item: LaunchItem }
  | { type: "move"; key: string; item: MoveItem };

type MoveTimelineEntry = Extract<TimelineEntry, { kind: "move" }>;

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

/** A market move as the card the market moves view shows. Null when the tool has since been removed. */
export function moveItem(entry: MoveTimelineEntry): MoveItem | null {
  const tool = toolById(entry.move.tool);
  if (!tool) return null;
  return {
    id: tool.id,
    name: tool.name,
    logo: tool.logo,
    phase: tool.primaryPhase,
    headline: entry.text,
    date: formatDate(entry.date),
    dateIso: entry.date,
    status: entry.move.status,
    sources: entry.move.sources.map((url) => ({ url, host: hostOf(url) })),
  };
}

function toRow(entry: TimelineEntry, launchCommit: string | undefined): Row | null {
  if (entry.kind === "move") {
    const item = moveItem(entry);
    return item ? { type: "move", key: `move-${entry.move.tool}-${entry.date}`, item } : null;
  }

  const { date, commit, requestedBy, text } = entry;
  if (launchCommit && commit === launchCommit && entry.changes.some((c) => c.kind === "batch")) {
    return { type: "launch", key: `launch-${commit}`, item: { commit, date, text, requestedBy } };
  }
  return {
    type: "change",
    key: `change-${commit}`,
    item: {
      commit,
      date,
      text,
      requestedBy,
      tools: touchedTools(entry.changes),
      lines: entry.changes.map((c) => c.text),
    },
  };
}

/** Timeline entries as rows, dropping any that cannot be shown. */
export function toRows(entries: TimelineEntry[]): Row[] {
  const launchCommit = launch()?.commit;
  return entries.flatMap((entry) => toRow(entry, launchCommit) ?? []);
}

/** Rows as an ordered list that reveals each entry as it scrolls into view. */
export function EntryRows({ rows }: { rows: Row[] }) {
  return (
    <ol className="flex flex-col gap-5">
      {rows.map((row, index) => (
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
  );
}
