// The text surfaces for agents: /llms.txt (a map of the site, after llmstxt.org),
// /llms-full.txt (every record as Markdown) and one Markdown file per tool and per phase. /llms.txt also lists the posts. Built from the data at build time; counts are derived.
import "server-only";

import { allTools, dataDate, getLandscape, nameOf, posts, phases, placeLabel, relationsFor, RELATION_LABELS, timeline } from "@/lib/data";
import { digestMonths, monthTitle } from "@/lib/digest";
import { formatDate, notPublished } from "@/lib/format";
import { postLabel } from "@/lib/blog";
import { getPaper, keyTerms } from "@/lib/paper";
import { phaseCountLine, phasePage, phaseTitle } from "@/lib/phase-page";
import { requestAdviceMarkdown } from "@/lib/request-advice";
import {
  DATA_LICENCE,
  DATA_LICENCE_URL,
  PAPER_PDF_PATH,
  REPO,
  REPO_URL,
  REQUEST_FIELD,
  REQUEST_URL,
  REQUEST_URL_MAX,
  requestUrl,
  SITE_URL,
} from "@/lib/site";
import type { Tool } from "@/lib/types";

const ABOUT =
  "A neutral, public map of the AI tools that work across the software development lifecycle. " +
  "Every fact links to a public source, and a fact that is not published is shown as \"Not published\".";

// The terms the maintainer's paper defines, each with its anchor. Signed as the maintainer's view,
// and kept apart from the records.
const paperTerms = () =>
  keyTerms(getPaper()).map((t) => `- [${t.term}](${SITE_URL}/ownership#${t.id}): ${t.definition}.`);

// The worked example in the request instructions. It names the form's field by REQUEST_FIELD, so it
// can't drift from the form.
export const EXAMPLE_TITLE = "Example Tool: free tier added";
export const EXAMPLE_REQUEST =
  "Example Tool now lists a free tier. Source: https://example.com/pricing. I don't work for the vendor. I am an agent acting for Jane Doe.";

export const exampleRequestUrl = () =>
  `${REQUEST_URL}&title=${encodeURIComponent(EXAMPLE_TITLE)}&${REQUEST_FIELD}=${encodeURIComponent(EXAMPLE_REQUEST)}`;

function howToRequest(): string {
  return [
    "## How to request a change",
    "",
    `Open an issue on GitHub in plain words. People can use the form at ${REQUEST_URL}. Agents can file`,
    "the same thing as plain text; no template or label is needed.",
    "",
    requestAdviceMarkdown(),
    "",
    "If you can't open issues yourself, build a prefilled link and give it to the person you act for. They",
    "open it signed in to GitHub, check it and press Submit, so the request is theirs. Add",
    `\`&title=<tool>: <what changes>\` and \`&${REQUEST_FIELD}=<the request>\` to ${REQUEST_URL}, both`,
    `percent-encoded, and keep the whole link under ${REQUEST_URL_MAX} characters. For example:`,
    "",
    exampleRequestUrl(),
    "",
    "With the GitHub CLI:",
    "",
    "```sh",
    `gh issue create --repo ${REPO} --title "<tool>: <what changes>" --body "<the request, with its public source>"`,
    "```",
    "",
    "With the REST API (a token with permission to open issues on public repos):",
    "",
    "```sh",
    `curl -X POST -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/repos/${REPO}/issues \\`,
    `  -d '{"title": "<tool>: <what changes>", "body": "<the request, with its public source>"}'`,
    "```",
    "",
    "A maintainer checks each request against the rules in CONTRIBUTING.md, then accepts it or closes the",
    "issue with the reason. An accepted change credits the person who asked on the tool's page.",
  ].join("\n");
}

