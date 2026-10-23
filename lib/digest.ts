// The monthly "state of the landscape" digest: what changed in one month, counted from the change
// log and the data, never written by hand. The site shows it at /changes/<YYYY-MM>, and
// `pnpm digest` writes it out as a short post and a longer Markdown version for the maintainer to
// edit and share. It reports what changed and takes no view of the market.
import "server-only";

import { andList, buildDate, changes, FIELD_LABELS, freshnessSummary, launch, nameOf, phases, timeline, toolById } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import type { Change, FreshnessBand, MarketMove, PhaseId, RequestCredit, TimelineEntry } from "@/lib/types";

export interface Digest {
  /** YYYY-MM. */
  month: string;
  /** "October 2026". */
  title: string;
  /** Set when the landscape launched this month: the launch import. */
  launch: { tools: number; models: number } | null;
  /** Tools added on their own this month, oldest first. */
  added: { id: string; name: string }[];
  /** Records with facts published for the first time this month, and which. */
  published: { id: string; name: string; fields: string[] }[];
  /** Relations newly recorded this month. */
  relations: { from: string; type: string; to: string }[];
  moves: MarketMove[];
  /** People whose requests were accepted this month, with their issues. */
  contributors: { name: string; issues: number[] }[];
  /** Primary phases of the tools added this month, most first. */
  phases: { id: PhaseId; label: string; added: number }[];
  /** Freshness of every record as of the build, not the month. */
  freshness: { band: FreshnessBand; label: string; count: number }[];
  /** Every timeline entry in the month, newest first. */
  entries: TimelineEntry[];
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August",
  "September", "October", "November", "December"];

