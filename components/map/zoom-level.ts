export type ZoomLevel = "overview" | "logos" | "cards";

export const OVERVIEW_BELOW = 0.6;
export const CARDS_ABOVE = 1.4;

export const zoomLevelFor = (scale: number): ZoomLevel =>
  scale < OVERVIEW_BELOW ? "overview" : scale > CARDS_ABOVE ? "cards" : "logos";

/** The scale each step of the level indicator zooms to. Each sits well inside its own range. */
export const ZOOM_LEVELS: readonly { id: ZoomLevel; label: string; scale: number }[] = [
  { id: "overview", label: "Overview", scale: 0.4 },
  { id: "logos", label: "Logos", scale: 1 },
  { id: "cards", label: "Cards", scale: 1.8 },
];
