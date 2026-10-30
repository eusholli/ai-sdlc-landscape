// The one place that reads data/landscape.json. Server-only: the full file is 435 KB, so client
// components receive `toolsLite()` and `relationsLite()` as props from a server component, and the
// tool drawer fetches /data/tools/<id>.json. Do not import this file from a "use client" module.
import "server-only";

import { existsSync } from "node:fs";
import { join } from "node:path";
import raw from "@/data/landscape.json";
import phaseFile from "@/data/phases.json";
import { connectionsFor, type ConnGroup, type ConnectionGroup } from "@/lib/connections";
import { PHASE_ORDER, pricingBucket, searchLite } from "@/lib/filters";
import { type Post, readPosts } from "@/lib/blog";
import { phasePage } from "@/lib/phase-page";
import { DATA_LICENCE, DATA_LICENCE_URL, REPO_URL, SITE_URL } from "@/lib/site";
import type {
  Autonomy, Change, Contributor, External, Freshness, FreshnessBand, Landscape, Layer, LayerId, MarketMove,
  Phase, PhaseId, Relation, RelationLite, RelationType, Segment, SegmentId, Source, TimelineEntry, Tool,
  ToolHistory, ToolLite,
} from "@/lib/types";

type RawNode = (typeof raw.nodes)[number] & Record<string, unknown>;

/** The census writes "unknown" for an unpublished fact. Fold that, and empty values, to null. */
const known = <T,>(v: unknown): T | null =>
  v === "unknown" || v === null || v === undefined || v === "" ? null : (v as T);

const list = (v: unknown): string[] | null => {
  const k = known<unknown>(v);
  if (k === null) return null;
  const arr = (Array.isArray(k) ? k : [k]).map(String).filter((s) => s && s !== "unknown");
  return arr.length ? arr : null;
};

function history(h: unknown): ToolHistory | null {
  if (!h || typeof h !== "object") return null;
  const r = h as Record<string, string> & { requested_by?: { name: string; issue: number }[] };
  return {
    added: r.added, addedBy: r.added_by, addedCommit: r.added_commit,
    edited: r.edited, editedBy: r.edited_by, editedCommit: r.edited_commit,
    requestedBy: r.requested_by ?? [],
  };
}

function normalise(n: RawNode): Tool {
  const pricingModel = known<string>(n.pricing_model);
  return {
    id: n.id,
    kind: n.kind as Tool["kind"],
    name: n.name,
    company: String(n.company),
    url: n.url,
    logo: known<string>(n.logo_url),
    layer: known<LayerId>(n.layer),
    primaryPhase: known<PhaseId>(n.primary_phase),
    phases: (list(n.phases) ?? []) as PhaseId[],
    segment: known<SegmentId>(n.segment),
    subKind: known<string>(n.sub_kind),
    targetBuyer: list(n.target_buyer),
    interface: list(n.interface),
    autonomy: known<Autonomy>(n.autonomy),
    summary: known<string>(n.summary),
    customers: list(n.customers),
    traction: known<string>(n.traction),
    gtmPartners: list(n.gtm_partners),
    pricingModel,
    pricingBucket: pricingBucket(pricingModel),
    entryPrice: known<string>(n.entry_price),
    deployment: list(n.deployment),
    models: list(n.models),
    openSource: n.open_source === true ? true : null,
    repo: known<string>(n.repo),
    compliance: list(n.compliance),
    founded: typeof n.founded === "number" ? n.founded : null,
    hq: known<string>(n.hq),
    headcountBand: known<string>(n.headcount_band),
    fundingTotal: known<string>(n.funding_total),
    lastRound: known<string>(n.last_round),
    status: known<string>(n.status),
    sources: n.sources as Source[],
    lastVerified: n.last_verified,
    freshness: (n.freshness as Freshness | null | undefined) ?? null,
    history: history(n.history),
  };
}

const phaseData = phaseFile as unknown as { phases: Phase[]; layers: Layer[]; segments: Segment[] };

const landscape: Landscape = {
  generated: raw.generated,
  built: (raw as { built?: string }).built ?? raw.generated,
  commit: (raw as { commit?: string | null }).commit ?? null,
  licence: DATA_LICENCE,
  licenceUrl: DATA_LICENCE_URL,
  repository: REPO_URL,
  schema: `${SITE_URL}/schema/tool.json`,
  description: raw.description,
  phases: [...phaseData.phases].sort((a, b) => a.order - b.order),
  layers: phaseData.layers,
  segments: phaseData.segments,
  tools: (raw.nodes as RawNode[]).map(normalise),
  externals: raw.externals as External[],
  relations: raw.relations as Relation[],
  contributors: ((raw as { contributors?: Contributor[] }).contributors ?? []),
  changes: [],
};

