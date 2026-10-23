import { CircleAlert, CircleCheck, Clock, type LucideIcon } from "lucide-react";
import type { FreshnessBand } from "@/lib/types";

export const BAND_WORD: Record<FreshnessBand, string> = {
  fresh: "Fresh",
  aging: "Aging",
  stale: "Stale",
};

export const BAND_ICON: Record<FreshnessBand, LucideIcon> = {
  fresh: CircleCheck,
  aging: Clock,
  stale: CircleAlert,
};

/** Neutral shades, darkest for freshest. Freshness never borrows a stage colour. */
export const BAND_SHADE: Record<FreshnessBand, string> = {
  fresh: "bg-foreground/80",
  aging: "bg-foreground/45",
  stale: "bg-foreground/20",
};
