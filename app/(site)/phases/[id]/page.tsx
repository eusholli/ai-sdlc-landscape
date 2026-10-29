import { ArrowLeft, ArrowRight, Map as MapIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_CONTAINER } from "@/components/site-name";
import { ToolRows } from "@/components/tool-rows";
import { allTools, phases } from "@/lib/data";
import { phaseColor } from "@/lib/format";
import { breadcrumbJsonLd, jsonLdText, phaseJsonLd } from "@/lib/jsonld";
import { phaseCountLine, phasePage, phaseTitle } from "@/lib/phase-page";
import { OPEN_GRAPH } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return phases().map((p) => ({ id: p.id }));
}

const pageFor = (id: string) => phasePage(id, phases(), allTools());

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const page = pageFor(id);
  if (!page) return {};
  const title = phaseTitle(page.phase);
  const description = `${page.phase.description} ${phaseCountLine(page)}`;
  return {
    title,
    description,
    alternates: {
      canonical: `/phases/${id}`,
      types: { "text/markdown": `/phases/${id}.md`, "application/json": `/data/phases/${id}.json` },
    },
    openGraph: { ...OPEN_GRAPH, description, url: `/phases/${id}` },
  };
}

const LINK =
  "rounded-sm outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 max-md:min-h-11";

export default async function PhasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = pageFor(id);
  if (!page) notFound();
  const { phase, primary, alsoCovers, prev, next } = page;
  const title = phaseTitle(phase);

  return (
    <main id="main" className={`${SITE_CONTAINER} py-10`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdText(phaseJsonLd({ id, title, description: phase.description, tools: [...primary, ...alsoCovers] })),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdText(breadcrumbJsonLd([[phase.label, `/phases/${id}`]])) }}
      />
      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <header className="flex flex-col gap-4 border-t-4 pt-6" style={{ borderTopColor: phaseColor(phase.id) }}>
          <nav aria-label="Breadcrumb">
            <Link href="/" className={`inline-flex items-center gap-1 text-sm text-muted-foreground ${LINK}`}>
              <ArrowLeft aria-hidden className="size-3.5" />
              Back to the map
            </Link>
          </nav>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">
              Lifecycle phase {phase.order} of {phases().length}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-balance">{title}</h1>
          </div>
          <p className="max-w-prose text-pretty">{phase.description}</p>
          <p className="text-sm text-muted-foreground">
            {phaseCountLine(page)} Each claim is the vendor&apos;s own words, and every fact on a tool&apos;s page links to
            its source.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <Link href={`/?phase=${id}`} className={`inline-flex items-center gap-1 underline underline-offset-4 ${LINK}`}>
              <MapIcon aria-hidden className="size-4" />
              See this phase on the map
            </Link>
            <a href={`/phases/${id}.md`} className={`inline-flex items-center underline underline-offset-4 ${LINK}`}>
              This list as Markdown
            </a>
          </div>
        </header>

        <section aria-labelledby="primary-heading" className="flex flex-col gap-3">
          <h2 id="primary-heading" className="text-xl font-semibold tracking-tight">
            Main phase
          </h2>
          {primary.length ? (
            <ToolRows tools={primary} />
          ) : (
            <p className="text-sm text-muted-foreground">No tool lists this as its main phase yet.</p>
          )}
        </section>

        {alsoCovers.length > 0 && (
          <section aria-labelledby="also-heading" className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 id="also-heading" className="text-xl font-semibold tracking-tight">
                Also covers this phase
              </h2>
              <p className="text-sm text-muted-foreground">Tools whose main phase is another one.</p>
            </div>
            <ToolRows tools={alsoCovers} />
          </section>
        )}

        <nav aria-labelledby="phases-heading" className="flex flex-col gap-3 border-t pt-6">
          <h2 id="phases-heading" className="text-sm font-semibold">
            Other phases
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {prev && (
              <Link href={`/phases/${prev.id}`} className={`flex items-center gap-2 rounded-lg border p-3 text-sm font-medium hover:bg-muted/50 ${LINK}`}>
                <ArrowLeft aria-hidden className="size-4 shrink-0" />
                {prev.label}
              </Link>
            )}
            {next && (
              <Link
                href={`/phases/${next.id}`}
                className={`flex items-center justify-end gap-2 rounded-lg border p-3 text-sm font-medium hover:bg-muted/50 sm:col-start-2 ${LINK}`}
              >
                {next.label}
                <ArrowRight aria-hidden className="size-4 shrink-0" />
              </Link>
            )}
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {phases().map((p) => (
              <li key={p.id}>
                {p.id === id ? (
                  <span aria-current="page" className="font-medium text-foreground">
                    {p.label}
                  </span>
                ) : (
                  <Link href={`/phases/${p.id}`} className={`underline-offset-4 hover:underline ${LINK}`}>
                    {p.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}
