export interface FieldCount {
  label: string;
  known: number;
  total: number;
}

export function FieldCompleteness({ rows }: { rows: FieldCount[] }) {
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li
          key={row.label}
          className="grid grid-cols-[8.5rem_minmax(0,1fr)_6.5rem] items-center gap-3 sm:grid-cols-[11rem_minmax(0,1fr)_7.5rem]"
        >
          <span className="truncate text-sm text-foreground">{row.label}</span>
          <span aria-hidden className="h-3 overflow-hidden rounded-sm bg-muted">
            <span
              className="block h-full rounded-sm bg-foreground/60"
              style={{ width: `${row.total ? (row.known / row.total) * 100 : 0}%` }}
            />
          </span>
          <span className="text-right font-mono text-xs text-muted-foreground tabular-nums">
            <span className="text-sm text-foreground">{row.known}</span> of {row.total}
          </span>
        </li>
      ))}
    </ul>
  );
}
