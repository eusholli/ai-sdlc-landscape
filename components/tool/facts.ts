import { AUTONOMY_LABELS } from "@/lib/filters";
import { joinOrNotPublished, notPublished } from "@/lib/format";
import type { Source, Tier, Tool } from "@/lib/types";

/** What every unknown fact reads. Compare against this to mute the value. */
export const UNKNOWN = notPublished(null);

export interface Fact {
  label: string;
  /** The `field` name the data uses for this fact's sources. */
  field: string;
  /** Long values take the full row. */
  wide?: boolean;
  value: (t: Tool) => string;
}

export const FACTS: Fact[] = [
  { label: "Customers", field: "customers", wide: true, value: (t) => joinOrNotPublished(t.customers) },
  { label: "Traction", field: "traction", wide: true, value: (t) => notPublished(t.traction) },
  { label: "Go-to-market partners", field: "gtm_partners", wide: true, value: (t) => joinOrNotPublished(t.gtmPartners) },
  { label: "Pricing model", field: "pricing_model", wide: true, value: (t) => notPublished(t.pricingModel) },
  { label: "Entry price", field: "entry_price", value: (t) => notPublished(t.entryPrice) },
  { label: "Deployment", field: "deployment", value: (t) => joinOrNotPublished(t.deployment) },
  { label: "Models", field: "models", wide: true, value: (t) => joinOrNotPublished(t.models) },
  { label: "Open source", field: "open_source", value: (t) => (t.openSource ? "Yes" : UNKNOWN) },
  { label: "Repository", field: "repo", value: (t) => notPublished(t.repo, (r) => r.replace(/^https:\/\//, "")) },
  { label: "Compliance", field: "compliance", wide: true, value: (t) => joinOrNotPublished(t.compliance) },
  { label: "Interface", field: "interface", value: (t) => joinOrNotPublished(t.interface) },
  { label: "Target buyer", field: "target_buyer", value: (t) => joinOrNotPublished(t.targetBuyer) },
  { label: "Autonomy", field: "autonomy", value: (t) => notPublished(t.autonomy, (a) => AUTONOMY_LABELS[a]) },
  { label: "Founded", field: "founded", value: (t) => notPublished(t.founded) },
  { label: "Headquarters", field: "hq", value: (t) => notPublished(t.hq) },
  { label: "Headcount", field: "headcount_band", value: (t) => notPublished(t.headcountBand) },
  { label: "Funding total", field: "funding_total", value: (t) => notPublished(t.fundingTotal) },
  { label: "Last round", field: "last_round", value: (t) => notPublished(t.lastRound) },
];

const EXTRA_FIELD_LABELS: Record<string, string> = {
  summary: "One-line claim",
  status: "Status",
  relations: "Relations",
  url: "Website",
  logo_url: "Logo",
};

const FACT_FIELD_LABELS = Object.fromEntries(FACTS.map((f) => [f.field, f.label]));

export function fieldLabel(field: string): string {
  const known = FACT_FIELD_LABELS[field] ?? EXTRA_FIELD_LABELS[field];
  if (known) return known;
  const words = field.replace(/[_-]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export const TIER_LABELS: Record<Tier, string> = {
  A: "vendor page",
  B: "press or analyst",
  C: "secondary",
};

export interface SourceGroup {
  field: string;
  sources: Source[];
}

/** Sources grouped by the field they back, in order of first appearance, one entry per URL. */
export function groupSources(sources: Source[]): SourceGroup[] {
  const groups = new Map<string, SourceGroup>();
  for (const s of sources) {
    const group = groups.get(s.field) ?? { field: s.field, sources: [] };
    if (!group.sources.some((x) => x.url === s.url)) group.sources.push(s);
    groups.set(s.field, group);
  }
  return [...groups.values()];
}

export const sourceAnchor = (toolId: string, field: string): string => `src-${toolId}-${field}`;
