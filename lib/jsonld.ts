// schema.org JSON-LD for search engines and agents: a Dataset for the site, a SoftwareApplication
// per tool. Server only; pages render the result with <JsonLd>.
import "server-only";

import { allTools, dataDate, getLandscape } from "@/lib/data";
import { DATA_LICENCE_URL, REPO_URL, SITE_URL } from "@/lib/site";
import type { Tool } from "@/lib/types";

export function datasetJsonLd() {
  const l = getLandscape();
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "AI SDLC Landscape",
    description: `AI tools across the software development lifecycle, by phase, with typed relations. ${allTools().length} records, each fact linked to a public source.`,
    url: SITE_URL,
    sameAs: REPO_URL,
    license: DATA_LICENCE_URL,
    isAccessibleForFree: true,
    dateModified: dataDate(),
    ...(l.commit ? { version: l.commit } : {}),
    creator: { "@type": "Organization", name: "AI SDLC Landscape contributors", url: REPO_URL },
    distribution: [
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${SITE_URL}/landscape.json` },
      { "@type": "DataDownload", encodingFormat: "text/markdown", contentUrl: `${SITE_URL}/llms-full.txt` },
    ],
  };
}

export function toolJsonLd(t: Tool) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: t.name,
    url: `${SITE_URL}/tools/${t.id}`,
    sameAs: t.url,
    applicationCategory: "DeveloperApplication",
    ...(t.summary ? { description: t.summary } : {}),
    publisher: { "@type": "Organization", name: t.company },
    ...(t.lastVerified ? { dateModified: t.lastVerified } : {}),
  };
}

/** JSON for a <script> tag: `<` escaped so a value can never close the tag. */
export const jsonLdText = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");

export function paperJsonLd(p: { title: string; author: string; date: string; version: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: p.title,
    url: `${SITE_URL}/ownership`,
    author: { "@type": "Person", name: p.author },
    datePublished: p.date,
    version: p.version,
    inLanguage: "en",
    isAccessibleForFree: true,
    isPartOf: { "@type": "WebSite", name: "AI SDLC Landscape", url: SITE_URL },
  };
}
