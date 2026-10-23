import { SITE_CONTAINER } from "@/components/site-name";
import { allTools, dataDate, marketMoves, phases, relations, timeline } from "@/lib/data";
import { formatDate } from "@/lib/format";

export function StatsStrip() {
  const stats = [
    { label: "tools", value: allTools().filter((t) => t.kind === "tool").length },
    { label: "phases", value: phases().length },
    { label: "relations", value: relations().length },
    { label: "acquisitions", value: marketMoves().filter((m) => m.kind === "acquired").length },
  ];
  const date = dataDate();
  const newest = timeline(1)[0];

  return (
    <div className="border-b bg-muted/40">
      <ul
        aria-label="Dataset summary"
        className={`${SITE_CONTAINER} flex flex-wrap items-baseline gap-x-5 gap-y-0.5 py-1.5 text-xs text-muted-foreground`}
      >
        {stats.map(({ label, value }) => (
          <li key={label} className="flex items-baseline gap-1.5">
            <span className="font-mono font-semibold tabular-nums text-foreground">{value}</span>
            <span>{label}</span>
          </li>
        ))}
        {newest && (
          <li className="flex items-baseline gap-1.5">
            <span>Updated</span>
            <time dateTime={newest.date} className="font-mono tabular-nums text-foreground">
              {formatDate(newest.date)}
            </time>
          </li>
        )}
        <li className="flex items-baseline gap-1.5 sm:ml-auto">
          <span>Data as of</span>
          <time dateTime={date} className="font-mono tabular-nums text-foreground">
            {formatDate(date)}
          </time>
        </li>
      </ul>
    </div>
  );
}
