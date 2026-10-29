// Titles, descriptions, phase pages, redirects and the new JSON-LD. Fixtures only, except where a
// test checks that every phase or tool in the data is covered. Run `pnpm data` first.
import { describe, expect, it } from "vitest";
import phasesJson from "@/data/phases.json";
import { allTools, phases } from "@/lib/data";
import { breadcrumbJsonLd, monthJsonLd, phaseJsonLd, websiteJsonLd } from "@/lib/jsonld";
import { llmsTxt, phaseMarkdown, toolMarkdown } from "@/lib/llms";
import { phaseCountLine, phasePage, phaseTitle } from "@/lib/phase-page";
import { DESCRIPTION_MAX, OPEN_GRAPH, TITLE_MAX, toolDescription, toolTitle } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import type { Phase, PhaseId } from "@/lib/types";
import { MARKDOWN_REWRITES, REDIRECTS } from "@/next.config";

const PHASES: Phase[] = [
  { id: "plan", order: 1, label: "Plan and specify", description: "Specs." },
  { id: "code", order: 3, label: "Write code", description: "Code." },
  { id: "review", order: 4, label: "Code review", description: "Review." },
];
const node = (id: string, primaryPhase: PhaseId | null, phases: PhaseId[] = [], layer: string | null = null) =>
  ({ id, name: id.toUpperCase(), primaryPhase, phases: primaryPhase ? [primaryPhase, ...phases] : phases, layer });
const NODES = [
  node("b-editor", "code", ["review"]),
  node("a-editor", "code"),
  node("reviewer", "review"),
  node("infra", null, ["code"], "agent-infra"),
];

describe("phase pages", () => {
  it("lists main-phase tools, then tools that also cover it, without layers", () => {
    const page = phasePage("code", PHASES, NODES)!;
    expect(page.primary.map((t) => t.id)).toEqual(["a-editor", "b-editor"]);
    expect(page.alsoCovers).toEqual([]);
    const review = phasePage("review", PHASES, NODES)!;
    expect(review.primary.map((t) => t.id)).toEqual(["reviewer"]);
    expect(review.alsoCovers.map((t) => t.id)).toEqual(["b-editor"]);
  });

  it("links the phases before and after, in lifecycle order", () => {
    const page = phasePage("code", [...PHASES].reverse(), NODES)!;
    expect(page.prev?.id).toBe("plan");
    expect(page.next?.id).toBe("review");
    expect(phasePage("plan", PHASES, NODES)!.prev).toBeNull();
    expect(phasePage("missing", PHASES, NODES)).toBeNull();
  });

  it("titles every real phase label as a readable phrase", () => {
    for (const p of phasesJson.phases) {
      const title = phaseTitle(p);
      expect(title).toBe(`${p.label}: AI tools`);
      expect(title.length).toBeLessThanOrEqual(TITLE_MAX);
    }
  });

  it("counts in words with the right number", () => {
    expect(phaseCountLine({ primary: [NODES[0]], alsoCovers: [] })).toBe("1 tool lists this as the main phase.");
    expect(phaseCountLine({ primary: NODES.slice(0, 2), alsoCovers: [NODES[2]] }))
      .toBe("2 tools list this as the main phase, and 1 more tool covers it.");
    expect(phaseCountLine({ primary: [], alsoCovers: NODES.slice(0, 2) })).toBe("0 tools list this as the main phase, and 2 more tools cover it.");
  });
});

