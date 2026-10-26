import Link from "next/link";
import { NAV } from "@/components/site-nav";
import { SITE_CONTAINER } from "@/components/site-name";
import { dataDate, phases } from "@/lib/data";
import { formatDate } from "@/lib/format";

const linkClass =
  "rounded-sm underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 max-sm:inline-flex max-sm:min-h-11 max-sm:items-center";

export function SiteFooter() {
  const date = dataDate();

  return (
    <footer className="border-t">
      <div className={`${SITE_CONTAINER} flex flex-col gap-6 py-8 text-sm text-muted-foreground`}>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
          <section aria-labelledby="footer-site" className="flex flex-col gap-1.5">
            <h2 id="footer-site" className="text-xs font-medium text-foreground">AI SDLC Landscape</h2>
            <ul className="flex flex-col gap-1 sm:gap-1.5">
              {NAV.filter((g) => g.href).map((group) => (
                <li key={group.id}>
                  <Link href={group.href!} className={linkClass}>{group.label}</Link>
                </li>
              ))}
            </ul>
          </section>
          {NAV.filter((g) => g.items).map((group) => (
            <section key={group.id} aria-labelledby={`footer-${group.id}`} className="flex flex-col gap-1.5">
              <h2 id={`footer-${group.id}`} className="text-xs font-medium text-foreground">{group.label}</h2>
              <ul className="flex flex-col gap-1 sm:gap-1.5">
                {group.items!.map((item) => (
                  <li key={item.href}>
                    {item.download ? (
                      <a href={item.href} className={linkClass}>{item.label}</a>
                    ) : (
                      <Link href={item.href} className={linkClass}>{item.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <section aria-labelledby="footer-phases" className="col-span-2 flex flex-col gap-1.5">
            <h2 id="footer-phases" className="text-xs font-medium text-foreground">Tools by phase</h2>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1 sm:gap-y-1.5">
              {phases().map((phase) => (
                <li key={phase.id}>
                  <Link href={`/phases/${phase.id}`} prefetch={false} className={linkClass}>{phase.label}</Link>
                </li>
              ))}
            </ul>
          </section>
        </nav>
        <p className="border-t pt-4 text-pretty">
          Data as of <time dateTime={date}>{formatDate(date)}</time>. Every fact links to its source. Logos belong to
          their owners.
        </p>
      </div>
    </footer>
  );
}
