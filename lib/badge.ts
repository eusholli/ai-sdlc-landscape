// The "Listed on AI SDLC Landscape" badge a vendor can put on its own site, served as a static
// SVG at /badge/<id>.svg. Client-safe and pure, so it is tested without the data.

// The badge sits on other people's pages, so it cannot read the site's CSS variables. These are
// the light-theme stage colours from app/globals.css; keep the two in step.
export const BADGE_COLOURS = {
  1: "#2a78d6", 2: "#eb6834", 3: "#1baf7a", 4: "#eda100", 5: "#e87ba4", 6: "#008300",
  "agent-infra": "#6250d6", model: "#6b6a65", systems: "#6b6a65",
} as const;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Verdana-ish average glyph width at 11px. Close enough for a badge; long names get room to spare.
const width = (s: string) => Math.ceil(s.length * 6.6) + 20;

/** The badge for one tool: a dark label, then the tool's name beside a dot in its stage colour. */
export function badgeSvg(name: string, colour: string): string {
  const label = "Listed on AI SDLC Landscape";
  const lw = width(label), rw = width(name) + 14, w = lw + rw;
  const title = `${name} is listed on AI SDLC Landscape`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${esc(title)}">`,
    `<title>${esc(title)}</title>`,
    `<clipPath id="r"><rect width="${w}" height="20" rx="4"/></clipPath>`,
    `<g clip-path="url(#r)">`,
    `<rect width="${lw}" height="20" fill="#24292f"/>`,
    `<rect x="${lw}" width="${rw}" height="20" fill="#f6f8fa"/>`,
    `<rect x="0.5" y="0.5" width="${w - 1}" height="19" rx="3.5" fill="none" stroke="#d0d7de"/>`,
    `</g>`,
    `<g font-family="Verdana,DejaVu Sans,sans-serif" font-size="11">`,
    `<text x="10" y="14" fill="#ffffff">${esc(label)}</text>`,
    `<circle cx="${lw + 11}" cy="10" r="4" fill="${colour}"/>`,
    `<text x="${lw + 20}" y="14" fill="#1f2328">${esc(name)}</text>`,
    `</g>`,
    `</svg>`,
    "",
  ].join("");
}
