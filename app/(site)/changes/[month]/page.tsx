import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EntryRows, moveItem, toRows } from "@/components/changes/entry-list";
import { CopyButton } from "@/components/copy-button";
import { FreshnessBar } from "@/components/freshness-bar";
import { Logo } from "@/components/logo";
import { MoveEntry } from "@/components/moves/move-entry";
import { SITE_CONTAINER } from "@/components/site-name";
import { ToolLink } from "@/components/tool/tool-actions";
import { andList, buildDate, FIELD_LABELS, toolById } from "@/lib/data";
import { digest, digestFacts, digestMonths, monthTitle } from "@/lib/digest";
import { formatDate, phaseColor } from "@/lib/format";
import { REPO_URL, SITE_URL } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return digestMonths().map((month) => ({ month }));
}

export async function generateMetadata({ params }: { params: Promise<{ month: string }> }): Promise<Metadata> {
  const { month } = await params;
  if (!digestMonths().includes(month)) return {};
  const title = `The landscape in ${monthTitle(month)}`;
  const description = digestFacts(digest(month)).slice(0, 3).join(" ");
  return {
    title,
    description,
    alternates: { canonical: `/changes/${month}` },
    openGraph: { title, description, type: "article", url: `/changes/${month}` },
  };
}

const CARD_LINK =
  "flex items-center gap-3 rounded-lg border bg-card p-3 text-sm font-medium outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50";
const TEXT_LINK =
  "rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50";

function Section({ id, title, subtitle, children }: { id: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-xl font-semibold tracking-tight">
          {title}
        </h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

export default async function DigestPage({ params }: { params: Promise<{ month: string }> }) {
  const { month } = await params;
  const months = digestMonths();
  const position = months.indexOf(month);
  if (position === -1) notFound();

  const d = digest(month);
  const facts = digestFacts(d);
  const newer = months[position - 1];
  const older = months[position + 1];
  const isNewest = position === 0;
  const moves = d.entries.flatMap((entry) => (entry.kind === "move" ? (moveItem(entry) ?? []) : []));
  const rows = toRows(d.entries);
  const maxAdded = Math.max(1, d.phases[0]?.added ?? 1);
  const summaryText = [...facts, "", `${SITE_URL}/changes/${month}`].join("\n");

  return (
    <main id="main" className={`${SITE_CONTAINER} py-10`}>
      <div className="mx-auto flex max-w-3xl flex-col gap-12">
        <header className="flex flex-col gap-6">
          <nav aria-label="Breadcrumb">
            <Link
              href="/changes"
              className="inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 max-md:min-h-11"
            >
              <ArrowLeft aria-hidden className="size-3.5" />
              All changes
            </Link>
          </nav>
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            The landscape in {d.title}
          </h1>
          <ul className="flex flex-col gap-4">
            {facts.map((fact) => (
              <li key={fact} className="text-xl leading-snug text-pretty sm:text-2xl">
                {fact}
              </li>
            ))}
          </ul>
          <div>
            <CopyButton text={summaryText} label="the summary and page link" buttonLabel="Copy summary" />
          </div>
        </header>

        {d.added.length > 0 && (
          <Section id="added-heading" title="Tools added">
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {d.added.map((added) => {
                const tool = toolById(added.id);
                return (
                  <li key={added.id} className="min-w-0">
                    {tool ? (
                      <ToolLink id={tool.id} className={CARD_LINK}>
                        <Logo name={tool.name} src={tool.logo} phase={tool.primaryPhase} size={32} />
                        <span className="min-w-0 truncate">{tool.name}</span>
                      </ToolLink>
                    ) : (
                      <span className={CARD_LINK}>
                        <span className="min-w-0 truncate">{added.name}</span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </Section>
        )}

        {d.published.length > 0 && (
          <Section id="published-heading" title="Facts published for the first time">
            <ul className="flex flex-col gap-2 text-sm">
              {d.published.map((p) => (
                <li key={p.id} className="text-pretty">
                  {toolById(p.id) ? (
                    <ToolLink
                      id={p.id}
                      className={`${TEXT_LINK} font-medium max-md:inline-flex max-md:min-h-11 max-md:items-center`}
                    >
                      {p.name}
                    </ToolLink>
                  ) : (
                    <span className="font-medium">{p.name}</span>
                  )}
                  <span className="text-muted-foreground">
                    {": "}
                    {andList(p.fields.map((field) => FIELD_LABELS[field] ?? field))}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {d.phases.length > 0 && (
          <Section id="phases-heading" title="Where tools were added" subtitle="Each tool counts once, under its primary phase.">
            <ul className="flex flex-col gap-2.5">
              {d.phases.map((phase) => (
                <li
                  key={phase.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 text-sm sm:grid-cols-[14rem_minmax(0,1fr)_auto]"
                >
                  <span className="text-pretty sm:truncate">{phase.label}</span>
                  <span
                    aria-hidden
                    className="order-1 col-span-2 h-2.5 overflow-hidden rounded-full bg-muted sm:order-none sm:col-span-1"
                  >
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${(phase.added / maxAdded) * 100}%`, background: phaseColor(phase.id) }}
                    />
                  </span>
                  <span className="text-right font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                    {phase.added} {phase.added === 1 ? "tool" : "tools"}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {moves.length > 0 && (
          <Section id="moves-heading" title="Market moves">
            <ul className="flex flex-col gap-3">
              {moves.map((item) => (
                <li key={`${item.id}-${item.dateIso}`}>
                  <MoveEntry item={item} />
                </li>
              ))}
            </ul>
          </Section>
        )}

        {d.contributors.length > 0 && (
          <Section id="thanks-heading" title="Thanks" subtitle="People whose requests were accepted this month.">
            <ul className="flex flex-col gap-1.5 text-sm">
              {d.contributors.map((person) => (
                <li key={person.name}>
                  <span className="font-medium">{person.name}</span>{" "}
                  <span className="text-muted-foreground">
                    (
                    {person.issues.map((issue, i) => (
                      <span key={issue}>
                        {i > 0 && ", "}
                        <a
                          href={`${REPO_URL}/issues/${issue}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Issue ${issue} by ${person.name}, opens in a new tab`}
                          className={`${TEXT_LINK} tabular-nums max-md:inline-flex max-md:min-h-11 max-md:min-w-11 max-md:items-center max-md:justify-center`}
                        >
                          #{issue}
                        </a>
                      </span>
                    ))}
                    )
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {isNewest && (
          <Section id="freshness-heading" title="Freshness" subtitle={`As of ${formatDate(buildDate())}`}>
            <FreshnessBar summary={d.freshness} />
          </Section>
        )}

        {rows.length > 0 && (
          <Section id="every-change-heading" title="Every change">
            <EntryRows rows={rows} />
          </Section>
        )}

        {(newer || older) && (
          <nav aria-label="Other months" className="flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-sm">
            {older ? (
              <Link
                href={`/changes/${older}`}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <ArrowLeft aria-hidden className="size-4" />
                <span className="sr-only">Previous month: </span>
                {monthTitle(older)}
              </Link>
            ) : (
              <span />
            )}
            {newer && (
              <Link
                href={`/changes/${newer}`}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="sr-only">Next month: </span>
                {monthTitle(newer)}
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            )}
          </nav>
        )}
      </div>
    </main>
  );
}
