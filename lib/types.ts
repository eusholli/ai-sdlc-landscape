// The data contract for the AI SDLC landscape. Hand-written and guarded: UI code reads these
// types and never reshapes the raw JSON itself.
//
// Convention: `null` means the vendor has not published this fact. Render it with
// `notPublished()` from lib/format.ts, never as an empty cell.

export type PhaseId =
  | "plan" | "design" | "code" | "review" | "test" | "security" | "cicd"
  | "deploy" | "operate" | "maintain" | "understand" | "measure" | "platform";

export type LayerId = "agent-infra" | "model";
export type SegmentId = "full-lifecycle" | "multi-phase" | "point";
export type Autonomy = "agent" | "autonomous";
export type RelationType =
  | "integrates_with" | "competes_with" | "ships_inside" | "built_on_model" | "acquired_by" | "partners_with";
export type Tier = "A" | "B" | "C";

export interface Phase {
  id: PhaseId;
  order: number;
  label: string;
  description: string;
}

export interface Layer {
  id: LayerId;
  label: string;
  description: string;
}

export interface Segment {
  id: SegmentId;
  label: string;
  description: string;
}

export interface Source {
  /** Which field this URL backs, e.g. "customers" or "relations". */
  field: string;
  url: string;
  /** A: the vendor's own page. B: reputable press or analyst. C: secondary. */
  tier: Tier;
  retrieved: string;
}

/** Everything the site knows about one tool or model provider. */
export interface Tool {
  id: string;
  kind: "tool" | "model";
  name: string;
  company: string;
  url: string;
  /** Local path under /logos, or null: draw a monogram. */
  logo: string | null;
  /** Set for cross-cutting nodes drawn as bands under the phase columns. */
  layer: LayerId | null;
  primaryPhase: PhaseId | null;
  phases: PhaseId[];
  segment: SegmentId | null;
  subKind: string | null;
  targetBuyer: string[] | null;
  interface: string[] | null;
  autonomy: Autonomy | null;
  /** The vendor's own one-line claim, quoted. */
  summary: string | null;
  customers: string[] | null;
  traction: string | null;
  gtmPartners: string[] | null;
  pricingModel: string | null;
  /** pricingModel folded into a small set of facet buckets. */
  pricingBucket: PricingBucket | null;
  entryPrice: string | null;
  deployment: string[] | null;
  models: string[] | null;
  /** true when published as open source; null when not stated (never false in the data). */
  openSource: true | null;
  compliance: string[] | null;
  founded: number | null;
  hq: string | null;
  headcountBand: string | null;
  fundingTotal: string | null;
  lastRound: string | null;
  /** Free text such as "acquired (by Atlassian, Sept 2025)", or null when trading normally. */
  status: string | null;
  sources: Source[];
  lastVerified: string;
  /** From git: who added the record and who last changed it. Null before its first commit. */
  history: ToolHistory | null;
}

/** Dates are YYYY-MM-DD; commits are full SHAs on the public repo. Names only, never emails. */
export interface ToolHistory {
  added: string;
  addedBy: string;
  addedCommit: string;
  edited: string;
  editedBy: string;
  editedCommit: string;
}

export type PricingBucket = "free" | "seat" | "usage" | "subscription" | "enterprise" | "other";

/** The slim projection client components receive. No sources, no long lists. */
export interface ToolLite {
  id: string;
  kind: "tool" | "model";
  name: string;
  company: string;
  logo: string | null;
  layer: LayerId | null;
  primaryPhase: PhaseId | null;
  phases: PhaseId[];
  segment: SegmentId | null;
  subKind: string | null;
  summary: string | null;
  autonomy: Autonomy | null;
  openSource: true | null;
  pricingBucket: PricingBucket | null;
  deployment: string[] | null;
  interface: string[] | null;
  targetBuyer: string[] | null;
  /** Customer names, kept so the search palette can find a tool by who uses it. */
  customers: string[] | null;
  /** True when status records an acquisition or shutdown. */
  moved: boolean;
}

/** Companies and platforms that tools relate to but which are not tools in the census. */
export interface External {
  id: string;
  kind: "external";
  name: string;
}

export interface Relation {
  from: string;
  to: string;
  type: RelationType;
  sources: string[];
}

export type RelationLite = Omit<Relation, "sources">;

export interface MarketMove {
  tool: string;
  kind: "acquired" | "shut down" | "end of life";
  /** Display name of the buyer, or null when the data does not name one. */
  acquirer: string | null;
  /** ISO date or year-month, parsed from the status text only. null when undated. */
  date: string | null;
  status: string;
  sources: string[];
}

export interface Landscape {
  generated: string;
  description: string;
  phases: Phase[];
  layers: Layer[];
  segments: Segment[];
  tools: Tool[];
  externals: External[];
  relations: Relation[];
}
