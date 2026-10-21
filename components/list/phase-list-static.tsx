// The phone list as plain server HTML, shown while the client list loads. The client list reads
// the URL, which Next renders only in the browser, so without this a phone gets an empty page
// first and the whole list shifts in after hydration. Same layout as PhaseList, unfiltered,
// with each tool linking to its own page.
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { Logo } from "@/components/logo";
import { buildGroups } from "@/components/list/groups";
import type { PhaseListProps } from "@/components/list/phase-list";

export function PhaseListStatic({ tools, phases, layers, fullLifecycleIds }: PhaseListProps) {
  const groups = buildGroups(tools, phases, layers, fullLifecycleIds, false).filter((g) => g.tools.length > 0);
  return (
    <div className="border-b">
      <div className="flex flex-col gap-2 border-b bg-background p-3">
        <div className="flex gap-2">
          <div className="h-9 flex-1 rounded-md border bg-transparent px-3 py-1 text-sm leading-7 text-muted-foreground">
            Search tools
          </div>
          <div className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium">
            <SlidersHorizontal aria-hidden className="size-4" />
            Filters
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-mono tabular-nums">{tools.length}</span> of{" "}
          <span className="font-mono tabular-nums">{tools.length}</span>
        </p>
      </div>
      <div className="mx-auto max-w-3xl">
        {groups.map((group) => (
          <section key={group.id} aria-labelledby={`static-${group.id}`}>
            <h2
              id={`static-${group.id}`}
              className="flex items-baseline justify-between border-y-0 border-t-2 border-b bg-background px-4 py-2 text-sm font-semibold"
              style={{ borderTopColor: group.colour }}
            >
              {group.label}
              <span className="font-mono text-xs font-normal text-muted-foreground tabular-nums">
                {group.tools.length}
              </span>
            </h2>
            <ul className="divide-y">
              {group.tools.map((tool) => (
                <li key={tool.id}>
                  <Link href={`/tools/${tool.id}`} className="flex min-h-14 w-full items-center gap-3 px-4 py-2">
                    <Logo name={tool.name} src={tool.logo} phase={tool.primaryPhase} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{tool.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {tool.company}
                        {tool.moved && " · Acquired or shut down"}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
