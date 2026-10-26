"use client";

import { Check, Plus, X } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { UNKNOWN } from "@/components/tool/facts";
import { CoverageSegments } from "@/components/tool/phase-coverage";
import { Skeleton } from "@/components/ui/skeleton";
import type { PhaseId, Tool, ToolLite } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { CompareRow } from "./compare-rows";

export interface CompareColumn {
  id: string;
  lite: ToolLite | undefined;
  tool: Tool | null;
  status: "loading" | "ready" | "failed";
}

/**
 * What a column header's button does: take a chosen tool out, add a suggested one, or show a
 * suggestion already added with a tick that takes it out again.
 */
export type ColumnAction = { kind: "remove" | "add" | "added"; run: (id: string) => void };

function ColumnHeader({ column, action }: { column: CompareColumn; action?: ColumnAction }) {
  const name = column.lite?.name ?? column.id;
  return (
    <div className="flex items-start gap-3">
      <Logo
        name={name}
        src={column.lite?.logo ?? null}
        phase={column.lite?.primaryPhase ?? null}
        size={40}
      />
      <div className="min-w-0 flex-1">
        <Link
          href={`/tools/${encodeURIComponent(column.id)}`}
          className="rounded-sm text-sm font-semibold break-words underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {name}
        </Link>
        {column.lite && <p className="text-xs break-words text-muted-foreground">{column.lite.company}</p>}
      </div>
      {action && (
        <button
          type="button"
          onClick={() => action.run(column.id)}
          aria-label={action.kind === "add" ? `Add ${name} to your choices` : `Remove ${name} from your choices`}
          aria-pressed={action.kind === "remove" ? undefined : action.kind === "added"}
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-md outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 max-sm:size-11",
            action.kind === "added" ? "text-success" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {action.kind === "remove" ? (
            <X className="size-4" aria-hidden />
          ) : action.kind === "added" ? (
            <Check className="size-4" strokeWidth={3} aria-hidden />
          ) : (
            <Plus className="size-4" aria-hidden />
          )}
        </button>
      )}
    </div>
  );
}

function Cell({
  row,
  column,
  index,
  labelOf,
}: {
  row: CompareRow;
  column: CompareColumn;
  index: number;
  labelOf: (id: PhaseId) => string;
}) {
  if (column.status === "loading") return <Skeleton className="h-4 w-3/4" />;
  if (column.status === "failed" || !column.tool) {
    return <span className="text-muted-foreground">{row.kind === "fact" ? "Could not load" : ""}</span>;
  }

  if (row.kind === "coverage") {
    const tool = column.tool;
    return (
      <div className="flex flex-col gap-2">
        <CoverageSegments tool={tool} labelOf={labelOf} />
        <p className="text-xs text-muted-foreground">
          {tool.primaryPhase
            ? `Primary: ${labelOf(tool.primaryPhase)}`
            : tool.phases.length === 0
              ? "Not tied to one phase"
              : "No primary phase"}
        </p>
      </div>
    );
  }

  const value = row.values[index] ?? UNKNOWN;
  return <span className={cn("break-words", value === UNKNOWN && "text-muted-foreground")}>{value}</span>;
}

export function CompareTable({
  columns,
  rows,
  labelOf,
  onRemove,
  onAdd,
  actionFor,
  caption = "Facts for the selected tools, one column per tool",
}: {
  columns: CompareColumn[];
  rows: CompareRow[];
  labelOf: (id: PhaseId) => string;
  onRemove?: (id: string) => void;
  /** For suggested tools: each column header offers to add the tool to the choices instead. */
  onAdd?: (id: string) => void;
  /** A button per column, when the columns differ; takes the place of `onAdd` and `onRemove`. */
  actionFor?: (id: string) => ColumnAction;
  caption?: string;
}) {
  const action: ColumnAction | undefined = onAdd
    ? { kind: "add", run: onAdd }
    : onRemove
      ? { kind: "remove", run: onRemove }
      : undefined;
  return (
    <div className="relative overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-sm" style={{ minWidth: `${9 + columns.length * 14}rem` }}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-10 w-36 bg-background p-3 text-left align-bottom text-xs font-medium text-muted-foreground"
            >
              Fact
            </th>
            {columns.map((column) => (
              <th key={column.id} scope="col" className="min-w-56 border-l p-3 text-left align-top font-normal">
                <ColumnHeader column={column} action={actionFor ? actionFor(column.id) : action} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr className="border-t">
              <td colSpan={columns.length + 1} className="p-6 text-center text-muted-foreground">
                Every fact matches across these tools. Turn off the filter to see them.
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.key} className="border-t">
              <th
                scope="row"
                className={cn(
                  "sticky left-0 z-10 p-3 text-left align-top text-xs font-medium",
                  row.differs ? "bg-muted text-foreground" : "bg-background text-muted-foreground",
                )}
              >
                {row.label}
                {row.differs && (
                  <span className="mt-1 block font-mono text-[10px] tracking-wide uppercase">Differs</span>
                )}
              </th>
              {columns.map((column, index) => (
                <td key={column.id} className={cn("min-w-56 border-l p-3 align-top", row.differs && "bg-muted")}>
                  <Cell row={row} column={column} index={index} labelOf={labelOf} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
