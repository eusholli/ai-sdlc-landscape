import { Download } from "lucide-react";
import type { Metadata } from "next";
import { SITE_CONTAINER } from "@/components/site-name";
import { Button } from "@/components/ui/button";
import { allTools, dataDate, phases, relations } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { CORRECTION_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "What the AI SDLC Landscape covers, which tools are included, how every fact is sourced, and how to suggest a correction.",
};

const TIERS = [
  { tier: "A", text: "The vendor's own page: product, docs, pricing or changelog." },
  { tier: "B", text: "Reputable press or analyst coverage." },
  { tier: "C", text: "Secondary sources, used only when nothing better exists." },
];

const linkClass =
  "rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-lg font-semibold tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function AboutPage() {
  const date = dataDate();
  const toolCount = allTools().filter((t) => t.kind === "tool").length;

  return (
    <main id="main" className={`${SITE_CONTAINER} py-10`}>
      <div className="mx-auto flex max-w-3xl flex-col gap-10 text-[15px] leading-relaxed">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">About the landscape</h1>
          <p className="text-pretty text-muted-foreground">
            A public, neutral map of {toolCount} AI tools across the {phases().length} phases of the software
            lifecycle, with {relations().length} typed relations between them. It takes no money from vendors and
            ranks nobody.
          </p>
        </header>

        <Section id="inclusion" title="What gets in">
          <p>
            A tool is included when it is a shipping product with AI in the software lifecycle and has a public page.
            Announcements, waitlists and research demos do not count. Model providers appear as a separate layer
            because many tools build on them.
          </p>
        </Section>

        <Section id="method" title="How the data is built">
          <p>
            Every non-empty field traces to a page that was fetched and cached. Those pages are listed under Sources on
            each tool, with the field they back and the date they were retrieved. Sources fall into three tiers.
          </p>
          <ul className="flex flex-col gap-2">
            {TIERS.map(({ tier, text }) => (
              <li key={tier} className="flex items-baseline gap-3">
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md border font-mono text-xs font-semibold">
                  {tier}
                </span>
                <span>
                  <span className="sr-only">{`Tier ${tier}: `}</span>
                  {text}
                </span>
              </li>
            ))}
          </ul>
          <p>
            Where a tool shows <span className="font-medium">Not published</span>, the vendor does not say. It does not
            mean we could not be bothered to look, and it is never a guess. Thin fields are a floor, not a census: see
            the <a href="/insights" className={linkClass}>insights page</a> for how complete each field is.
          </p>
        </Section>

        <Section id="excluded" title="What is left out">
          <p>
            Anything that fails the bar above is out: products with no public page, products that have not shipped, and
            tools where AI plays no part in software work. Companies that only appear as the other end of a relation,
            such as a platform a tool ships inside, are recorded as context. They are not counted as tools and have no
            page of their own.
          </p>
        </Section>

        <Section id="data" title="The data">
          <p>
            The data is as of <time dateTime={date}>{formatDate(date)}</time>. The full dataset, including sources, is
            one JSON file you can download and reuse under{" "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noreferrer noopener"
              className={linkClass}
            >
              CC BY 4.0
            </a>
            : credit the AI SDLC Landscape and link back. The code is MIT. Logos belong to their owners and are not
            covered.
          </p>
          <div>
            <Button asChild variant="outline">
              <a href="/landscape.json" download>
                <Download aria-hidden />
                Download landscape.json
              </a>
            </Button>
          </div>
        </Section>

        <Section id="corrections" title="Suggest a correction">
          <p>
            Found something wrong or out of date? Open an issue with the tool, the field and a link to the page that
            shows the right answer. Corrections with a public source are the fastest to land.
          </p>
          <p>
            <a href={CORRECTION_URL} target="_blank" rel="noreferrer noopener" className={linkClass}>
              Open a correction issue on GitHub
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </Section>

        <p className="border-t pt-6 text-sm text-muted-foreground">Logos and product names belong to their owners.</p>
      </div>
    </main>
  );
}
