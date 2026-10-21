import { phaseColor } from "@/lib/format";
import type { PhaseId } from "@/lib/types";

export interface PhaseCount {
  id: PhaseId;
  label: string;
  count: number;
}

const toolsLabel = (n: number) => `${n} ${n === 1 ? "tool" : "tools"}`;

/** Rows must arrive sorted from most to least crowded. */
export function CrowdedPhases({ rows }: { rows: PhaseCount[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  const most = rows[0];
  const least = rows[rows.length - 1];

  return (
    <div>
      {most && least && rows.length > 1 && (
        <p className="text-sm text-muted-foreground">
          Most crowded: {most.label}, {toolsLabel(most.count)}. Least crowded: {least.label}, {toolsLabel(least.count)}.
        </p>
      )}
      <ol className="mt-4 space-y-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className="grid grid-cols-[7.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 sm:grid-cols-[10rem_minmax(0,1fr)_3rem]"
          >
            <span className="truncate text-sm text-foreground">{row.label}</span>
            <span aria-hidden className="h-3 overflow-hidden rounded-sm bg-muted">
              <span
                className="block h-full rounded-sm"
                style={{ width: `${(row.count / max) * 100}%`, background: phaseColor(row.id) }}
              />
            </span>
            <span className="text-right font-mono text-sm text-foreground tabular-nums">{row.count}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
