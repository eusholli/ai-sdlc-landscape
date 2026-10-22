import type { Metadata } from "next";
import { MoveEntry, type MoveItem } from "@/components/moves/move-entry";
import { MovesTimeline } from "@/components/moves/moves-timeline";
import { SITE_CONTAINER } from "@/components/site-name";
import { marketMoves, toolById } from "@/lib/data";
import { formatDate, hostOf } from "@/lib/format";
import type { MarketMove } from "@/lib/types";

export const metadata: Metadata = {
  title: "Market moves",
  description: "Acquisitions, shutdowns and end-of-life notices among AI SDLC tools, with the source for each.",
  alternates: { canonical: "/moves" },
};

function headlineFor(name: string, move: MarketMove): string {
  if (move.kind === "acquired") return move.acquirer ? `${name} acquired by ${move.acquirer}` : `${name} acquired`;
  if (move.kind === "shut down") return `${name} shut down`;
  return `${name} reached end of life`;
}

function toItem(move: MarketMove): MoveItem | null {
  const tool = toolById(move.tool);
  if (!tool) return null;
  return {
    id: tool.id,
    name: tool.name,
    logo: tool.logo,
    phase: tool.primaryPhase,
    headline: headlineFor(tool.name, move),
    date: move.date ? formatDate(move.date) : null,
    dateIso: move.date,
    status: move.status,
    sources: move.sources.map((url) => ({ url, host: hostOf(url) })),
  };
}

export default function MovesPage() {
  const items = marketMoves()
    .map((move) => toItem(move))
    .filter((item): item is MoveItem => item !== null);
  const dated = items.filter((item) => item.dateIso);
  const undated = items.filter((item) => !item.dateIso);

  return (
    <main id="main" className={`${SITE_CONTAINER} py-10`}>
      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">Market moves</h1>
          <p className="text-pretty text-muted-foreground">
            {items.length} acquisitions, shutdowns and end-of-life notices. A date appears only when the vendor&apos;s
            status text gives one. Everything else is listed as undated, not guessed.
          </p>
        </header>

        <section aria-labelledby="dated-heading" className="flex flex-col gap-5">
          <h2 id="dated-heading" className="text-lg font-semibold tracking-tight">
            Dated moves
            <span className="ml-2 font-mono text-sm font-normal text-muted-foreground tabular-nums">
              {dated.length}
            </span>
          </h2>
          {dated.length > 0 ? (
            <MovesTimeline items={dated} />
          ) : (
            <p className="text-sm text-muted-foreground">No move in the data carries a date.</p>
          )}
        </section>

        {undated.length > 0 && (
          <section aria-labelledby="undated-heading" className="flex flex-col gap-5">
            <h2 id="undated-heading" className="text-lg font-semibold tracking-tight">
              Undated in the source data
              <span className="ml-2 font-mono text-sm font-normal text-muted-foreground tabular-nums">
                {undated.length}
              </span>
            </h2>
            <ol className="flex flex-col gap-3">
              {undated.map((item) => (
                <li key={item.id}>
                  <MoveEntry item={item} />
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </main>
  );
}
