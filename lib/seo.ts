// Titles, descriptions and the shared Open Graph fields for search engines and link previews.
// Pure: callers pass the tool and the label of the phase or layer it sits in.
import type { Metadata } from "next";

/** Shared by every page. Next replaces `openGraph` whole, so a page that sets its own spreads this. */
export const OPEN_GRAPH = {
  siteName: "AI SDLC Landscape",
  locale: "en",
  type: "website",
} satisfies Metadata["openGraph"];

/** Room for the page's own part, before the layout's " | AI SDLC Landscape". */
export const TITLE_MAX = 45;
/** Search engines cut descriptions at about this length. */
export const DESCRIPTION_MAX = 160;

interface Named {
  name: string;
  company: string;
}

const byCompany = (t: Named) =>
  t.company.toLowerCase().startsWith(t.name.toLowerCase()) || t.name.toLowerCase().startsWith(t.company.toLowerCase())
    ? t.name
    : `${t.name} by ${t.company}`;

/** What people search for beside a tool's name, each claimed only when the page holds it. */
export interface TitleFacets {
  /** The record publishes a pricing model or an entry price. */
  pricing: boolean;
  /** The page lists other tools in the same main phase. */
  alternatives: boolean;
  /** The record lists at least one integration. */
  integrations: boolean;
}

const FACETS = ["pricing", "alternatives", "integrations"] as const;
const andList = (w: readonly string[]) => (w.length < 2 ? w.join("") : `${w.slice(0, -1).join(", ")} and ${w.at(-1)}`);

/**
 * "Cursor pricing, alternatives and integrations", the words a search uses, dropping facets from
 * the end to fit. With no facet the page holds, "Cursor by Anysphere: Write code", shortened to
 * fit, never "Replit by Replit".
 */
export function toolTitle(t: Named, placeLabel: string | null, facets?: TitleFacets): string {
  const words = facets ? FACETS.filter((f) => facets[f]) : [];
  for (let n = words.length; n > 0; n--) {
    const title = `${t.name} ${andList(words.slice(0, n))}`;
    if (title.length <= TITLE_MAX) return title;
  }
  const base = byCompany(t);
  const full = placeLabel ? `${base}: ${placeLabel}` : base;
  if (full.length <= TITLE_MAX) return full;
  return base.length <= TITLE_MAX ? base : t.name;
}

/** The vendor's claim as published, then where it sits on the map when that still fits. */
export function toolDescription(t: Named & { summary: string | null }, placeLabel: string | null): string {
  const place = placeLabel ? `Listed under ${placeLabel}` : "Listed";
  if (!t.summary) return `${byCompany(t)}. ${place}, with sourced facts. The vendor has not published a one-line claim.`;
  const tail = `${place}, with sourced facts.`;
  return t.summary.length + 1 + tail.length <= DESCRIPTION_MAX ? `${t.summary} ${tail}` : t.summary;
}
