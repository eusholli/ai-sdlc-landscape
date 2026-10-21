import type { RelationType } from "@/lib/types";

/**
 * Curve colours reuse the validated stage and layer tokens, because the brief allows no other
 * hue for data. The legend names each type, so colour never works alone.
 */
export const RELATION_STYLE: Record<RelationType, { label: string; color: string }> = {
  integrates_with: { label: "Integrations", color: "var(--stage-1)" },
  competes_with: { label: "Competitors", color: "var(--stage-2)" },
  ships_inside: { label: "Ships inside", color: "var(--stage-3)" },
  partners_with: { label: "Partners", color: "var(--stage-4)" },
  acquired_by: { label: "Acquisitions", color: "var(--stage-5)" },
  built_on_model: { label: "Built on model", color: "var(--layer-infra)" },
};

export const RELATION_ORDER: readonly RelationType[] = [
  "integrates_with",
  "competes_with",
  "ships_inside",
  "partners_with",
  "acquired_by",
  "built_on_model",
];
