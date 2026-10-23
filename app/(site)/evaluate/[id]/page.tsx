import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_CONTAINER } from "@/components/site-name";
import { allTools, kitFor } from "@/lib/data";
import { hostOf } from "@/lib/format";
import { KIT_GROUPS } from "@/lib/kit";

export const dynamicParams = false;

export function generateStaticParams() {
  return allTools().filter((t) => t.kind === "tool").map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const kit = kitFor(id);
  if (!kit) return { title: "Tool not found" };
  return {
    title: `Questions to ask ${kit.tool.name}`,
    description: `What ${kit.tool.company} has published about data, continuity, pricing, integration and security for ${kit.tool.name}, and what a buyer still has to ask.`,
    alternates: { canonical: `/evaluate/${kit.tool.id}` },
  };
}

const LINK = "rounded-sm underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export default async function EvaluateToolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kit = kitFor(id);
  if (!kit) notFound();
  const { tool, answers } = kit;
  const open = answers.filter((a) => a.value === null).length;
  return (
    <main id="main" className={`${SITE_CONTAINER} py-8`}>
      <Link href={`/tools/${tool.id}`} className={`${LINK} inline-flex items-center gap-1 text-sm text-muted-foreground`}>
        <ArrowLeft className="size-3.5" aria-hidden /> {tool.name}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Questions to ask {tool.name}</h1>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        {answers.length - open} of {answers.length} questions have something published in the records. For the other{" "}
        {open}, ask {tool.company}. The question list is the same for every tool, at <Link href="/evaluate" className={LINK}>/evaluate</Link>.
      </p>
      {KIT_GROUPS.map((g) => (
        <section key={g.id} aria-labelledby={`g-${g.id}`} className="mt-8">
          <h2 id={`g-${g.id}`} className="text-lg font-semibold tracking-tight">{g.title}</h2>
          <ol className="mt-3 space-y-5">
            {answers.filter((a) => a.q.group === g.id).map(({ q, value, sources }) => (
              <li key={q.id} id={q.id} className="max-w-prose">
                <p className="text-sm font-medium">{q.text}</p>
                {value === null ? (
                  <p className="text-sm text-muted-foreground">Not published: ask the vendor.</p>
                ) : (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Published: </span>
                    {value}
                    {sources.length > 0 && (
                      <span className="text-muted-foreground">
                        {" ("}
                        {sources.map((s, i) => (
                          <span key={s.url}>
                            {i > 0 && ", "}
                            <a href={s.url} target="_blank" rel="noopener noreferrer" className={LINK}>
                              {hostOf(s.url)}
                              <span className="sr-only"> (opens in a new tab)</span>
                            </a>
                          </span>
                        ))}
                        {")"}
                      </span>
                    )}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{q.why}</p>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </main>
  );
}
