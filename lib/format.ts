// Display helpers shared by every view. Client-safe.
import type { PhaseId } from "@/lib/types";
import { NOT_PUBLISHED } from "@/lib/filters";

/**
 * Thirteen phases are too many hues to tell apart, so colour encodes six lifecycle stages and
 * position plus label name the phase. Stage colours are CSS variables defined in globals.css
 * (--stage-1 .. --stage-6, --layer-infra, --layer-model), validated for light and dark surfaces
 * and for colour-vision deficiency. Never invent another hue for a phase.
 */
export const STAGES = [
  { id: 1, label: "Plan and design", phases: ["plan", "design"] },
  { id: 2, label: "Build", phases: ["code", "review"] },
  { id: 3, label: "Verify", phases: ["test", "security"] },
  { id: 4, label: "Ship", phases: ["cicd", "deploy"] },
  { id: 5, label: "Run", phases: ["operate", "maintain"] },
  { id: 6, label: "Understand and govern", phases: ["understand", "measure", "platform"] },
] as const satisfies readonly { id: number; label: string; phases: readonly PhaseId[] }[];

export type StageId = (typeof STAGES)[number]["id"];

export const stageOf = (phase: PhaseId): StageId =>
  STAGES.find((s) => (s.phases as readonly PhaseId[]).includes(phase))!.id;

/** CSS colour for a phase, e.g. style={{ background: phaseColor("code") }}. */
export const phaseColor = (phase: PhaseId | null): string =>
  phase ? `var(--stage-${stageOf(phase)})` : "var(--muted-foreground)";

export const layerColor = (layer: "agent-infra" | "model"): string =>
  layer === "agent-infra" ? "var(--layer-infra)" : "var(--layer-model)";

/** The text for any unpublished fact. Every view uses this; nothing renders an empty cell. */
export const notPublished = <T,>(v: T | null | undefined, render: (x: T) => string = String): string =>
  v === null || v === undefined ? NOT_PUBLISHED : render(v);

export const joinOrNotPublished = (v: string[] | null): string => (v && v.length ? v.join(", ") : NOT_PUBLISHED);

/** Two-letter monogram for a tool with no logo. */
export const monogram = (name: string): string => {
  const words = name.replace(/[^\p{L}\p{N} ]/gu, " ").split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "?").slice(0, 2)).toUpperCase();
};

export const hostOf = (url: string): string => {
  try { return new URL(url).host.replace(/^www\./, ""); } catch { return url; }
};

/** "2026-10-01" -> "1 Oct 2026"; "2025-09" -> "Sep 2025". */
export function formatDate(d: string): string {
  const [y, m, day] = d.split("-").map(Number);
  const month = new Date(Date.UTC(y, (m || 1) - 1, 1)).toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  return day ? `${day} ${month} ${y}` : m ? `${month} ${y}` : String(y);
}
