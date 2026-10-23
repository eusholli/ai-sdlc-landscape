import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONTAINER } from "@/components/site-name";
import { KIT, KIT_GROUPS } from "@/lib/kit";

export const metadata: Metadata = {
  title: "Evaluate an AI SDLC tool",
  description:
    "The questions a buyer puts to an AI SDLC vendor: data, continuity, pricing, integration and security. Open any tool to see which ones the vendor has already answered in public.",
  alternates: { canonical: "/evaluate" },
};

const LINK = "rounded-sm underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export default function EvaluatePage() {
  return (
    <main id="main" className={`${SITE_CONTAINER} py-8`}>
      <h1 className="text-2xl font-semibold tracking-tight">Evaluate an AI SDLC tool</h1>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        {KIT.length} questions to put to a vendor, in six groups. Each says why a buyer asks it. Open a tool&apos;s
        questions to see which ones its vendor has answered in public, with the source, and which it has not.
      </p>
      <p className="mt-3 flex flex-wrap gap-x-4 text-sm">
        <a href="/evaluate.md" className={LINK}>Download as Markdown</a>
        <a href="/evaluate.csv" className={LINK}>Download as CSV</a>
        <Link href="/" className={LINK}>Pick a tool on the map</Link>
      </p>
      {KIT_GROUPS.map((g) => (
        <section key={g.id} aria-labelledby={`g-${g.id}`} className="mt-8">
          <h2 id={`g-${g.id}`} className="text-lg font-semibold tracking-tight">{g.title}</h2>
          <p className="text-sm text-muted-foreground">{g.blurb}</p>
          <ol className="mt-3 space-y-4">
            {KIT.filter((q) => q.group === g.id).map((q) => (
              <li key={q.id} id={q.id} className="max-w-prose">
                <p className="text-sm font-medium">{q.text}</p>
                <p className="text-sm text-muted-foreground">
                  {q.why}
                  {q.ref && (
                    <>
                      {" "}
                      <a href={q.ref.url} target="_blank" rel="noopener noreferrer" className={LINK}>
                        {q.ref.label}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </>
                  )}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </main>
  );
}
