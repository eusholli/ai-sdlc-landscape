import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import { PaperMermaid } from "@/components/paper/paper-mermaid";
import { SITE_CONTAINER } from "@/components/site-name";
import { formatDate } from "@/lib/format";
import { jsonLdText, paperJsonLd } from "@/lib/jsonld";
import { getPaper } from "@/lib/paper";

const DESCRIPTION =
  "A paper on software ownership in agentic development: why the scarce resource is the capacity to bring many concurrent changes to one accountable state, with six beliefs and the research that would test them.";

export const metadata: Metadata = {
  title: "Software ownership: the thesis",
  description: DESCRIPTION,
  alternates: { canonical: "/ownership" },
};

export default function OwnershipPage() {
  const paper = getPaper();
  return (
    <main id="main" className={`${SITE_CONTAINER} py-10`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(paperJsonLd(paper)) }} />
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-labelledby="paper-contents" className="hidden lg:block">
          <div className="sticky top-6 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <h2 id="paper-contents" className="mb-2 text-sm font-semibold">
              Contents of the paper
            </h2>
            <ol className="flex flex-col gap-1 text-sm">
              {paper.toc
                .filter((h) => h.depth === 2)
                .map((h) => (
                  <li key={h.id}>
                    <a
                      href={`#${h.id}`}
                      className="rounded-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {h.text}
                    </a>
                  </li>
                ))}
            </ol>
          </div>
        </nav>
        <article className="min-w-0">
          <header className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-balance">{paper.title}</h1>
            <p className="text-sm text-muted-foreground">
              {paper.author}, {paper.role}. {paper.version}, {formatDate(paper.date)}.
            </p>
            <p className="text-pretty">
              A working paper on what changes when AI agents make writing software cheap. It argues that the scarce
              part is now owning the result: bringing many concurrent changes to one settled state that someone can
              answer for. It defines software ownership, states six beliefs about how that work converges, and lists
              the research that would test them. It runs to about 16,000 words with appendices, and the contents on
              the left link to each section.
            </p>
            <p className="text-sm text-muted-foreground">
              This is the maintainer&apos;s own argument. The landscape&apos;s records carry no part of it, and every fact on
              the map stands on its source alone.
            </p>
          </header>
          <div id="paper-body" className="paper mt-8" dangerouslySetInnerHTML={{ __html: paper.html }} />
          <PaperMermaid targetId="paper-body" />
        </article>
      </div>
    </main>
  );
}
