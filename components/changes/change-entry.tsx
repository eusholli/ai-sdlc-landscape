import { ChevronRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { ToolLink } from "@/components/tool/tool-actions";
import { formatDate } from "@/lib/format";
import { REPO_URL } from "@/lib/site";
import type { PhaseId, RequestCredit } from "@/lib/types";

export interface TouchedTool {
  id: string;
  name: string;
  logo: string | null;
  phase: PhaseId | null;
  /** False for a tool that has since been removed: it has no drawer to open. */
  linkable: boolean;
}

export interface ChangeItem {
  commit: string;
  date: string;
  text: string;
  author: string;
  requestedBy: RequestCredit[];
  tools: TouchedTool[];
  /** The text of each change in the commit, for the "Show all" list. */
  lines: string[];
}

export interface LaunchItem {
  commit: string;
  date: string;
  text: string;
  author: string;
  requestedBy: RequestCredit[];
}

const LINK =
  "rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50";
const MAX_LOGOS = 5;

function Meta({ author, requestedBy, commit }: { author: string; requestedBy: RequestCredit[]; commit: string }) {
  return (
    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
      <span>by {author}</span>
      {requestedBy.map((credit) => (
        <span key={`${credit.issue}-${credit.name}`}>
          Requested by {credit.name} (
          <a
            href={`${REPO_URL}/issues/${credit.issue}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Issue ${credit.issue} by ${credit.name}, opens in a new tab`}
            className={`${LINK} tabular-nums`}
          >
            #{credit.issue}
          </a>
          )
        </span>
      ))}
      <a href={`${REPO_URL}/commit/${commit}`} target="_blank" rel="noopener noreferrer" className={LINK}>
        commit
        <span className="sr-only"> {commit.slice(0, 7)} (opens in a new tab)</span>
      </a>
    </p>
  );
}

function EntryDate({ date }: { date: string }) {
  return (
    <time dateTime={date} className="font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums sm:pt-0.5">
      {formatDate(date)}
    </time>
  );
}

function OneTool({ tool, text }: { tool: TouchedTool; text: string }) {
  const body = tool.linkable ? (
    <ToolLink
      id={tool.id}
      className="rounded-sm text-sm leading-snug text-pretty underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {text}
    </ToolLink>
  ) : (
    <span className="text-sm leading-snug text-pretty">{text}</span>
  );
  return (
    <div className="flex items-start gap-3">
      <Logo name={tool.name} src={tool.logo} phase={tool.phase} size={28} />
      <div className="min-w-0 flex-1 pt-0.5">{body}</div>
    </div>
  );
}

function SeveralTools({ tools, text, lines }: { tools: TouchedTool[]; text: string; lines: string[] }) {
  const shown = tools.slice(0, MAX_LOGOS);
  const hidden = tools.length - shown.length;
  return (
    <div className="flex items-start gap-3">
      <span aria-hidden className="flex shrink-0 -space-x-2 pt-px">
        {shown.map((tool) => (
          <span key={tool.id} className="rounded-md ring-2 ring-background">
            <Logo name={tool.name} src={tool.logo} phase={tool.phase} size={28} />
          </span>
        ))}
        {hidden > 0 && (
          <span className="z-0 inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-muted px-1 font-mono text-[11px] text-muted-foreground ring-2 ring-background tabular-nums">
            +{hidden}
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm leading-snug text-pretty">{text}</p>
        {lines.length > 1 && (
          <details className="group mt-1.5">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-sm text-xs text-muted-foreground outline-none select-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
              <ChevronRight aria-hidden className="size-3.5 transition-transform group-open:rotate-90" />
              Show all
              <span className="sr-only"> {lines.length} changes in this commit</span>
            </summary>
            <ul className="mt-2 flex flex-col gap-1 border-l pl-3 text-sm text-pretty text-muted-foreground">
              {lines.map((line, i) => (
                <li key={`${i}-${line}`}>{line}</li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}

/** One commit that changed the data, as a list row. */
export function ChangeEntry({ item }: { item: ChangeItem }) {
  return (
    <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:gap-4">
      <EntryDate date={item.date} />
      <div className="min-w-0">
        {item.tools.length === 1 ? (
          <OneTool tool={item.tools[0]} text={item.text} />
        ) : item.tools.length > 1 ? (
          <SeveralTools tools={item.tools} text={item.text} lines={item.lines} />
        ) : (
          <p className="text-sm leading-snug text-pretty">{item.text}</p>
        )}
        <div className={item.tools.length > 0 ? "sm:pl-10" : undefined}>
          <Meta author={item.author} requestedBy={item.requestedBy} commit={item.commit} />
        </div>
      </div>
    </div>
  );
}

/** The commit that brought in the first records. A card, not a row. */
export function LaunchCard({ item }: { item: LaunchItem }) {
  return (
    <article className="rounded-lg border border-border/70 bg-muted/30 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Launch</p>
        <EntryDate date={item.date} />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-pretty">{item.text}</p>
      <Meta author={item.author} requestedBy={item.requestedBy} commit={item.commit} />
    </article>
  );
}
