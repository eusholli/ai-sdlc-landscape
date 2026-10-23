// Server only: turns the newest timeline entries into plain props for the home page strip.
import "server-only";
import type { WhatsNewItem } from "@/components/whats-new-strip";
import { timeline, toolById } from "@/lib/data";
import { formatDate } from "@/lib/format";
import type { TimelineEntry } from "@/lib/types";

const COUNT = 3;

function soleToolId(entry: TimelineEntry): string | null {
  if (entry.kind === "move") return entry.move.tool;
  const ids = new Set<string>();
  for (const change of entry.changes) {
    for (const id of change.tool ? [change.tool] : change.tools) ids.add(id);
  }
  return ids.size === 1 ? [...ids][0] : null;
}

export function whatsNewItems(): WhatsNewItem[] {
  return timeline(COUNT).map((entry) => {
    const id = soleToolId(entry);
    const tool = id ? toolById(id) : undefined;
    return {
      key: entry.kind === "move" ? `move-${entry.move.tool}-${entry.date}` : `change-${entry.commit}`,
      date: entry.date,
      dateLabel: formatDate(entry.date),
      text: entry.text,
      tool: tool ? { name: tool.name, logo: tool.logo, phase: tool.primaryPhase } : null,
    };
  });
}