const byId = new Map(landscape.tools.map((t) => [t.id, t]));
const externalById = new Map(landscape.externals.map((e) => [e.id, e]));

// ---------- Whole-dataset accessors ----------

export const getLandscape = (): Landscape => landscape;
export const phases = (): Phase[] => landscape.phases;
export const layers = (): Layer[] => landscape.layers;
export const segments = (): Segment[] => landscape.segments;
/** Every node: the tools, the model providers and the platforms. */
export const allTools = (): Tool[] => landscape.tools;

/** The other tools whose main phase is this tool's, by name, as its phase page lists them. */
export function otherToolsInPhase(tool: Pick<Tool, "id" | "kind" | "layer" | "primaryPhase">): Tool[] {
  if (tool.kind !== "tool" || tool.layer || !tool.primaryPhase) return [];
  return phasePage(tool.primaryPhase, landscape.phases, landscape.tools)?.primary.filter((t) => t.id !== tool.id) ?? [];
}
export const externals = (): External[] => landscape.externals;
export const relations = (): Relation[] => landscape.relations;
export const dataDate = (): string => landscape.generated;
/** Everyone whose request changed the data, in the order they first did. */
export const contributors = (): Contributor[] => landscape.contributors;
export const buildDate = (): string => landscape.built;

let postsCache: Post[] | null = null;
/** The posts in content/blog, newest first, checked against the ids in the data. */
export const posts = (): Post[] =>
  (postsCache ??= readPosts(join(process.cwd(), "content/blog"), {
    tools: new Set(landscape.tools.map((t) => t.id)),
    phases: new Set(landscape.phases.map((p) => p.id)),
    hasFile: (path) => existsSync(join(process.cwd(), "public", path)),
  }));
export const postBySlug = (slug: string): Post | undefined => posts().find((n) => n.slug === slug);

// ---------- Lookups ----------

export const toolById = (id: string): Tool | undefined => byId.get(id);

/** Display name for any relation endpoint: a tool, a model provider, a platform or an external. */
export const nameOf = (id: string): string => byId.get(id)?.name ?? externalById.get(id)?.name ?? id;

/** True when the id is a node with its own page (tools, models and platforms), false for externals. */
export const hasPage = (id: string): boolean => byId.has(id);

/** The label of where a tool sits on the map: its primary phase, or its layer. Null when neither. */
export function placeLabel(t: Pick<Tool, "primaryPhase" | "layer">): string | null {
  if (t.primaryPhase) return landscape.phases.find((p) => p.id === t.primaryPhase)?.label ?? null;
  if (t.layer) return landscape.layers.find((l) => l.id === t.layer)?.label ?? null;
  return null;
}

// ---------- Selectors ----------

/**
 * Tools grouped under each phase column. A tool appears under its primary phase only; the
 * `phases` array drives the coverage strip and spanning bars, not duplicate tiles.
 * Layer nodes (agent infrastructure, models, platforms) are excluded: see `toolsByLayer`.
 */
