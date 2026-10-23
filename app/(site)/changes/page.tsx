import { ArrowRight, Rss } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EntryRows, toRows, type Row } from "@/components/changes/entry-list";
import { SITE_CONTAINER } from "@/components/site-name";
import { Button } from "@/components/ui/button";
import { timeline } from "@/lib/data";
import { digestMonths, monthTitle } from "@/lib/digest";

export const metadata: Metadata = {
  title: "What changed",
  description:
    "Every change to the AI SDLC Landscape data, from the public git history, and the market moves the data records.",
  alternates: { canonical: "/changes" },
};

interface Month {
  key: string;
  label: string;
  rows: Row[];
}

function groupByMonth(): Month[] {
  const keys: string[] = [];
  const entriesByMonth = new Map<string, ReturnType<typeof timeline>>();
  for (const entry of timeline()) {
    const key = entry.date.slice(0, 7);
    if (!entriesByMonth.has(key)) {
      entriesByMonth.set(key, []);
      keys.push(key);
    }
    entriesByMonth.get(key)!.push(entry);
  }
  return keys
    .map((key) => ({ key, label: monthTitle(key), rows: toRows(entriesByMonth.get(key)!) }))
    .filter((month) => month.rows.length > 0);
}

export default function ChangesPage() {
  const months = groupByMonth();
  const digests = new Set(digestMonths());

  return (
    <main id="main" className={`${SITE_CONTAINER} py-10`}>
      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="flex min-w-0 flex-1 basis-72 flex-col gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-balance">What changed</h1>
            <p className="text-pretty text-muted-foreground">
              Every change to the data, from the public git history, and the market moves the data records. Newest
              first.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="max-md:h-11 max-md:px-4">
            <a href="/changes.xml">
              <Rss aria-hidden />
              Feed
              <span className="sr-only">(RSS)</span>
            </a>
          </Button>
        </header>

        {months.map((month) => (
          <section key={month.key} aria-labelledby={`month-${month.key}`} className="flex flex-col gap-4">
            <h2 id={`month-${month.key}`} className="border-b pb-2 text-lg font-semibold tracking-tight">
              {digests.has(month.key) ? (
                <Link
                  href={`/changes/${month.key}`}
                  className="group inline-flex items-center gap-1.5 rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 max-md:min-h-11"
                >
                  {month.label}
                  <span className="sr-only">, monthly digest</span>
                  <ArrowRight
                    aria-hidden
                    className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  />
                </Link>
              ) : (
                month.label
              )}
            </h2>
            <EntryRows rows={month.rows} />
          </section>
        ))}
      </div>
    </main>
  );
}