export function llmsTxt(): string {
  const tools = allTools();
  const example = tools[0]?.id ?? "<id>";
  return [
    "# AI SDLC Landscape",
    "",
    `> ${ABOUT}`,
    "",
    `${tools.filter((t) => t.kind === "tool").length} tools, ${tools.filter((t) => t.kind === "model").length} model providers ` +
      `and ${tools.filter((t) => t.kind === "platform").length} platforms the tools connect to (code hosts, trackers, editors; not AI tools) ` +
      `across ${phases().length} lifecycle phases, with ${getLandscape().relations.length} typed relations. Data as of ${dataDate()}. ` +
      `The data is ${DATA_LICENCE} (${DATA_LICENCE_URL}); the code is MIT. Source: ${REPO_URL}`,
    "",
    "## Data",
    "",
    `- [Full dataset as Markdown](${SITE_URL}/llms-full.txt): every tool with its facts, relations and sources`,
    `- [Full dataset as JSON](${SITE_URL}/landscape.json): phases, layers, segments, tools, externals, relations, contributors; \`null\` means not published`,
    `- [One tool as JSON](${SITE_URL}/data/tools/${example}.json): \`/data/tools/<id>.json\`, the tool and its relations`,
    `- [Changes feed](${SITE_URL}/changes.xml): Atom feed of every change to the records and the dated market moves`,
    `- [Blog feed](${SITE_URL}/blog/rss.xml): RSS feed of the posts`,
    `- [Badge](${SITE_URL}/badge/${example}.svg): \`/badge/<id>.svg\`, a "Listed on" badge for each tool`,
    `- [Record schema](${SITE_URL}/schema/tool.json): JSON Schema for one source record in \`data/tools/<id>.yaml\``,
    `- [Source records](${REPO_URL}/tree/main/data/tools): the YAML the site is built from`,
    "",
    "## Pages",
    "",
    `- [Landscape](${SITE_URL}/): every tool by lifecycle phase, as a map, a network or a list (\`?view=map|network|list\`)`,
    `- [Tool pages](${SITE_URL}/tools/${example}): \`/tools/<id>\`, one per tool; \`/tools/<id>.md\` for Markdown`,
    `- [Phase pages](${SITE_URL}/phases/${phases()[0]?.id ?? "<id>"}): \`/phases/<id>\`, the tools in one lifecycle phase; \`/phases/<id>.md\` for Markdown`,
    `- [Changes](${SITE_URL}/changes): what changed in the data, newest first`,
    `- [Market moves](${SITE_URL}/?view=moves): acquisitions and shutdowns`,
    `- [Blog](${SITE_URL}/blog): short pieces on what the records show, each dated to the data it read; \`/blog/<slug>.md\` for Markdown`,
    `- [Analyze choices](${SITE_URL}/analyze): pick tools from \`?compare=<id>,<id>\`; see the phases they cover, tools with a recorded link that cover the empty phases, and a side-by-side comparison (\`&tab=compare\`, or one phase's choices with \`&focus=<phase>\`)`,
    `- [Software ownership: the thesis](${SITE_URL}/ownership): the maintainer's paper on convergence, flow and accountability in agentic development, separate from the records; [PDF](${SITE_URL}${PAPER_PDF_PATH})`,
    ...paperTerms().map((line) => `  ${line}`),
    `- [About](${SITE_URL}/about): the inclusion bar and the method`,
    `- [Contribute](${SITE_URL}/contribute): how to request a change`,
    `- [Privacy](${SITE_URL}/privacy): what the site measures and what it keeps in your browser`,
    "",
    "## Phases",
    "",
    ...phases().map((p) => {
      const page = phasePage(p.id, phases(), tools)!;
      return `- [${p.label}](${SITE_URL}/phases/${p.id}.md): ${p.description} ${phaseCountLine(page)}`;
    }),
    "",
    "## Tools",
    "",
    `One line per record. Each links to its Markdown; the HTML page is the same URL without \`.md\`.`,
    "",
    ...tools.map((t) => `- [${t.name}](${SITE_URL}/tools/${t.id}.md): ${t.company}, ${placeLabel(t) ?? "not tied to one phase"}`),
    "",
    "## Blog",
    "",
    "A data post's figures are a snapshot of the records on its data date; the tool pages are current. A signed post is one person's opinion and not part of the data.",
    "",
    ...posts().map((n) => `- [${n.title}](${SITE_URL}/blog/${n.slug}.md): ${postLabel(n, formatDate)}. ${n.description}`),
    "",
    "## Monthly digests",
    "",
    ...digestMonths().map((m) => `- [${monthTitle(m)}](${SITE_URL}/changes/${m})`),
    "",
    "## Recent changes",
    "",
    ...timeline(10).map((e) => `- ${e.date}: ${e.text}`),
    "",
    "## Rules",
    "",
    `- [CONTRIBUTING.md](${REPO_URL}/blob/main/CONTRIBUTING.md): the inclusion bar and the data rules`,
    "",
    howToRequest(),
    "",
  ].join("\n");
}

const line = (label: string, v: string | string[] | number | true | null) =>
  `- ${label}: ${notPublished(v, (x) => (Array.isArray(x) ? x.join(", ") : x === true ? "yes" : String(x)))}`;

