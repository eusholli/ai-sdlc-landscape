// The Stack X-ray: what a chosen set of tools covers, repeats, depends on and leaves unpublished.
// Client-safe: no data imports. The page passes the slim projections in as props.
import type { MarketMove, PhaseId, PricingBucket, RelationLite, XrayTool } from "@/lib/types";

export interface XrayReport {
  /** All phases, in the order given. A tool counts under every phase it covers. */
  coverage: { phase: PhaseId; tools: string[] }[];
  /** Phases with no selected tool. */
  gaps: PhaseId[];
  /** Phases that two or more selected tools name as their primary phase. */
  overlaps: { phase: PhaseId; tools: string[] }[];
  /** Tools that publish exactly one model. */
  singleModel: { tool: string; model: string }[];
  /** Tools that do not publish their models. */
  modelsUnpublished: string[];
  /** Tools acquired, shut down or retired, with the dated move when the data has one. */
  moved: { tool: string; status: string; move: MarketMove | null }[];
  pricing: Record<PricingBucket | "unpublished", string[]>;
  /** Relations with both ends in the selection. */
  links: RelationLite[];
  /** Selected tools with no link to another selected tool. */
  isolated: string[];
  /** Fields a vendor has not published, per tool. */
  unpublished: { tool: string; fields: string[] }[];
}

const PRICING: (PricingBucket | "unpublished")[] =
  ["free", "seat", "usage", "subscription", "enterprise", "other", "unpublished"];

const CHECKED = ["models", "pricingModel", "deployment", "customers"] as const;

export function buildXray(sel: XrayTool[], rels: RelationLite[], moves: MarketMove[], phaseIds: PhaseId[]): XrayReport {
  const ids = new Set(sel.map((t) => t.id));

  const coverage = phaseIds.map((phase) => ({
    phase,
    tools: sel.filter((t) => t.phases.includes(phase) || t.primaryPhase === phase).map((t) => t.id),
  }));

  const overlaps = phaseIds
    .map((phase) => ({ phase, tools: sel.filter((t) => t.primaryPhase === phase).map((t) => t.id) }))
    .filter((o) => o.tools.length >= 2);

  const singleModel = sel.flatMap((t) => (t.models?.length === 1 ? [{ tool: t.id, model: t.models[0] }] : []));

  const moved = sel.flatMap((t) =>
    t.status && t.status !== "preview"
      ? [{ tool: t.id, status: t.status, move: moves.find((m) => m.tool === t.id) ?? null }]
      : []);

  const pricing = Object.fromEntries(PRICING.map((b) => [b, [] as string[]])) as XrayReport["pricing"];
  for (const t of sel) pricing[t.pricingBucket ?? "unpublished"].push(t.id);

  const links = rels.filter((r) => ids.has(r.from) && ids.has(r.to));
  const linked = new Set(links.flatMap((r) => [r.from, r.to]));

  return {
    coverage,
    gaps: coverage.filter((c) => c.tools.length === 0).map((c) => c.phase),
    overlaps,
    singleModel,
    modelsUnpublished: sel.filter((t) => t.models === null).map((t) => t.id),
    moved,
    pricing,
    links,
    isolated: sel.filter((t) => !linked.has(t.id)).map((t) => t.id),
    unpublished: sel
      .map((t) => ({ tool: t.id, fields: CHECKED.filter((f) => t[f] === null) as string[] }))
      .filter((u) => u.fields.length > 0),
  };
}

export type LensGroup = "generation" | "per-change controls" | "control knowledge" | "run and operate" | "measure and platform";

/** Each phase read through the thesis: where it sits in the paper's account of what a team has to own. */
export const LENS: Record<PhaseId, LensGroup> = {
  plan: "control knowledge",
  understand: "control knowledge",
  design: "generation",
  code: "generation",
  maintain: "generation",
  review: "per-change controls",
  test: "per-change controls",
  security: "per-change controls",
  cicd: "run and operate",
  deploy: "run and operate",
  operate: "run and operate",
  measure: "measure and platform",
  platform: "measure and platform",
};

export const LENS_ORDER: LensGroup[] = ["generation", "per-change controls", "control knowledge", "run and operate", "measure and platform"];
