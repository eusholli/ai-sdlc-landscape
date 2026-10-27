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

export interface MarkBar { x: number; y: number; width: number; height: number; color: string }

/**
 * The site mark from `SiteName`: six bars, 3 units wide with 1 unit between, 8 to 18 units tall,
 * in the stage colours. Laid out centred in a square of `size`, inside `padding` on every side.
 */
export function markBars(size: number, padding = size / 16): MarkBar[] {
  const unit = (size - 2 * padding) / 23;
  const bottom = (size + 18 * unit) / 2;
  return [1, 2, 3, 4, 5, 6].map((id) => {
    const height = (6 + id * 2) * unit;
    return { x: padding + (id - 1) * 4 * unit, y: bottom - height, width: 3 * unit, height, color: STAGE_HEX[id] };
  });
}

/** The mark as an SVG document, for the browser tab icon. */
export function markSvg(size = 32): string {
  const r = (n: number) => Math.round(n * 100) / 100;
  const rects = markBars(size)
    .map((b) => `<rect x="${r(b.x)}" y="${r(b.y)}" width="${r(b.width)}" height="${r(b.height)}" rx="${r(b.width / 3)}" fill="${b.color}"/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${rects}</svg>`;
}

export const truncate = (text: string, max: number): string =>
  text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}\u2026`;