export const monthTitle = (month: string) => `${MONTH_NAMES[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;

/** Every month with at least one entry on the timeline, newest first. */
export const digestMonths = (): string[] => [...new Set(timeline().map((e) => e.date.slice(0, 7)))];

export function digest(month: string): Digest {
  const inMonth = (d: string) => d.startsWith(month);
  const cs = changes().filter((c) => inMonth(c.date)).reverse();
  const first = launch();
  const launched = first && inMonth(first.date) ? first : null;
  const models = launched ? launched.tools.filter((id) => toolById(id)?.kind === "model").length : 0;

  const added = cs.filter((c) => c.kind === "added" && c.tool).map((c) => ({ id: c.tool!, name: c.name ?? nameOf(c.tool!) }));
  const published = new Map<string, { id: string; name: string; fields: string[] }>();
  for (const c of cs.filter((c) => c.kind === "updated" && c.tool && c.published.length)) {
    const p = published.get(c.tool!) ?? { id: c.tool!, name: c.name ?? nameOf(c.tool!), fields: [] };
    for (const f of c.published) if (!p.fields.includes(f)) p.fields.push(f);
    published.set(c.tool!, p);
  }
  const relations = cs.flatMap((c: Change) => c.relationsAdded.map((r) => ({ from: c.tool!, type: r.type, to: r.to })));

  const people = new Map<string, number[]>();
  for (const r of cs.flatMap((c) => c.requestedBy) as RequestCredit[]) {
    const issues = people.get(r.name) ?? [];
    if (!issues.includes(r.issue)) issues.push(r.issue);
    people.set(r.name, issues);
  }

  const counts = new Map<PhaseId, number>();
  for (const id of [...added.map((a) => a.id), ...(launched?.tools ?? [])]) {
    const p = toolById(id)?.primaryPhase;
    if (p) counts.set(p, (counts.get(p) ?? 0) + 1);
  }
  const entries = timeline().filter((e) => inMonth(e.date));

  return {
    month, title: monthTitle(month),
    launch: launched ? { tools: launched.tools.length - models, models } : null,
    added, published: [...published.values()], relations,
    moves: entries.flatMap((e) => (e.kind === "move" ? [e.move] : [])),
    contributors: [...people].map(([name, issues]) => ({ name, issues })),
    phases: [...counts].map(([id, n]) => ({ id, label: phases().find((p) => p.id === id)?.label ?? id, added: n }))
      .sort((a, b) => b.added - a.added || a.label.localeCompare(b.label)),
    freshness: freshnessSummary(),
    entries,
  };
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** The headline facts as short sentences, shared by the post, the Markdown and the page. */
export function digestFacts(d: Digest): string[] {
  const facts: string[] = [];
  if (d.launch) {
    facts.push(`The landscape launched with ${plural(d.launch.tools, "tool")}${d.launch.models ? ` and ${plural(d.launch.models, "model provider")}` : ""}.`);
  }
  if (d.added.length) facts.push(`${plural(d.added.length, "tool")} added: ${andList(d.added.map((a) => a.name))}.`);
  if (d.published.length) {
    const n = d.published.reduce((s, p) => s + p.fields.length, 0);
    facts.push(`${plural(n, "fact")} published for the first time, across ${plural(d.published.length, "tool")}.`);
  }
  if (d.relations.length) facts.push(`${plural(d.relations.length, "new relation")} between tools.`);
  for (const m of d.moves) {
    facts.push(m.kind === "acquired" ? `${nameOf(m.tool)} was acquired${m.acquirer ? ` by ${m.acquirer}` : ""}.`
      : m.kind === "shut down" ? `${nameOf(m.tool)} shut down.` : `${nameOf(m.tool)} reached end of life.`);
  }
  if (d.contributors.length) {
    const issues = d.contributors.reduce((s, c) => s + c.issues.length, 0);
    facts.push(`${plural(issues, "request")} from ${plural(d.contributors.length, "person", "people")} accepted.`);
  }
  if (!facts.length) facts.push("No changes to the records this month.");
  return facts;
}

/** A short post, plain text, ready to edit and share. */
export function digestPost(d: Digest): string {
  const fresh = d.freshness.find((f) => f.band === "fresh")?.count ?? 0;
  const total = d.freshness.reduce((s, f) => s + f.count, 0);
  return [
    `AI SDLC Landscape, ${d.title}`,
    "",
    ...digestFacts(d).map((f) => `- ${f}`),
    "",
    `${fresh} of ${total} records had every source checked in the last 30 days.`,
    "",
    `The full list, with sources: ${SITE_URL}/changes/${d.month}`,
    "",
  ].join("\n");
}

/** The longer version, as Markdown. */
export function digestMarkdown(d: Digest): string {
  const out = [`# The AI SDLC Landscape in ${d.title}`, "", ...digestFacts(d).map((f) => `- ${f}`), ""];
  if (d.added.length) {
    out.push("## Tools added", "", ...d.added.map((a) => `- [${a.name}](${SITE_URL}/tools/${a.id})`), "");
  }
  if (d.published.length) {
    out.push("## Facts published for the first time", "",
      ...d.published.map((p) => `- [${p.name}](${SITE_URL}/tools/${p.id}): ${andList(p.fields.map((f) => FIELD_LABELS[f] ?? f))}`), "");
  }
  if (d.phases.length) out.push("## Where tools were added", "", ...d.phases.map((p) => `- ${p.label}: ${p.added}`), "");
  if (d.moves.length) {
    out.push("## Market moves", "", ...d.moves.map((m) => `- ${nameOf(m.tool)}: ${m.status}${m.sources[0] ? ` (${m.sources[0]})` : ""}`), "");
  }
  if (d.contributors.length) {
    out.push("## Thanks", "", ...d.contributors.map((c) => `- ${c.name} (${c.issues.map((i) => `#${i}`).join(", ")})`), "");
  }
  out.push("## Freshness", "", `As of ${buildDate()}:`, "", ...d.freshness.map((f) => `- ${f.label}: ${f.count}`), "");
  out.push("## Every change", "", ...d.entries.map((e) => `- ${e.date}: ${e.text}`), "");
  return out.join("\n");
}
