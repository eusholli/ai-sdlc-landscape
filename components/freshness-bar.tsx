import { BAND_ICON, BAND_SHADE, BAND_WORD } from "@/components/freshness-meta";
import { cn } from "@/lib/utils";
import type { FreshnessBand } from "@/lib/types";

export interface FreshnessCount {
  band: FreshnessBand;
  label: string;
  count: number;
}

/** The three freshness bands as one stacked bar, with a legend that carries the counts. */
export function FreshnessBar({ summary }: { summary: FreshnessCount[] }) {
  const total = summary.reduce((sum, s) => sum + s.count, 0);
  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div aria-hidden className="flex h-3 gap-0.5 overflow-hidden rounded-full ring-1 ring-border">
        {summary
          .filter((s) => s.count > 0)
          .map((s) => (
            <span key={s.band} className={cn("h-full", BAND_SHADE[s.band])} style={{ flexGrow: s.count, flexBasis: 0 }} />
          ))}
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {summary.map((s) => {
          const Icon = BAND_ICON[s.band];
          return (
            <li key={s.band} className="flex items-start gap-2.5">
              <span aria-hidden className={cn("mt-1 size-3 shrink-0 rounded-sm ring-1 ring-border", BAND_SHADE[s.band])} />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm">
                  <Icon aria-hidden className="size-3.5 shrink-0" />
                  <span className="font-medium">{BAND_WORD[s.band]}</span>
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">{s.count}</span>
                </p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
