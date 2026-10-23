// Facets, filtering and search over ToolLite. Client-safe: imports types only, never the data.
// URL state uses nuqs (parsers from "nuqs/server", which is safe on client and server);
// `filterParsers` is the single list of query keys the site understands.
import { parseAsArrayOf, parseAsBoolean, parseAsString, parseAsStringLiteral } from "nuqs/server";
import type { PhaseId, PricingBucket, ToolLite } from "@/lib/types";

// ---------- Buckets ----------

/** Fold 48 free-text pricing models into six facet buckets. Order matters: first match wins. */
export function pricingBucket(model: string | null): PricingBucket | null {
  if (!model) return null;
  const m = model.toLowerCase();
  if (/^free|open source/.test(m)) return "free";
  if (/^quote|annual contract|by engineering org|per application/.test(m)) return "enterprise";
  if (/^(seat|per contributor|per active user|platform fee plus seats)/.test(m)) return "seat";
  if (/^subscription|^add-on|included in/.test(m)) return "subscription";
  if (/^usage|^per (fix|resolution|test run)|by lines of code|flat platform fee/.test(m)) return "usage";
  return "other";
}

export const PRICING_LABELS: Record<PricingBucket, string> = {
  free: "Free or open source",
  seat: "Per seat",
  usage: "Usage based",
  subscription: "Subscription",
  enterprise: "Quote or contract",
  other: "Other",
};

export type DeploymentBucket = "saas" | "private" | "self-hosted" | "air-gapped" | "local";

export const DEPLOYMENT_LABELS: Record<DeploymentBucket, string> = {
  saas: "SaaS",
  private: "Private cloud, VPC or single tenant",
  "self-hosted": "Self-hosted or on-prem",
  "air-gapped": "Air-gapped",
  local: "Runs locally",
};

/** Map each published deployment option to the buckets it satisfies. */
export function deploymentBuckets(values: string[] | null): DeploymentBucket[] | null {
  if (!values) return null;
  const out = new Set<DeploymentBucket>();
  for (const raw of values) {
    const v = raw.toLowerCase();
    if (/saas|hybrid/.test(v)) out.add("saas");
    if (/private|vpc|byoc|single-tenant|dedicated|regulated|multi-cloud|cloud providers/.test(v)) out.add("private");
    if (/self-hosted|self-managed|on-prem|server|edge/.test(v)) out.add("self-hosted");
    if (/air-gapped/.test(v)) out.add("air-gapped");
    if (/^local$/.test(v)) out.add("local");
  }
  return out.size ? [...out] : null;
}

export const SUB_KIND_LABELS: Record<string, string> = {
  "ide-assistant": "IDE assistant",
  "cli-agent": "CLI agent",
  "autonomous-agent": "Autonomous agent",
  "app-builder": "App builder",
};

export const AUTONOMY_LABELS = { agent: "Agent (human in the loop)", autonomous: "Autonomous" } as const;

export const NOT_PUBLISHED = "Not published";

// ---------- URL state ----------

const SEGMENTS = ["full-lifecycle", "multi-phase", "point"] as const;
const VIEWS = ["map", "network", "list"] as const;

/** Every query key the site reads. Use with nuqs `useQueryStates(filterParsers)`. */
export const filterParsers = {
  q: parseAsString.withDefault(""),
  phase: parseAsArrayOf(parseAsString).withDefault([]),
  segment: parseAsArrayOf(parseAsStringLiteral(SEGMENTS)).withDefault([]),
  kind: parseAsArrayOf(parseAsString).withDefault([]), // sub-kind
  pricing: parseAsArrayOf(parseAsString).withDefault([]),
  deploy: parseAsArrayOf(parseAsString).withDefault([]),
  autonomy: parseAsArrayOf(parseAsString).withDefault([]),
  iface: parseAsArrayOf(parseAsString).withDefault([]),
  buyer: parseAsArrayOf(parseAsString).withDefault([]),
  oss: parseAsBoolean.withDefault(false),
  moved: parseAsBoolean.withDefault(false), // only acquired or shut down
  recent: parseAsBoolean.withDefault(false), // only tools added in the last 30 days
  layers: parseAsBoolean.withDefault(true), // show agent-infra and model bands
  view: parseAsStringLiteral(VIEWS).withDefault("map"),
  tool: parseAsString, // open drawer
  compare: parseAsArrayOf(parseAsString).withDefault([]),
  xray: parseAsArrayOf(parseAsString).withDefault([]),
};

