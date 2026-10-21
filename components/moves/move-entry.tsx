import { Archive, ExternalLink, Handshake, PowerOff, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import type { MoveItem } from "@/components/moves/types";
import { formatDate, hostOf } from "@/lib/format";

const KIND: Record<MoveItem["kind"], { label: string; icon: LucideIcon }> = {
  acquired: { label: "Acquired", icon: Handshake },
  "shut down": { label: "Shut down", icon: PowerOff },
  "end of life": { label: "End of life", icon: Archive },
};

function outcome(item: MoveItem): string {
  if (item.kind === "acquired") return item.acquirer ? ` acquired by ${item.acquirer}` : " acquired";
  if (item.kind === "shut down") return " shut down";
  return " end of life";
}

export function MoveEntry({ item }: { item: MoveItem }) {
  const { label, icon: Icon } = KIND[item.kind];
  const sources = [...new Set(item.sources)];

  return (
    <article className="flex gap-4 rounded-lg border bg-background p-4">
      <Logo name={item.toolName} src={item.logo} phase={item.phase} size={40} />
      <div className="min-w-0 flex-1">
        <h3 className="text-sm leading-snug font-semibold text-foreground">
          <Link
            href={`/tools/${item.toolId}`}
            className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {item.toolName}
          </Link>
          {outcome(item)}
        </h3>

        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-medium text-foreground">
            <Icon className="size-3" aria-hidden />
            {label}
          </span>
          {item.date ? (
            <time dateTime={item.date} className="font-mono tabular-nums">
              {formatDate(item.date)}
            </time>
          ) : (
            <span>Date not published</span>
          )}
        </p>

        <p className="mt-2 text-sm text-muted-foreground">Status in the data: {item.status}</p>

        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="text-muted-foreground">{sources.length === 1 ? "Source:" : "Sources:"}</span>
          {sources.length === 0 && <span className="text-muted-foreground">No source link listed</span>}
          {sources.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-sm text-foreground underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {hostOf(url)}
              <ExternalLink className="size-3" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ))}
        </p>
      </div>
    </article>
  );
}