export function toolsByPhase(): Record<PhaseId, Tool[]> {
  const out = Object.fromEntries(landscape.phases.map((p) => [p.id, [] as Tool[]])) as Record<PhaseId, Tool[]>;
  for (const t of landscape.tools) {
    if (t.layer || !t.primaryPhase) continue;
    out[t.primaryPhase].push(t);
  }
  for (const k of Object.keys(out) as PhaseId[]) out[k].sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

export function toolsByLayer(): Record<LayerId, Tool[]> {
  const out: Record<LayerId, Tool[]> = { "agent-infra": [], model: [], systems: [] };
  for (const t of landscape.tools) if (t.layer) out[t.layer].push(t);
  for (const k of Object.keys(out) as LayerId[]) out[k].sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

/** Full-lifecycle platforms, drawn as bars spanning every phase they cover. */
export const fullLifecycle = (): Tool[] => landscape.tools.filter((t) => t.segment === "full-lifecycle");

/** Every relation touching a tool, split by direction, with the other end resolved. */
export function relationsFor(id: string): Array<Relation & { other: string; otherName: string; direction: "out" | "in" }> {
  return landscape.relations
    .filter((r) => r.from === id || r.to === id)
    .map((r) => {
      const out = r.from === id;
      const other = out ? r.to : r.from;
      return { ...r, other, otherName: nameOf(other), direction: out ? "out" : "in" };
    });
}

/** A tool's connections across the lifecycle, with the names of every tool they mention. */
export interface ToolConnections {
  groups: ConnectionGroup<Relation>[];
  names: Record<string, string>;
}

const CONN_ORDER: ConnGroup[] = [...PHASE_ORDER, "agent-infra", "systems"];

/**
 * Every phase and layer in order, empty ones included: the tools and platforms linked to this one
 * directly, tools through one other tool, and tools sharing a platform with it, each step sourced.
 */
export function connectionsOf(id: string): ToolConnections {
  const groups = connectionsFor(id, landscape.tools, landscape.relations, CONN_ORDER, nameOf, { includeEmpty: true });
  const ids = new Set(groups.flatMap((g) => [...g.direct, ...g.twoStep, ...g.shared]).flatMap((c) => [c.tool, ...c.paths.flatMap((p) => p.steps.flatMap((s) => [s.from, s.to]))]));
  return { groups, names: Object.fromEntries([...ids].map((x) => [x, nameOf(x)])) };
}

/** Human labels for each relation type, in both directions. */
export const RELATION_LABELS: Record<RelationType, { out: string; in: string }> = {
  integrates_with: { out: "Integrates with", in: "Integrates with" },
  competes_with: { out: "Competes with", in: "Competes with" },
  ships_inside: { out: "Ships inside", in: "Ships with" },
  built_on_model: { out: "Built on", in: "Powers" },
  acquired_by: { out: "Acquired by", in: "Acquired" },
  partners_with: { out: "Partners with", in: "Partners with" },
};

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

/** A date found in a status string, as YYYY-MM-DD or YYYY-MM. Never guessed. */
function dateIn(status: string): string | null {
  const iso = status.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return iso[0];
  const dmy = status.match(/\b(\d{1,2}) ([A-Za-z]{3})[a-z]* (\d{4})\b/);
  if (dmy && MONTHS[dmy[2].toLowerCase()]) return `${dmy[3]}-${MONTHS[dmy[2].toLowerCase()]}-${dmy[1].padStart(2, "0")}`;
  const my = status.match(/\b([A-Za-z]{3})[a-z]* (\d{4})\b/);
  if (my && MONTHS[my[1].toLowerCase()]) return `${my[2]}-${MONTHS[my[1].toLowerCase()]}`;
  return null;
}

/**
 * Acquisitions, shutdowns and end-of-life notices. Dated moves first, oldest to newest, then the
 * undated ones by name. Dates come from the status text only, so most acquisitions are undated.
 */
export function marketMoves(): MarketMove[] {
  const moves: MarketMove[] = [];
  for (const t of landscape.tools) {
    if (!t.status || t.status === "preview") continue;
    const rel = landscape.relations.find((r) => r.from === t.id && r.type === "acquired_by");
    const kind: MarketMove["kind"] = /shut down/i.test(t.status)
      ? "shut down" : /end of life/i.test(t.status) ? "end of life" : "acquired";
    const buyer = rel ? byId.get(rel.to) : undefined;
    moves.push({
      tool: t.id,
      kind,
      acquirer: rel ? buyer?.company ?? nameOf(rel.to) : null,
      date: dateIn(t.status),
      status: t.status,
      sources: rel?.sources ?? t.sources.filter((s) => s.field === "status").map((s) => s.url),
    });
  }
  return moves.sort((a, b) =>
    a.date && b.date ? a.date.localeCompare(b.date) : a.date ? -1 : b.date ? 1 : nameOf(a.tool).localeCompare(nameOf(b.tool)));
}

/** Server-side search across names, companies, customers and claims. The palette calls `searchLite`. */
export const search = (q: string) => searchLite(toolsLite(), q);

// ---------- Projections for client components ----------

export const toLite = (t: Tool): ToolLite => ({
  id: t.id, kind: t.kind, name: t.name, company: t.company, logo: t.logo, layer: t.layer,
  primaryPhase: t.primaryPhase, phases: t.phases, segment: t.segment, subKind: t.subKind,
  summary: t.summary, autonomy: t.autonomy, openSource: t.openSource, pricingBucket: t.pricingBucket,
  deployment: t.deployment, interface: t.interface, targetBuyer: t.targetBuyer, customers: t.customers,
  moved: !!t.status && t.status !== "preview",
  isNew: isNew(t.id),
  freshness: t.freshness?.band ?? null,
});

export const toolsLite = (): ToolLite[] => landscape.tools.map(toLite);
export const relationsLite = (): RelationLite[] => landscape.relations.map(({ from, to, type }) => ({ from, to, type }));

// ---------- Change log and timeline ----------

/** Plain labels for the record's YAML keys, as the change log names them. */
export const FIELD_LABELS: Record<string, string> = {
  name: "name", company: "company", url: "website", layer: "layer", primary_phase: "primary phase",
  phases: "phases", segment: "segment", sub_kind: "kind", target_buyer: "target buyer",
  interface: "interface", autonomy: "autonomy", summary: "one-line claim", customers: "named customers",
  traction: "traction", gtm_partners: "go-to-market partners", pricing_model: "pricing model",
  entry_price: "entry price", deployment: "deployment", models: "models", open_source: "open source",
  repo: "repository", compliance: "compliance", founded: "founding year", hq: "headquarters",
  headcount_band: "headcount", funding_total: "funding total", last_round: "last round",
  status: "status", sources: "sources",
};

const label = (f: string) => FIELD_LABELS[f] ?? f.replace(/_/g, " ");

/** "a", "a and b", "a, b and c". */
export const andList = (xs: string[]): string =>
  xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`;

const upper = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface RawChange {
  kind: Change["kind"]; date: string; commit: string; author: string;
  requested_by?: { name: string; issue: number }[];
  tool: string | null; name: string | null; tools?: string[]; from?: string;
  fields?: string[]; published?: string[];
  relations_added?: { type: string; to: string }[]; relations_removed?: { type: string; to: string }[];
  status?: string | null;
}

/** What changed in one record, without its name: "entry price now published; integrates with GitHub". */
function whatChanged(c: Omit<Change, "text">): string {
  const parts: string[] = [];
  if (c.status !== undefined) parts.push(c.status ? `status now "${c.status}"` : "status cleared");
  for (const r of c.relationsAdded) parts.push(`${RELATION_LABELS[r.type]?.out.toLowerCase() ?? r.type} ${nameOf(r.to)}`);
  if (c.relationsRemoved.length) {
    parts.push(`no longer listed as ${andList(c.relationsRemoved.map((r) => `${RELATION_LABELS[r.type]?.out.toLowerCase() ?? r.type} ${nameOf(r.to)}`))}`);
  }
  const facts = c.fields.filter((f) => f !== "status" && f !== "sources");
  const published = facts.filter((f) => c.published.includes(f));
  const updated = facts.filter((f) => !c.published.includes(f));
  if (published.length) parts.push(`${andList(published.map(label))} now published`);
  if (updated.length) parts.push(`${andList(updated.map(label))} updated`);
  if (!parts.length && c.fields.includes("sources")) parts.push("sources updated");
  return parts.join("; ");
}

function toChange(r: RawChange): Change {
  const c: Omit<Change, "text"> = {
    kind: r.kind, date: r.date, commit: r.commit, author: r.author,
    requestedBy: r.requested_by ?? [], tool: r.tool, name: r.name ?? (r.tool ? nameOf(r.tool) : null),
    tools: r.tools ?? [], from: r.from ?? null, fields: r.fields ?? [], published: r.published ?? [],
    relationsAdded: (r.relations_added ?? []) as Change["relationsAdded"],
    relationsRemoved: (r.relations_removed ?? []) as Change["relationsRemoved"],
    ...(r.status !== undefined ? { status: r.status } : {}),
  };
  const name = c.name ?? c.tool ?? "";
  const text =
    c.kind === "batch" ? `${c.tools.length} tools added in one import`
    : c.kind === "added" ? `${name} added`
    : c.kind === "removed" ? `${name} removed`
    : c.kind === "renamed" ? [`${c.from} renamed to ${name}`, whatChanged(c)].filter(Boolean).join("; ")
    : `${name}: ${whatChanged(c)}`;
  return { ...c, text };
}

// Filled here, not with the rest of `landscape`, because the sentences need the labels above.
landscape.changes = ((raw as { changes?: RawChange[] }).changes ?? []).map(toChange);

/** Every change to the records, newest first. */
export const changes = (): Change[] => [...landscape.changes].reverse();

/** The changes that touched one record, newest first. */
export const changesFor = (id: string): Change[] =>
  changes().filter((c) => c.tool === id || c.from === id || c.tools.includes(id));

/** The commit that brought in the first records, if it was a batch: the landscape's launch. */
export const launch = (): Change | null => (landscape.changes[0]?.kind === "batch" ? landscape.changes[0] : null);

const daysBefore = (date: string, days: number) =>
  new Date(Date.parse(date) - days * 86_400_000).toISOString().slice(0, 10);

/** Days a tool added on its own counts as new. */
export const NEW_DAYS = 30;

const newIds = new Set(landscape.changes
  .filter((c) => c.kind === "added" && c.tool && c.date >= daysBefore(landscape.built, NEW_DAYS))
  .map((c) => c.tool!));

/** Added on its own, not in a batch, within NEW_DAYS of the build. */
export const isNew = (id: string): boolean => newIds.has(id);

/** One sentence for the changes one commit made. */
function commitText(cs: Change[]): string {
  if (cs.length === 1) {
    const c = cs[0];
    if (c.kind === "batch" && c === launch()) {
      const models = c.tools.filter((id) => byId.get(id)?.kind === "model").length;
      return `The landscape launched with ${c.tools.length - models} tools${models ? ` and ${models} model providers` : ""}`;
    }
    return c.text;
  }
  const names = (xs: Change[]) => {
    const n = xs.map((c) => c.name ?? c.tool ?? "");
    return n.length > 3 ? `${n.slice(0, 2).join(", ")} and ${n.length - 2} more` : andList(n);
  };
  const updated = cs.filter((c) => c.kind === "updated");
  const same = updated.length === cs.length && cs.every((c) => whatChanged(c) === whatChanged(cs[0]));
  if (same) return `${names(cs)}: ${whatChanged(cs[0])}`;
  const added = cs.filter((c) => c.kind === "added");
  const parts = [
    added.length ? `${names(added)} added` : "",
    updated.length ? `${updated.length} ${updated.length === 1 ? "record" : "records"} updated` : "",
  ].filter(Boolean);
  return upper(parts.join("; ") || `${cs.length} records changed`);
}

function moveText(m: MarketMove): string {
  const name = nameOf(m.tool);
  return m.kind === "acquired" ? (m.acquirer ? `${name} acquired by ${m.acquirer}` : `${name} acquired`)
    : m.kind === "shut down" ? `${name} shut down` : `${name} reached end of life`;
}

/**
 * Changes grouped by commit, merged with the dated market moves, newest first. Undated moves are
 * left out: the timeline never invents a date. `limit` caps the number of entries.
 */
export function timeline(limit?: number): TimelineEntry[] {
  const byCommit = new Map<string, Change[]>();
  for (const c of landscape.changes) byCommit.set(c.commit, [...(byCommit.get(c.commit) ?? []), c]);
  const entries: TimelineEntry[] = [...byCommit.values()].map((cs) => ({
    kind: "changes", date: cs[0].date, commit: cs[0].commit, author: cs[0].author,
    requestedBy: cs.flatMap((c) => c.requestedBy).filter((r, i, a) => a.findIndex((o) => o.name === r.name && o.issue === r.issue) === i),
    text: commitText(cs), changes: cs,
  }));
  for (const m of marketMoves()) if (m.date) entries.push({ kind: "move", date: m.date, text: moveText(m), move: m });
  // Newest first; on the same date, a commit before a move, and later commits first.
  const order = entries.map((e, i) => ({ e, i }));
  order.sort((a, b) => b.e.date.localeCompare(a.e.date) ||
    (a.e.kind === b.e.kind ? b.i - a.i : a.e.kind === "changes" ? -1 : 1));
  const out = order.map((o) => o.e);
  return limit === undefined ? out : out.slice(0, limit);
}

// ---------- Freshness ----------

export const FRESHNESS_LABELS: Record<FreshnessBand, string> = {
  fresh: "Checked in the last 30 days", aging: "Checked in the last 90 days", stale: "Not checked in 90 days",
};

/** How many records sit in each freshness band. */
export function freshnessSummary(): { band: FreshnessBand; label: string; count: number }[] {
  const bands: FreshnessBand[] = ["fresh", "aging", "stale"];
  return bands.map((band) => ({
    band, label: FRESHNESS_LABELS[band],
    count: landscape.tools.filter((t) => t.freshness?.band === band).length,
  }));
}

/** Records whose oldest source read is furthest back, for "next to check" lists. */
export const leastRecentlyChecked = (n = 10): Tool[] =>
  landscape.tools.filter((t) => t.freshness)
    .sort((a, b) => a.freshness!.checked.localeCompare(b.freshness!.checked) || a.name.localeCompare(b.name))
    .slice(0, n);
