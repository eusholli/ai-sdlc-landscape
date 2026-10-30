import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { SITE_CONTAINER } from "@/components/site-name";
import { Button } from "@/components/ui/button";
import { allTools, contributors } from "@/lib/data";
import { exampleRequestUrl } from "@/lib/llms";
import { REQUEST_ADVICE, REQUEST_INTRO, REQUEST_OUTRO } from "@/lib/request-advice";
import { DATA_LICENCE_URL, REPO, REPO_URL, REQUEST_FIELD, REQUEST_URL, REQUEST_URL_MAX } from "@/lib/site";

export const metadata: Metadata = {
  title: "Request a change",
  description:
    "Ask for a change to the AI SDLC Landscape in plain words by opening a GitHub issue. What to include, how agents can file one, and where the data lives.",
  alternates: { canonical: "/contribute" },
};

const linkClass =
  "rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50";

const AGENT_COMMAND = `gh issue create --repo ${REPO} --title "<tool>: <what changes>" --body "<the request, with its public source>"`;

const AGENT_LINK = `${REQUEST_URL}&title=<tool>: <what changes>&${REQUEST_FIELD}=<the request, with its public source>`;

function CodeBlock({ code, label, copyLabel }: { code: string; label: string; copyLabel: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3">
      <pre className="overflow-x-auto" tabIndex={0} aria-label={label}>
        <code className="font-mono text-[13px] leading-relaxed whitespace-pre">{code}</code>
      </pre>
      <div className="flex items-center justify-end">
        <CopyButton text={code} label={copyLabel} />
      </div>
    </div>
  );
}

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

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className={linkClass}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export default function ContributePage() {
  const people = contributors();
  const exampleId = allTools()[0]?.id ?? "cursor";

  const dataFiles = [
    { href: "/llms.txt", label: "/llms.txt", text: "A map of the site for agents." },
    { href: "/llms-full.txt", label: "/llms-full.txt", text: "Every tool as Markdown, with sources." },
    { href: "/landscape.json", label: "/landscape.json", text: "The full dataset. null means not published." },
    {
      href: `/data/tools/${exampleId}.json`,
      label: "/data/tools/<id>.json",
      text: "One tool and its relations. This link is an example.",
    },
    { href: "/schema/tool.json", label: "/schema/tool.json", text: "The JSON Schema for one record." },
  ];

  return (
    <main id="main" className={`${SITE_CONTAINER} py-10`}>
      <div className="mx-auto flex max-w-3xl flex-col gap-10 text-[15px] leading-relaxed">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">Request a change</h1>
          <p className="text-pretty text-muted-foreground">
            Anyone, person or agent, can ask for a change in plain words by opening a GitHub issue. A maintainer checks
            each request against the rules, then accepts it or closes it with the reason.
          </p>
        </header>

        <Section id="advice" title="What to write">
          <p>{REQUEST_INTRO}</p>
          <ol className="flex list-decimal flex-col gap-2 pl-6 marker:text-muted-foreground">
            {REQUEST_ADVICE.map((item) => (
              <li key={item.title} className="pl-1">
                <strong className="font-semibold">{item.title}</strong> {item.body}
              </li>
            ))}
          </ol>
          <p>{REQUEST_OUTRO}</p>
          <div>
            <Button asChild>
              <a href={REQUEST_URL} target="_blank" rel="noreferrer noopener">
                Open a request on GitHub
                <ArrowUpRight aria-hidden />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </Button>
          </div>
        </Section>

        <Section id="agents" title="For agents">
          <p>The same request, filed as plain text from a terminal. No template or label is needed.</p>
          <CodeBlock code={AGENT_COMMAND} label="Command to file a request" copyLabel="command" />
          <p>
            A chatbot that can&apos;t open issues can give you a link to the request form with your request already
            written in it. Open it signed in to GitHub, check it, then submit. To build the link, add the title and the
            request to the form&apos;s address, both percent-encoded, and keep it under {REQUEST_URL_MAX} characters:
          </p>
          <CodeBlock code={AGENT_LINK} label="Link to a prefilled request" copyLabel="link" />
          <p>
            For example,{" "}
            <ExternalLink href={exampleRequestUrl()}>this link opens a made-up request about a free tier</ExternalLink>.
            The same steps are in{" "}
            <Link href="/llms.txt" className={linkClass}>
              /llms.txt
            </Link>
            .
          </p>
        </Section>

        <Section id="vendors" title="For vendors">
          <p>
            Every tool page offers a small &ldquo;Listed on&rdquo; badge you can put on your own site or README. It is
            a static image that links back to the tool&apos;s page here, so readers can see the record and its sources.
          </p>
          <p>
            The badge does not change the record. A record changes only by a public request with a source, the same
            as for anyone else. See{" "}
            <Link href={`/tools/${exampleId}`} className={linkClass}>
              an example tool page
            </Link>{" "}
            for the badge and its copyable snippets.
          </p>
        </Section>

        <Section id="data" title="Read the data">
          <p>
            Everything on the site is also available as files. The data is{" "}
            <ExternalLink href={DATA_LICENCE_URL}>CC BY 4.0</ExternalLink> and the code is MIT.
          </p>
          <ul className="flex flex-col gap-2">
            {dataFiles.map((file) => (
              <li key={file.label} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                <a
                  href={file.href}
                  className={`${linkClass} w-fit shrink-0 font-mono text-[13px] sm:w-56 sm:pt-px`}
                >
                  {file.label}
                </a>
                <span className="text-muted-foreground">{file.text}</span>
              </li>
            ))}
            <li className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
              <span className="w-fit shrink-0 sm:w-56">
                <ExternalLink href={`${REPO_URL}/tree/main/data/tools`}>Source records on GitHub</ExternalLink>
              </span>
              <span className="text-muted-foreground">The YAML files the site is built from.</span>
            </li>
          </ul>
        </Section>

        <Section id="people" title="People who improved this map">
          {people.length === 0 ? (
            <p className="text-muted-foreground">No requests accepted yet.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {people.map((person) => (
                <li key={person.name} className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium">{person.name}</span>
                  <span className="text-muted-foreground">
                    {person.issues.map((issue, i) => (
                      <span key={issue}>
                        {i > 0 && ", "}
                        <a
                          href={`${REPO_URL}/issues/${issue}`}
                          target="_blank"
                          rel="noreferrer noopener"
                          aria-label={`Issue ${issue} by ${person.name}, opens in a new tab`}
                          className={`${linkClass} tabular-nums`}
                        >
                          #{issue}
                        </a>
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </main>
  );
}
