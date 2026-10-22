import { ArrowRightLeft, ArrowUpRight, Ban, ExternalLink, Info } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDate, hostOf } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FactsGrid } from "./facts-grid";
import { groupSources } from "./facts";
import { PhaseCoverage } from "./phase-coverage";
import { RelationGroups } from "./relation-groups";
import { SourceList } from "./source-list";
import { CompareButton } from "./tool-actions";
import { ToolLogo } from "./tool-logo";
import type { DetailVariant, ToolDetailData, ToolDetailRefs } from "./types";

const REPO_URL = "https://github.com/eusholli/ai-sdlc-landscape";
const CORRECTION_URL = `${REPO_URL}/issues/new?template=correction.yml`;
const LINK = "rounded-sm underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

/** A date linked to the commit that made it, so the reader can see exactly what changed. */
function CommitDate({ date, commit }: { date: string; commit: string }) {
  return (
    <a href={`${REPO_URL}/commit/${commit}`} target="_blank" rel="noopener noreferrer" className={cn(LINK, "tabular-nums")}>
      {formatDate(date)}
    </a>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (/shut down|end of life/i.test(status)) return <Ban className="size-3.5 shrink-0" aria-hidden />;
  if (/acquired/i.test(status)) return <ArrowRightLeft className="size-3.5 shrink-0" aria-hidden />;
  return <Info className="size-3.5 shrink-0" aria-hidden />;
}

/**
 * The one presentational component behind both the drawer and the tool page. It holds no state
 * and reads no data module, so it renders on the server and inside the client drawer alike.
 */
export function ToolDetail({
  data,
  refs,
  variant,
  headerClassName,
}: {
  data: ToolDetailData;
  refs: ToolDetailRefs;
  variant: DetailVariant;
  headerClassName?: string;
}) {
  const { tool, relations } = data;
  const isPage = variant === "page";
  const Title = isPage ? "h1" : "h2";
  const heading = isPage ? "h2" : "h3";

  const sourceGroups = groupSources(tool.sources);
  const sourceNumbers = Object.fromEntries(sourceGroups.map((g, i) => [g.field, i + 1]));
  const claimSource = tool.sources.find((s) => s.field === "summary");
  const status = tool.status ? tool.status.charAt(0).toUpperCase() + tool.status.slice(1) : null;

  return (
    <article className="flex flex-col gap-6">
      <header className={cn("flex flex-col gap-4", headerClassName)}>
        <div className="flex items-start gap-4">
          <ToolLogo id={tool.id} name={tool.name} src={tool.logo} phase={tool.primaryPhase} size={56} />
          <div className="min-w-0 flex-1">
            <Title className="text-xl font-semibold tracking-tight break-words">{tool.name}</Title>
            <p className="text-sm text-muted-foreground">{tool.company}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-sm text-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {hostOf(tool.url)}
                <ExternalLink className="size-3" aria-hidden />
                <span className="sr-only">(vendor site, opens in a new tab)</span>
              </a>
              {status && (
                <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs">
                  <StatusIcon status={status} />
                  {status}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <CompareButton id={tool.id} name={tool.name} />
          {!isPage && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/tools/${tool.id}`}>
                Open page
                <ArrowUpRight aria-hidden />
              </Link>
            </Button>
          )}
        </div>
      </header>

      <figure className="border-l-2 pl-4">
        <blockquote className={cn("text-sm leading-relaxed", !tool.summary && "text-muted-foreground")}>
          {tool.summary ? <>&ldquo;{tool.summary}&rdquo;</> : "Not published"}
        </blockquote>
        <figcaption className="mt-1.5 text-xs text-muted-foreground">
          {tool.summary ? `Claim quoted from ${tool.company}` : `${tool.company} has not published a one-line claim`}
          {tool.summary && claimSource && (
            <>
              {", "}
              <a
                href={claimSource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {hostOf(claimSource.url)}
              </a>
            </>
          )}
        </figcaption>
      </figure>

      <PhaseCoverage tool={tool} phases={refs.phases} heading={heading} />
      <FactsGrid tool={tool} sourceNumbers={sourceNumbers} heading={heading} />
      <RelationGroups relations={relations} refs={refs} heading={heading} />
      <SourceList toolId={tool.id} groups={sourceGroups} heading={heading} />

      <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t pt-4 text-sm">
        <div className="space-y-1 text-muted-foreground">
          <p>
            Last verified <span className="tabular-nums">{formatDate(tool.lastVerified)}</span>
          </p>
          {tool.history && (
            <p>
              Added <CommitDate date={tool.history.added} commit={tool.history.addedCommit} /> by{" "}
              {tool.history.addedBy}
              {tool.history.editedCommit !== tool.history.addedCommit && (
                <>
                  . Last edited <CommitDate date={tool.history.edited} commit={tool.history.editedCommit} /> by{" "}
                  {tool.history.editedBy}
                </>
              )}
              .{" "}
              <a
                href={`${REPO_URL}/commits/main/data/tools/${tool.id}.yaml`}
                target="_blank"
                rel="noopener noreferrer"
                className={LINK}
              >
                Full history
              </a>
            </p>
          )}
        </div>
        <a
          href={`${CORRECTION_URL}&title=${encodeURIComponent(tool.name)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Suggest a correction
          <ExternalLink className="size-3" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </footer>
    </article>
  );
}
