import { cn } from "@/lib/utils";

/**
 * A small "New" pill for a tool added in the last 30 days. Primary token, solid tint so it stays
 * readable over a logo corner, and it never animates.
 */
export function NewBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border border-primary/40 bg-[color-mix(in_oklab,var(--primary)_10%,var(--background))] px-1 text-[9px] leading-4 font-medium text-primary",
        className,
      )}
    >
      New
    </span>
  );
}
