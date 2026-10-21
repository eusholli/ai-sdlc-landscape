import type { Metadata } from "next";
import { MoveEntry } from "@/components/moves/move-entry";
import { MovesTimeline } from "@/components/moves/moves-timeline";
import type { MoveItem } from "@/components/moves/types";
import { SITE_CONTAINER } from "@/components/site-name";
import { marketMoves, toolById } from "@/lib/data";

export const metadata: Metadata = {
  title: "Market moves",
  description: "Acquisitions and shutdowns recorded in the AI SDLC Landscape, with the date and sources where the data has them.",
};

function toItems(): MoveItem[] {
  return marketMoves().flatMap((move) => {
    const tool = toolById(move.tool);
    if (!tool) return [];
    return [
      {
        toolId: tool.id,
        toolName: tool.name,
        logo: tool.logo,
        phase: tool.primaryPhase,
        kind: move.kind,
        acquirer: move.acquirer,
        date: move.date,
        status: move.status,
        sources: move.sources,
      },
    ];
  });
}

export default function MovesPage() {
  const items = toItems();
  const dated = items.filter((i) => i.date);
  const undated = items.filter((i) => !i.date);

  return (
    <main id="main" className={`${SITE_CONTAINER} py-8`}>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Market moves</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acquisitions and shutdowns recorded in the census. Dates come from the status text of each tool. Where the
          text gives no date, the move is listed separately and we do not guess one.
        </p>
        <p className="mt-3 font-mono text-xs text-muted-foreground tabular-nums">
          {dated.length} dated, {undated.length} undated
        </p>

        <section aria-labelledby="dated-heading" className="mt-10">
          <h2 id="dated-heading" className="text-lg font-semibold tracking-tight">
            Timeline
          </h2>
          <div className="mt-6">
            {dated.length > 0 ? (
              <MovesTimeline items={dated} />
            ) : (
              <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                No move in the source data carries a date.
              </p>
            )}
          </div>
        </section>

        {undated.length > 0 && (
          <section aria-labelledby="undated-heading" className="mt-14">
            <h2 id="undated-heading" className="text-lg font-semibold tracking-tight">
              Undated in the source data
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Listed by tool name.</p>
            <ol className="mt-6 space-y-4">
              {undated.map((item) => (
                <li key={item.toolId}>
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
