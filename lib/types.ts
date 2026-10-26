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
  /** The vendor's main GitHub repository, set for every open-source tool. */
  repo: string | null;
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
  /** How recently every source was checked. Null when the record has no sources. */
  freshness: Freshness | null;
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
  /** People whose issues asked for the changes to this record, oldest first. */
  requestedBy: RequestCredit[];
}

/**
 * fresh: every source read within 30 days of the build. aging: within 90. stale: older. It
 * measures our checking, not the tool.
 */
export type FreshnessBand = "fresh" | "aging" | "stale";

export interface Freshness {
  /** YYYY-MM-DD of the oldest source read: every source was checked on or after it. */
  checked: string;
  /** Share of the record's sources read within 90 days of the build, 0 to 1. */
  share90: number;
  band: FreshnessBand;
}

/** A request for change that was accepted: who asked, and the issue they asked in. */
export interface RequestCredit {
  name: string;
  issue: number;
}

/** Someone whose requests changed the data, with every issue that did, in order of first change. */
export interface Contributor {
  name: string;
  issues: number[];
  /** YYYY-MM-DD of their first accepted request. */
  first: string;
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
  /** Added on its own (not in the first import) within the last 30 days. */
  isNew: boolean;
  freshness: FreshnessBand | null;
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

/** One change to one record, from git. Field names are the record's own YAML keys. */
export interface Change {
  kind: "batch" | "added" | "updated" | "renamed" | "removed";
  /** YYYY-MM-DD the commit was authored. */
  date: string;
  commit: string;
  /** Who made the commit. Names only. */
  author: string;
  requestedBy: RequestCredit[];
  /** The record's id after the change; null for a batch. */
  tool: string | null;
  /** The record's name at the time, so a removed record still reads. */
  name: string | null;
  /** A batch: the ids it added. */
  tools: string[];
  /** A rename: the old id. */
  from: string | null;
  /** Fields whose value changed. Those also in `published` had no value before. */
  fields: string[];
  published: string[];
  relationsAdded: { type: RelationType; to: string }[];
  relationsRemoved: { type: RelationType; to: string }[];
  /** The new status text when the status changed; undefined when it did not. */
  status?: string | null;
  /** One plain sentence, e.g. "Cursor: entry price now published". */
  text: string;
}

/**
 * One entry on the timeline: the changes one commit made, or a dated market move. Newest first.
 * A move's date may be a year and month only, as the status text gives it.
 */
export type TimelineEntry =
  | { kind: "changes"; date: string; commit: string; author: string; requestedBy: RequestCredit[];
      /** One sentence for the whole commit, e.g. "Repository now published for 20 tools". */
      text: string; changes: Change[] }
  | { kind: "move"; date: string; text: string; move: MarketMove };

export interface Landscape {
  /** Date of the newest source read, YYYY-MM-DD. With `commit`, the version of the dataset. */
  generated: string;
  /** YYYY-MM-DD the site was built. Freshness and "new" are measured from it. */
  built: string;
  /** Full SHA of the commit the data was built from, or null when built outside git. */
  commit: string | null;
  /** SPDX id of the data licence. */
  licence: string;
  licenceUrl: string;
  repository: string;
  /** URL of the JSON Schema for one record in data/tools/. */
  schema: string;
  description: string;
  phases: Phase[];
  layers: Layer[];
  segments: Segment[];
  tools: Tool[];
  externals: External[];
  relations: Relation[];
  contributors: Contributor[];
  /** Every counted change to the records, oldest first. */
  changes: Change[];
}

