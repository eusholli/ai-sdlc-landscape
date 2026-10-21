// Canonical origin. NEXT_PUBLIC_SITE_URL wins; on Vercel the production domain is the fallback,
// so previews still emit production URLs in the sitemap and share tags.
const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? (vercel ? `https://${vercel}` : "http://localhost:3000")
).replace(/\/$/, "");

export const CORRECTION_URL = "https://github.com/eusholli/ai-sdlc-landscape/issues/new?template=correction.yml";
