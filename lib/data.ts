// The one place that reads data/landscape.json. Server-only: the full file is 435 KB, so client
// components receive `toolsLite()` and `relationsLite()` as props from a server component, and the
// tool drawer fetches /data/tools/<id>.json. Do not import this file from a "use client" module.
import "server-only";

import raw from "@/data/landscape.json";
import phaseFile from "@/data/phases.json";
import { pricingBucket, searchLite } from "@/lib/filters";
import { DATA_LICENCE, DATA_LICENCE_URL, REPO_URL, SITE_URL } from "@/lib/site";
import type {
  Autonomy, Contributor, External, Landscape, Layer, LayerId, MarketMove, Phase, PhaseId, Relation,
  RelationLite, RelationType, Segment, SegmentId, Source, Tool, ToolHistory, ToolLite,
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
    history: history(n.history),
  };
}

const phaseData = phaseFile as unknown as { phases: Phase[]; layers: Layer[]; segments: Segment[] };

const landscape: Landscape = {
  generated: raw.generated,
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
};

const byId = new Map(landscape.tools.map((t) => [t.id, t]));
const externalById = new Map(landscape.externals.map((e) => [e.id, e]));

// ---------- Whole-dataset accessors ----------

export const getLandscape = (): Landscape => landscape;
export const phases = (): Phase[] => landscape.phases;
export const layers = (): Layer[] => landscape.layers;
export const segments = (): Segment[] => landscape.segments;
/** Every node: the tools plus the model providers. */
export const allTools = (): Tool[] => landscape.tools;
export const externals = (): External[] => landscape.externals;
export const relations = (): Relation[] => landscape.relations;
export const dataDate = (): string => landscape.generated;
/** Everyone whose request changed the data, in the order they first did. */
export const contributors = (): Contributor[] => landscape.contributors;

// ---------- Lookups ----------

export const toolById = (id: string): Tool | undefined => byId.get(id);

/** Display name for any relation endpoint: a tool, a model provider or an external company. */
export const nameOf = (id: string): string => byId.get(id)?.name ?? externalById.get(id)?.name ?? id;

/** True when the id is a node with its own page (tools and models), false for externals. */
export const hasPage = (id: string): boolean => byId.has(id);

// ---------- Selectors ----------

/**
 * Tools grouped under each phase column. A tool appears under its primary phase only; the
 * `phases` array drives the coverage strip and spanning bars, not duplicate tiles.
 * Layer nodes (agent infrastructure, models) are excluded: see `toolsByLayer`.
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
  const out: Record<LayerId, Tool[]> = { "agent-infra": [], model: [] };
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

/** Count of tools per phase (any coverage, not just primary) and segment, for the heatmap. */
export function coverageMatrix(): { phase: PhaseId; segment: SegmentId | "layer"; count: number }[] {
  const cells = new Map<string, number>();
  for (const t of landscape.tools) {
    if (t.kind !== "tool") continue;
    const seg = t.layer ? "layer" : t.segment ?? "point";
    for (const p of t.phases) cells.set(`${p}|${seg}`, (cells.get(`${p}|${seg}`) ?? 0) + 1);
  }
  return [...cells].map(([k, count]) => {
    const [phase, segment] = k.split("|");
    return { phase: phase as PhaseId, segment: segment as SegmentId | "layer", count };
  });
}

/** For each field, how many of the tools have it published. Drives the honesty panel. */
export function fieldCompleteness(): { field: keyof Tool; label: string; known: number; total: number }[] {
  const tools = landscape.tools.filter((t) => t.kind === "tool");
  const fields: [keyof Tool, string][] = [
    ["summary", "One-line claim"], ["targetBuyer", "Target buyer"], ["interface", "Interface"],
    ["customers", "Named customers"], ["pricingModel", "Pricing model"], ["entryPrice", "Entry price"],
    ["autonomy", "Autonomy"], ["deployment", "Deployment"], ["models", "Models"],
    ["traction", "Traction"], ["compliance", "Compliance"], ["gtmPartners", "Go-to-market partners"],
    ["openSource", "Open source"], ["founded", "Founded"], ["hq", "Headquarters"],
    ["headcountBand", "Headcount"], ["fundingTotal", "Funding total"], ["lastRound", "Last round"],
  ];
  return fields
    .map(([field, label]) => ({ field, label, known: tools.filter((t) => t[field] !== null).length, total: tools.length }))
    .sort((a, b) => b.known - a.known);
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
});

export const toolsLite = (): ToolLite[] => landscape.tools.map(toLite);
export const relationsLite = (): RelationLite[] => landscape.relations.map(({ from, to, type }) => ({ from, to, type }));
