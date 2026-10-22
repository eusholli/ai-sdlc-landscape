import Link from "next/link";
import { SITE_CONTAINER } from "@/components/site-name";
import { dataDate } from "@/lib/data";
import { formatDate } from "@/lib/format";

const linkClass =
  "rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50";

export function SiteFooter() {
  const date = dataDate();

  return (
    <footer className="border-t">
      <div
        className={`${SITE_CONTAINER} flex flex-col gap-3 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between`}
      >
        <p className="text-pretty">
          Data as of <time dateTime={date}>{formatDate(date)}</time>. Every fact links to its source. Logos belong to
          their owners.
        </p>
        <nav aria-label="Footer" className="flex items-center gap-4">
          <Link href="/about" className={linkClass}>
            About
          </Link>
          <Link href="/contribute" className={linkClass}>
            Request a change
          </Link>
          <a href="/landscape.json" download className={linkClass}>
            Download JSON
          </a>
        </nav>
      </div>
    </footer>
  );
}