export interface Filters {
  q: string;
  phase: string[];
  segment: string[];
  kind: string[];
  pricing: string[];
  deploy: string[];
  autonomy: string[];
  iface: string[];
  buyer: string[];
  oss: boolean;
  moved: boolean;
  recent: boolean;
}

/** The value a facet reads from a tool. null means "Not published", which is its own bucket. */
type FacetKey = "phase" | "segment" | "kind" | "pricing" | "deploy" | "autonomy" | "iface" | "buyer";
const NP = "__none";

function facetValues(t: ToolLite, key: FacetKey): string[] {
  const v = (() => {
    switch (key) {
      case "phase": return t.phases.length ? t.phases : null;
      case "segment": return t.segment ? [t.segment] : null;
      case "kind": return t.subKind ? [t.subKind] : null;
      case "pricing": return t.pricingBucket ? [t.pricingBucket] : null;
      case "deploy": return deploymentBuckets(t.deployment);
      case "autonomy": return t.autonomy ? [t.autonomy] : null;
      case "iface": return t.interface;
      case "buyer": return t.targetBuyer;
    }
  })();
  return v && v.length ? v : [NP];
}

/** The id used in the URL for the "Not published" bucket of any facet. */
export const NOT_PUBLISHED_ID = NP;

function matchesFacets(t: ToolLite, f: Filters, skip?: FacetKey): boolean {
  const keys: FacetKey[] = ["phase", "segment", "kind", "pricing", "deploy", "autonomy", "iface", "buyer"];
  for (const k of keys) {
    if (k === skip || !f[k].length) continue;
    const vals = facetValues(t, k);
    if (!f[k].some((x) => vals.includes(x))) return false;
  }
  if (f.oss && !t.openSource) return false;
  if (f.moved && !t.moved) return false;
  if (f.recent && !t.isNew) return false;
  return true;
}

/** Tools passing every active filter and the text query. */
export function applyFilters(tools: ToolLite[], f: Filters): ToolLite[] {
  const hits = f.q ? new Set(searchLite(tools, f.q).map((t) => t.id)) : null;
  return tools.filter((t) => matchesFacets(t, f) && (!hits || hits.has(t.id)));
}

/**
 * Option counts for one facet, computed with every other facet applied (so counts show what
 * selecting an option would yield). Includes the "Not published" bucket when it is non-empty.
 */
export function facetCounts(tools: ToolLite[], f: Filters, key: FacetKey): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const t of tools) {
    if (!matchesFacets(t, f, key)) continue;
    for (const v of facetValues(t, key)) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts].map(([value, count]) => ({ value, count })).sort((a, b) =>
    a.value === NP ? 1 : b.value === NP ? -1 : b.count - a.count);
}

export const isFiltered = (f: Filters): boolean =>
  !!f.q || f.oss || f.moved || f.recent ||
  (["phase", "segment", "kind", "pricing", "deploy", "autonomy", "iface", "buyer"] as const).some((k) => f[k].length > 0);

// ---------- Search ----------

export type SearchHit = ToolLite & { matched: "name" | "company" | "customer" | "summary"; match: string };

/**
 * Rank tools for a query: name, then company, then a named customer, then the claim. Case and
 * accent insensitive. Returns each tool once with the strongest reason it matched.
 */
export function searchLite(tools: ToolLite[], query: string): SearchHit[] {
  const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const q = norm(query.trim());
  if (!q) return [];
  const hits: (SearchHit & { score: number })[] = [];
  for (const t of tools) {
    const name = norm(t.name);
    if (name.startsWith(q) || name.includes(q)) {
      hits.push({ ...t, matched: "name", match: t.name, score: name.startsWith(q) ? 0 : 1 });
      continue;
    }
    if (norm(t.company).includes(q)) { hits.push({ ...t, matched: "company", match: t.company, score: 2 }); continue; }
    const c = t.customers?.find((x) => norm(x).includes(q));
    if (c) { hits.push({ ...t, matched: "customer", match: c, score: 3 }); continue; }
    if (t.summary && norm(t.summary).includes(q)) hits.push({ ...t, matched: "summary", match: t.summary, score: 4 });
  }
  return hits.sort((a, b) => a.score - b.score || a.name.localeCompare(b.name)).map(({ score: _s, ...h }) => h);
}

export const PHASE_ORDER: PhaseId[] = [
  "plan", "design", "code", "review", "test", "security", "cicd",
  "deploy", "operate", "maintain", "understand", "measure", "platform",
];
