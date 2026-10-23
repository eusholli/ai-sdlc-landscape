import { ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/format";
import { REPO_URL } from "@/lib/site";
import type { Change } from "@/lib/types";

/** A tool's own changes, newest first, each dated line linking to its commit. */
export function ToolChanges({ changes }: { changes: Change[] }) {
  if (changes.length === 0) return null;

  return (
    <details className="group">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-sm outline-none select-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        <ChevronRight aria-hidden className="size-3.5 transition-transform group-open:rotate-90" />
        Changes <span className="tabular-nums">({changes.length})</span>
      </summary>
      <ul className="mt-2 flex flex-col gap-1.5 border-l pl-3">
        {changes.map((change, i) => (
          <li key={`${change.commit}-${i}`} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <a
              href={`${REPO_URL}/commit/${change.commit}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-sm tabular-nums underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-24"
            >
              {formatDate(change.date)}
              <span className="sr-only"> commit {change.commit.slice(0, 7)} (opens in a new tab)</span>
            </a>
            <span className="min-w-0 text-pretty">{change.text}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