describe("tool titles and descriptions", () => {
  const tool = { name: "Fixture", company: "Fixture Labs", summary: "A tool that exists only in tests." };

  it("names the company once and the place when it fits", () => {
    expect(toolTitle({ name: "Editor", company: "Acme" }, "Write code")).toBe("Editor by Acme: Write code");
    expect(toolTitle(tool, "Write code")).toBe("Fixture: Write code");
    expect(toolTitle({ name: "Editor", company: "Acme" }, null)).toBe("Editor by Acme");
  });

  it("names only the facets the page holds, in search order, dropping from the end to fit", () => {
    const all = { pricing: true, alternatives: true, integrations: true };
    const none = { pricing: false, alternatives: false, integrations: false };
    expect(toolTitle({ name: "Cursor", company: "Anysphere" }, "Write code", all)).toBe("Cursor pricing, alternatives and integrations");
    expect(toolTitle({ name: "Editor", company: "Acme" }, "Write code", { ...none, alternatives: true, integrations: true }))
      .toBe("Editor alternatives and integrations");
    expect(toolTitle({ name: "Editor", company: "Acme" }, "Write code", { ...none, pricing: true })).toBe("Editor pricing");
    expect(toolTitle({ name: "A fairly long product name", company: "Acme" }, "Write code", all)).toBe("A fairly long product name pricing");
    expect(toolTitle({ name: "Editor", company: "Acme" }, "Write code", none)).toBe("Editor by Acme: Write code");
  });

  it("never claims pricing for a real record that publishes none, and never runs past the limit", () => {
    for (const t of allTools()) {
      const facets = { pricing: Boolean(t.pricingModel || t.entryPrice), alternatives: true, integrations: true };
      const title = toolTitle(t, "Write code", facets);
      expect(title.length).toBeLessThanOrEqual(TITLE_MAX);
      if (!facets.pricing) expect(title).not.toContain("pricing");
    }
  });

  it("drops parts rather than run past the limit", () => {
    const long = { name: "A very long product name here", company: "An equally long company name" };
    expect(toolTitle(long, "Code understanding and knowledge")).toBe(long.name);
  });

  it("keeps the vendor's claim whole and adds the place only when it fits", () => {
    expect(toolDescription(tool, "Write code")).toBe(`${tool.summary} Listed under Write code, with sourced facts.`);
    const long = { ...tool, summary: "x".repeat(DESCRIPTION_MAX) };
    expect(toolDescription(long, "Write code")).toBe(long.summary);
    expect(toolDescription({ ...tool, summary: null }, null)).toContain("has not published a one-line claim");
    expect(toolDescription({ ...tool, summary: null }, null)).not.toMatch(/undefined|null/);
  });

  it("never sets a URL in the shared Open Graph fields", () => {
    expect(OPEN_GRAPH).not.toHaveProperty("url");
  });
});

describe("redirects and rewrites", () => {
  it("sends every removed page somewhere live", () => {
    const sources = new Set(REDIRECTS.map((r) => r.source));
    for (const path of ["/moves", "/compare", "/x-ray", "/evaluate", "/evaluate/:id", "/insights"]) {
      expect(sources).toContain(path);
    }
    for (const r of REDIRECTS) expect(r.destination).toMatch(/^\/(analyze)?(\?|$)/);
  });

  it("serves Markdown at the page URL plus .md", () => {
    expect(MARKDOWN_REWRITES).toEqual([
      { source: "/tools/:id.md", destination: "/data/tools/:id.md" },
      { source: "/phases/:id.md", destination: "/data/phases/:id.md" },
      { source: "/blog/:slug.md", destination: "/data/blog/:slug.md" },
    ]);
  });
});

describe("JSON-LD", () => {
  it("numbers breadcrumbs from the home page", () => {
    const b = breadcrumbJsonLd([["Code review", "/phases/review"]]);
    expect(b.itemListElement.map((i) => [i.position, i.item])).toEqual([
      [1, SITE_URL],
      [2, `${SITE_URL}/phases/review`],
    ]);
  });

  it("lists a phase's tools in page order", () => {
    const ld = phaseJsonLd({ id: "review", title: "t", description: "d", tools: [{ id: "x", name: "X" }, { id: "y", name: "Y" }] });
    expect(ld["@type"]).toBe("CollectionPage");
    expect(ld.mainEntity.numberOfItems).toBe(2);
    expect(ld.mainEntity.itemListElement[1]).toMatchObject({ position: 2, url: `${SITE_URL}/tools/y` });
  });

  it("dates a monthly digest and names the site", () => {
    expect(monthJsonLd({ month: "2026-10", title: "t", description: "d", modified: "2026-10-26" }).datePublished).toBe("2026-10-01");
    expect(websiteJsonLd()).toMatchObject({ "@type": "WebSite", url: SITE_URL });
    expect(JSON.stringify(websiteJsonLd())).not.toContain("null");
  });
});

describe("Markdown for agents", () => {
  it("writes one file per phase with every tool in it", () => {
    for (const p of phases()) {
      const page = phasePage(p.id, phases(), allTools())!;
      const md = phaseMarkdown(p.id)!;
      expect(md.startsWith(`# ${phaseTitle(p)}`)).toBe(true);
      for (const t of [...page.primary, ...page.alsoCovers]) expect(md).toContain(`${SITE_URL}/tools/${t.id}.md`);
    }
    expect(phaseMarkdown("missing")).toBeNull();
  });

  it("writes a tool on its own with a top-level heading and its page", () => {
    const t = allTools()[0];
    const md = toolMarkdown(t, 1);
    expect(md.startsWith(`# ${t.name}\n`)).toBe(true);
    expect(md).toContain(`${SITE_URL}/tools/${t.id})`);
    expect(toolMarkdown(t).startsWith(`## ${t.name}\n`)).toBe(true);
  });

  it("lists every phase and every record in llms.txt", () => {
    const txt = llmsTxt();
    for (const p of phases()) expect(txt).toContain(`${SITE_URL}/phases/${p.id}.md`);
    for (const t of allTools()) expect(txt).toContain(`${SITE_URL}/tools/${t.id}.md`);
  });
});
