// Share images render outside the browser, so CSS variables are unavailable. These hex values
// mirror --stage-1 to --stage-6 in globals.css (light theme) and must change with them.
import { stageOf } from "@/lib/format";
import type { PhaseId } from "@/lib/types";

export const STAGE_HEX: Record<number, string> = {
  1: "#2a78d6",
  2: "#eb6834",
  3: "#1baf7a",
  4: "#eda100",
  5: "#e87ba4",
  6: "#008300",
};

export const OG_COLORS = {
  background: "#fafaf8",
  ink: "#171717",
  muted: "#5c5b57",
  track: "#e4e3de",
};

export const OG_SIZE = { width: 1200, height: 630 };

export const phaseHex = (phase: PhaseId): string => STAGE_HEX[stageOf(phase)];

export const truncate = (text: string, max: number): string =>
  text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}\u2026`;
