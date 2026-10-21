export type ZoomLevel = "overview" | "logos" | "cards";

export const OVERVIEW_BELOW = 0.6;
export const CARDS_ABOVE = 1.4;

export const zoomLevelFor = (scale: number): ZoomLevel =>
  scale < OVERVIEW_BELOW ? "overview" : scale > CARDS_ABOVE ? "cards" : "logos";
