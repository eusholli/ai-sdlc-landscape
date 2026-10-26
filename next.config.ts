import type { NextConfig } from "next";
import { PAPER_PDF_PATH, SITE_URL } from "./lib/site";

/**
 * Pages that were live and indexed, and now live elsewhere. Old links, search results and feed
 * entries still land on the right view. Next keeps the source's query string, so
 * `/compare?compare=a,b` arrives as `/analyze?tab=compare&compare=a,b`.
 */
export const REDIRECTS = [
  { source: "/moves", destination: "/?view=moves" },
  { source: "/compare", destination: "/analyze?tab=compare" },
  // The X-ray is now the stack tab. It kept its picks in `xray`; Analyze reads them from `compare`.
  { source: "/x-ray", has: [{ type: "query" as const, key: "xray", value: "(?<ids>.+)" }], destination: "/analyze?tab=stack&compare=:ids" },
  { source: "/x-ray", destination: "/analyze?tab=stack" },
  { source: "/evaluate", destination: "/analyze" },
  { source: "/evaluate/:id", destination: "/analyze?compare=:id" },
  { source: "/insights", destination: "/" },
];

/** The Markdown of a tool or a phase sits at a guessable `.md` URL next to its page. */
export const MARKDOWN_REWRITES = [
  { source: "/tools/:id.md", destination: "/data/tools/:id.md" },
  { source: "/phases/:id.md", destination: "/data/phases/:id.md" },
];

const nextConfig: NextConfig = {
  async redirects() {
    return REDIRECTS.map((r) => ({ ...r, permanent: true }));
  },
  // Before the file system, or `/tools/[id]` would take `cursor.md` as an id and answer 404.
  async rewrites() {
    return { beforeFiles: MARKDOWN_REWRITES, afterFiles: [], fallback: [] };
  },
  // The PDF is the same paper as /ownership; point search engines at the page.
  async headers() {
    return [
      {
        source: PAPER_PDF_PATH,
        headers: [{ key: "Link", value: `<${SITE_URL}/ownership>; rel="canonical"` }],
      },
    ];
  },
};

export default nextConfig;
