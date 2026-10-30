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

/** The id of the form's one text field. GitHub fills a form field from the query parameter of the same name. */
export const REQUEST_FIELD = "request";

/** GitHub refuses a new-issue link much longer than this, so a prefilled request stays under it. */
export const REQUEST_URL_MAX = 8000;

/**
 * The request form with its title, and optionally its text, filled in: requestUrl("Cursor") for a
 * change to Cursor, requestUrl("Cursor", "…") for a whole request a chatbot hands to the person to submit.
 */
export const requestUrl = (subject?: string, body?: string) =>
  (subject ? `${REQUEST_URL}&title=${encodeURIComponent(`${subject}: `)}` : REQUEST_URL) +
  (body ? `&${REQUEST_FIELD}=${encodeURIComponent(body)}` : "");

export const DATA_LICENCE = "CC-BY-4.0";
export const DATA_LICENCE_URL = "https://creativecommons.org/licenses/by/4.0/";

/** The thesis as a PDF, in public/. The name carries no version, so links outlive each new draft. */
export const PAPER_PDF_PATH = "/software-ownership.pdf";