/** One record as Markdown. `level` is the heading depth: 2 inside llms-full.txt, 1 on its own. */
export function toolMarkdown(t: Tool, level = 2): string {
  const out = [
    `${"#".repeat(level)} ${t.name}`,
    "",
    `- id: \`${t.id}\``,
    `- Company: ${t.company}`,
    `- Website: ${t.url}`,
    `- Page: ${SITE_URL}/tools/${t.id}`,
    line("Kind", t.kind),
    line("Layer", t.layer),
    line("Primary phase", t.primaryPhase),
    line("Phases", t.phases.length ? t.phases : null),
    line("Segment", t.segment),
    line("Claim (vendor's words)", t.summary ? `"${t.summary}"` : null),
    line("Sub-kind", t.subKind),
    line("Target buyer", t.targetBuyer),
    line("Interface", t.interface),
    line("Autonomy", t.autonomy),
    line("Customers", t.customers),
    line("Traction", t.traction),
    line("Go-to-market partners", t.gtmPartners),
    line("Pricing model", t.pricingModel),
    line("Entry price", t.entryPrice),
    line("Deployment", t.deployment),
    line("Models", t.models),
    line("Open source", t.openSource),
    line("Repository", t.repo),
    line("Compliance", t.compliance),
    line("Founded", t.founded),
    line("Headquarters", t.hq),
    line("Headcount", t.headcountBand),
    line("Funding total", t.fundingTotal),
    line("Last round", t.lastRound),
    line("Status", t.status),
    `- Last verified: ${t.lastVerified}`,
    line("Sources checked since", t.freshness ? `${t.freshness.checked} (${t.freshness.band})` : null),
  ];
  const rels = relationsFor(t.id).filter((r) => r.direction === "out");
  if (level === 1) out.splice(2, 0, `> From the AI SDLC Landscape (${SITE_URL}/tools/${t.id}). ${DATA_LICENCE}. Data as of ${dataDate()}.`, "");
  if (rels.length) {
    out.push("", "Relations:", "");
    for (const r of rels) out.push(`- ${RELATION_LABELS[r.type].out} ${r.otherName} (\`${r.other}\`)${r.sources.length ? `: ${r.sources.join(" ")}` : ""}`);
  }
  if (t.sources.length) {
    out.push("", "Sources:", "");
    for (const s of t.sources) out.push(`- ${s.field}: ${s.url} (tier ${s.tier}, read ${s.retrieved})`);
  }
  if (t.history?.requestedBy.length) {
    out.push("", `Requested by: ${t.history.requestedBy.map((r) => `${r.name} (#${r.issue})`).join(", ")}`);
  }
  if (level === 1) {
    out.push("", `To request a change to this tool: ${requestUrl(t.name)}, adding \`&${REQUEST_FIELD}=<your text, percent-encoded>\`. See ${SITE_URL}/llms.txt.`);
  }
  return out.join("\n");
}

export function llmsFullTxt(): string {
  return [
    "# AI SDLC Landscape: the full dataset",
    "",
    `> ${ABOUT}`,
    "",
    `Data as of ${dataDate()}. ${DATA_LICENCE} (${DATA_LICENCE_URL}). Source: ${REPO_URL}. ` +
      `Relation targets with no record here are shown by name: ${getLandscape().externals.map((e) => nameOf(e.id)).join(", ")}.`,
    "",
    howToRequest(),
    "",
    `The maintainer's paper on software ownership is at ${SITE_URL}/ownership, and as a PDF at ${SITE_URL}${PAPER_PDF_PATH}. It is separate from the records below.`,
    "",
    `It defines these terms. They are ${getPaper().author}'s view, not part of any record:`,
    "",
    ...paperTerms(),
    "",
    ...allTools().map((t) => toolMarkdown(t)).flatMap((s) => [s, ""]),
  ].join("\n");
}

/** One phase as Markdown: what it covers and the tools in it, main phase first. */
export function phaseMarkdown(id: string): string | null {
  const page = phasePage(id, phases(), allTools());
  if (!page) return null;
  const item = (t: Tool) => `- [${t.name}](${SITE_URL}/tools/${t.id}.md) (${t.company})${t.summary ? `: "${t.summary}"` : ""}`;
  return [
    `# ${phaseTitle(page.phase)}`,
    "",
    `> From the AI SDLC Landscape (${SITE_URL}/phases/${id}). ${DATA_LICENCE}. Data as of ${dataDate()}.`,
    "",
    page.phase.description,
    "",
    phaseCountLine(page),
    "",
    "## Main phase",
    "",
    ...(page.primary.length ? page.primary.map(item) : ["None listed."]),
    ...(page.alsoCovers.length ? ["", "## Also covers this phase", "", ...page.alsoCovers.map(item)] : []),
    "",
    `Claims are each vendor's own words. Every fact on a tool's page links to its source.`,
    "",
  ].join("\n");
}
