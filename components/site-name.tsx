import Link from "next/link";

export const SITE_CONTAINER = "mx-auto w-full max-w-[1600px] px-4 sm:px-6";
export const HEADER_GRID =
  "grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-2 md:grid-cols-[1fr_auto_1fr] md:py-0";

export function SiteName() {
  return (
    <Link
      href="/"
      className="flex min-w-0 items-center gap-2.5 rounded-sm text-sm font-semibold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span aria-hidden className="flex h-4 items-end gap-px">
        {[1, 2, 3, 4, 5, 6].map((id) => (
          <span
            key={id}
            className="w-[3px] rounded-[1px]"
            style={{ background: `var(--stage-${id})`, height: `${6 + id * 2}px` }}
          />
        ))}
      </span>
      <span className="truncate">AI SDLC Landscape</span>
    </Link>
  );
}
