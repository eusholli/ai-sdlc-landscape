/** The production domain. */
export const SITE_DOMAIN = "aisdlclandscape.org";

// Canonical origin. NEXT_PUBLIC_SITE_URL wins; on Vercel the production domain is the fallback,
// so previews still emit production URLs in the sitemap and share tags.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL ? `https://${SITE_DOMAIN}` : "http://localhost:3000")
).replace(/\/$/, "");

/** The public repo: code, data and the issue tracker where every request for change goes. */
export const REPO = "eusholli/ai-sdlc-landscape";
export const REPO_URL = `https://github.com/${REPO}`;

/** The one issue form, plain words only. */
export const REQUEST_URL = `${REPO_URL}/issues/new?template=request.yml`;

/** The request form with its title filled in, e.g. requestUrl("Cursor") for a change to Cursor. */
export const requestUrl = (subject?: string) =>
  subject ? `${REQUEST_URL}&title=${encodeURIComponent(`${subject}: `)}` : REQUEST_URL;

export const DATA_LICENCE = "CC-BY-4.0";
export const DATA_LICENCE_URL = "https://creativecommons.org/licenses/by/4.0/";
