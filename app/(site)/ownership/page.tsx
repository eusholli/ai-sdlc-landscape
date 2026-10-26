import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import { PaperMermaid } from "@/components/paper/paper-mermaid";
import { SITE_CONTAINER } from "@/components/site-name";
import { formatDate } from "@/lib/format";
import { jsonLdText, paperJsonLd } from "@/lib/jsonld";
import { getPaper, keyTerms, type PaperTerm } from "@/lib/paper";
import { PAPER_PDF_PATH, SITE_URL } from "@/lib/site";

const DESCRIPTION =
  "A paper that defines software ownership, the software factory and factory engineering for agentic development: why the scarce resource is the capacity to bring many concurrent changes to one accountable state.";

export function generateMetadata(): Metadata {
  const paper = getPaper();
  return {
    title: "Software ownership, the software factory and factory engineering",
    description: DESCRIPTION,
    alternates: { canonical: "/ownership" },
    // Google Scholar reads these to index the paper and its PDF.
    other: {
      citation_title: paper.title,
      citation_author: paper.author,
      citation_publication_date: paper.date.replace(/-/g, "/"),
      citation_pdf_url: `${SITE_URL}${PAPER_PDF_PATH}`,
    },
  };
}

// "X is Y." from a glossary row, quotable on its own. A countable term takes an article.
const COUNTABLE = new Set(["Software factory"]);
function definitionSentence(t: PaperTerm): string {
  const subject = COUNTABLE.has(t.term) ? `A ${t.term.toLowerCase()}` : t.term;
  return `${subject} is ${t.definition.charAt(0).toLowerCase()}${t.definition.slice(1)}.`;
}

export default function OwnershipPage() {
  const paper = getPaper();
  const terms = keyTerms(paper);
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
            <p className="text-sm">
              <a
                href={PAPER_PDF_PATH}
                download
                className="rounded-sm font-medium underline underline-offset-4 outline-none hover:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                Download the PDF
              </a>
            </p>
          </header>
          <section aria-labelledby="why-this-paper" className="mt-8 flex flex-col gap-3 border-y py-6">
            <h2 id="why-this-paper" className="text-xl font-semibold tracking-tight">
              Why this paper
            </h2>
            <p className="text-pretty">
              Agentic AI has made producing software cheap. Owning the result has not become cheap. Every change still
              lands in one shared system that customers and the business rely on, and someone still has to decide it was
              worth making, check that it works, run it and answer for it when it fails.
            </p>
            <p className="text-pretty">
              The paper argues that the constraint has moved from producing changes to owning what they do, and that two
              capacities are not solved. The first is single-change yield: a change has to pass every stage from intent
              to production, and six stages that each pass nine changes in ten pass only about half first time. The
              second is convergence: when many changes are in flight at once they clash, since two changes can each be
              correct alone and break the system together. The two feed each other. Rework keeps changes in flight
              longer, which makes clashes more likely. Past some load, agents look busy while less and less work reaches
              production in a state anyone can run.
            </p>
            <p className="text-pretty">
              This is why it matters to anyone choosing tools from this map. Faster review, testing or generation moves
              work along but does not reduce the clashes between changes. A person still has to accept each
              consequential change and answer for it, and the better agents get, the more that decision is the final
              constraint. The paper expects the organizations that succeed to be the ones that use agents to raise their
              capacity to own software faster than they raise the number of changes in flight.
            </p>
            <p className="text-pretty">
              It defines software ownership, names the parts of the problem (the accepted state, changes in flight,
              drift), states eight beliefs about what decides whether a change converges, and sets out the research that
              would test them. These are beliefs, not findings, and researchers and practitioners are invited to take
              them up. The contents on the left link to each section.
            </p>
          </section>
          <section aria-labelledby="key-terms" className="mt-8 flex flex-col gap-3 border-b pb-6">
            <h2 id="key-terms" className="text-xl font-semibold tracking-tight">
              The terms this paper defines
            </h2>
            <dl className="flex flex-col gap-3">
              {terms.map((t) => (
                <div key={t.id} id={t.id.replace(/^term-/, "")} className="scroll-mt-6">
                  <dt className="font-semibold">{t.term}</dt>
                  <dd className="text-pretty">
                    {definitionSentence(t)}{" "}
                    <a
                      href={`#${t.id}`}
                      className="rounded-sm text-sm text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      Glossary
                    </a>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <div id="paper-body" className="paper mt-8" dangerouslySetInnerHTML={{ __html: paper.html }} />
          <PaperMermaid targetId="paper-body" />
        </article>
      </div>
    </main>
  );
}
