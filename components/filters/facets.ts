import {
  AUTONOMY_LABELS,
  DEPLOYMENT_LABELS,
  NOT_PUBLISHED_ID,
  PRICING_LABELS,
  SUB_KIND_LABELS,
} from "@/lib/filters";
import type { Phase, Segment } from "@/lib/types";

export type FacetKey = "phase" | "segment" | "kind" | "pricing" | "deploy" | "autonomy" | "iface" | "buyer";

export interface FacetDef {
  key: FacetKey;
  label: string;
  optionLabel: (value: string) => string;
  /** When set, options follow this order instead of descending count. */
  order?: string[];
}

export interface FacetOption {
  value: string;
  count: number;
}

const fromRecord = (labels: Record<string, string>) => (value: string) => labels[value] ?? value;

const sentenceCase = (value: string): string => {
  const spaced = value.replace(/-/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

export function buildFacets(phases: Phase[], segments: Segment[]): FacetDef[] {
  const phaseLabels = Object.fromEntries(phases.map((p) => [p.id, p.label]));
  const segmentLabels = Object.fromEntries(segments.map((s) => [s.id, s.label]));
  return [
    {
      key: "phase",
      label: "Phase",
      optionLabel: fromRecord(phaseLabels),
      order: [...phases].sort((a, b) => a.order - b.order).map((p) => p.id),
    },
    { key: "segment", label: "Segment", optionLabel: fromRecord(segmentLabels) },
    { key: "kind", label: "Kind", optionLabel: (v) => SUB_KIND_LABELS[v] ?? sentenceCase(v) },
    { key: "pricing", label: "Pricing", optionLabel: fromRecord(PRICING_LABELS) },
    { key: "deploy", label: "Deployment", optionLabel: fromRecord(DEPLOYMENT_LABELS) },
    { key: "autonomy", label: "Autonomy", optionLabel: fromRecord(AUTONOMY_LABELS) },
    { key: "iface", label: "Interface", optionLabel: (v) => v },
    { key: "buyer", label: "Buyer", optionLabel: (v) => v },
  ];
}

export const isNotPublished = (value: string): boolean => value === NOT_PUBLISHED_ID;

export const labelFor = (def: FacetDef, value: string): string =>
  isNotPublished(value) ? "Not published" : def.optionLabel(value);

/** Counts from `facetCounts`, plus any selected value that currently has none, so it can be unticked. */
export function mergeOptions(def: FacetDef, counted: FacetOption[], selected: string[]): FacetOption[] {
  const present = new Set(counted.map((o) => o.value));
  const merged = [...counted, ...selected.filter((v) => !present.has(v)).map((value) => ({ value, count: 0 }))];
  const rank = (value: string): number => {
    if (isNotPublished(value)) return Number.MAX_SAFE_INTEGER;
    const index = def.order?.indexOf(value) ?? -1;
    return index === -1 ? Number.MAX_SAFE_INTEGER - 1 : index;
  };
  if (def.order) return merged.sort((a, b) => rank(a.value) - rank(b.value));
  return [...merged.filter((o) => !isNotPublished(o.value)), ...merged.filter((o) => isNotPublished(o.value))];
}

/** Resets every filter the bar controls. Leaves view, tool, layers and compare alone. */
export const CLEAR_ALL_FILTERS = {
  q: null,
  phase: null,
  segment: null,
  kind: null,
  pricing: null,
  deploy: null,
  autonomy: null,
  iface: null,
  buyer: null,
  oss: null,
  moved: null,
  recent: null,
} as const;
