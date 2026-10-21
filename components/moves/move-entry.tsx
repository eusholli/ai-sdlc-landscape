import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import type { PhaseId } from "@/lib/types";

export interface MoveItem {
  id: string;
  name: string;
  logo: string | null;
  phase: PhaseId | null;
  headline: string;
  /** Formatted date, or null when the status text has none. */
  date: string | null;
  dateIso: string | null;
  status: string;
  sources: { url: string; host: string }[];
}

export function MoveEntry({ item }: { item: MoveItem }) {
  return (
    <article className="rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        <Logo name={item.name} src={item.logo} phase={item.phase} size={36} />
        <div className="min-w-0 flex-1">
          <h3 className="text-base leading-snug font-semibold text-balance">
            <Link
              href={`/tools/${item.id}`}
              className="rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {item.headline}
            </Link>
          </h3>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {item.date && item.dateIso ? <time dateTime={item.dateIso}>{item.date}</time> : "Undated"}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm text-pretty">{item.status}</p>
      {item.sources.length > 0 && (
        <ul aria-label="Sources" className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {item.sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {source.host}
                <ExternalLink aria-hidden className="size-3" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
