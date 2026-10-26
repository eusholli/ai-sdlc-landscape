// schema.org JSON-LD for search engines and agents: the WebSite and a Dataset for the site, a
// SoftwareApplication per tool, a CollectionPage per phase, an Article per monthly digest,
// breadcrumbs, and the thesis with its glossary. Server only; pages render the result in a
// <script type="application/ld+json"> with jsonLdText.
import "server-only";

import { allTools, dataDate, FIELD_LABELS, getLandscape, phases } from "@/lib/data";
import { KEY_TERMS } from "@/lib/paper";
import { DATA_LICENCE_URL, PAPER_PDF_PATH, REPO_URL, SITE_URL } from "@/lib/site";
import type { Tool } from "@/lib/types";

const SITE_NAME = "AI SDLC Landscape";
const WEBSITE_ID = `${SITE_URL}/#website`;
const DATASET_ID = `${SITE_URL}/#dataset`;
const PUBLISHER = { "@type": "Organization", name: "AI SDLC Landscape contributors", url: REPO_URL };

/** The site itself, for the home page. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: "A neutral, public map of the AI tools that work across the software development lifecycle.",
    inLanguage: "en",
    publisher: PUBLISHER,
  };
}

export function datasetJsonLd() {
  const l = getLandscape();
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": DATASET_ID,
    name: SITE_NAME,
    description: `AI tools across the software development lifecycle, by phase, with typed relations. ${allTools().length} records, each fact linked to a public source.`,
    url: SITE_URL,
    sameAs: REPO_URL,
    license: DATA_LICENCE_URL,
    isAccessibleForFree: true,
    dateModified: dataDate(),
    ...(l.commit ? { version: l.commit } : {}),
    creator: PUBLISHER,
    keywords: ["AI software development tools", "AI coding tools", "software development lifecycle",
      ...phases().map((p) => p.label)],
    variableMeasured: [...new Set(Object.values(FIELD_LABELS))],
    distribution: [
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${SITE_URL}/landscape.json` },
      { "@type": "DataDownload", encodingFormat: "text/markdown", contentUrl: `${SITE_URL}/llms-full.txt` },
      { "@type": "DataDownload", encodingFormat: "application/atom+xml", contentUrl: `${SITE_URL}/changes.xml` },
      { "@type": "DataDownload", encodingFormat: "application/schema+json", contentUrl: `${SITE_URL}/schema/tool.json` },
    ],
  };
}

/** Breadcrumbs from the home page down; each step is [name, path]. */
export function breadcrumbJsonLd(steps: [name: string, path: string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [["Landscape", "/"] as const, ...steps].map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: `${SITE_URL}${path === "/" ? "" : path}`,
    })),
  };
}

/** A phase page: the tools listed under it, in page order. */
export function phaseJsonLd(p: { id: string; title: string; description: string; tools: { id: string; name: string }[] }) {
  const url = `${SITE_URL}/phases/${p.id}`;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": url,
    name: p.title,
    description: p.description,
    url,
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: p.tools.length,
      itemListElement: p.tools.map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/tools/${t.id}`,
        name: t.name,
      })),
    },
  };
}

/** A monthly digest of changes. */
export function monthJsonLd(p: { month: string; title: string; description: string; modified: string }) {
  const url = `${SITE_URL}/changes/${p.month}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": url,
    headline: p.title,
    description: p.description,
    url,
    datePublished: `${p.month}-01`,
    dateModified: p.modified,
    inLanguage: "en",
    author: PUBLISHER,
    publisher: PUBLISHER,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": DATASET_ID },
  };
}

/** `placeLabel` is the label of the tool's primary phase or layer, when it has one. */
export function toolJsonLd(t: Tool, placeLabel: string | null = null) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/tools/${t.id}`,
    name: t.name,
    url: `${SITE_URL}/tools/${t.id}`,
    sameAs: t.repo ? [t.url, t.repo] : t.url,
    applicationCategory: "DeveloperApplication",
    ...(placeLabel ? { applicationSubCategory: placeLabel } : {}),
    ...(t.summary ? { description: t.summary } : {}),
    publisher: { "@type": "Organization", name: t.company },
    ...(t.history ? { datePublished: t.history.added } : {}),
    ...(t.lastVerified ? { dateModified: t.lastVerified } : {}),
  };
}

/** JSON for a <script> tag: `<` escaped so a value can never close the tag. */
export const jsonLdText = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");

/** The thesis as a ScholarlyArticle, and its glossary as a DefinedTermSet with one anchored term per row. */
export function paperJsonLd(p: {
  title: string;
  author: string;
  date: string;
  version: string;
  glossary: { term: string; definition: string; id: string }[];
  glossaryId: string | null;
}) {
  const url = `${SITE_URL}/ownership`;
  const author = { "@type": "Person", name: p.author };
  const terms = p.glossary.map((g) => ({
    "@type": "DefinedTerm",
    "@id": `${url}#${g.id}`,
    name: g.term,
    description: g.definition,
    url: `${url}#${g.id}`,
    inDefinedTermSet: { "@id": `${url}#glossary` },
  }));
  const article = {
    "@type": "ScholarlyArticle",
    "@id": `${url}#paper`,
    headline: p.title,
    url,
    author,
    datePublished: p.date,
    dateModified: p.date,
    version: p.version,
    inLanguage: "en",
    isAccessibleForFree: true,
    encoding: { "@type": "MediaObject", contentUrl: `${SITE_URL}${PAPER_PDF_PATH}`, encodingFormat: "application/pdf" },
    isPartOf: { "@type": "WebSite", "@id": WEBSITE_ID, name: SITE_NAME, url: SITE_URL },
  };
  if (!terms.length) return { "@context": "https://schema.org", ...article };
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...article,
        about: terms.filter((t) => (KEY_TERMS as readonly string[]).includes(t.name)).map((t) => ({ "@id": t["@id"] })),
        hasPart: { "@id": `${url}#glossary` },
      },
      {
        "@type": "DefinedTermSet",
        "@id": `${url}#glossary`,
        name: `Glossary: ${p.title}`,
        url: p.glossaryId ? `${url}#${p.glossaryId}` : url,
        author,
        hasDefinedTerm: terms,
      },
    ],
  };
}
