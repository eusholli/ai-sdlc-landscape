// The text surfaces for agents: /llms.txt (a map of the site, after llmstxt.org) and
// /llms-full.txt (every record as Markdown). Built from the data at build time; counts are derived.
import "server-only";

import { allTools, dataDate, getLandscape, nameOf, phases, relationsFor, RELATION_LABELS, timeline } from "@/lib/data";
import { notPublished } from "@/lib/format";
import { requestAdviceMarkdown } from "@/lib/request-advice";
import { DATA_LICENCE, DATA_LICENCE_URL, REPO, REPO_URL, REQUEST_URL, SITE_URL } from "@/lib/site";
import type { Tool } from "@/lib/types";

const ABOUT =
  "A neutral, public map of the AI tools that work across the software development lifecycle. " +
  "Every fact links to a public source, and a fact that is not published is shown as \"Not published\".";

function howToRequest(): string {
  return [
    "## How to request a change",
    "",
    `Open an issue on GitHub in plain words. People can use the form at ${REQUEST_URL}. Agents can file`,
    "the same thing as plain text; no template or label is needed.",
    "",
    requestAdviceMarkdown(),
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
    `${tools.filter((t) => t.kind === "tool").length} tools and ${tools.filter((t) => t.kind === "model").length} model providers ` +
      `across ${phases().length} lifecycle phases, with ${getLandscape().relations.length} typed relations. Data as of ${dataDate()}. ` +
      `The data is ${DATA_LICENCE} (${DATA_LICENCE_URL}); the code is MIT. Source: ${REPO_URL}`,
    "",
    "## Data",
    "",
    `- [Full dataset as Markdown](${SITE_URL}/llms-full.txt): every tool with its facts, relations and sources`,
    `- [Full dataset as JSON](${SITE_URL}/landscape.json): phases, layers, segments, tools, externals, relations, contributors; \`null\` means not published`,
    `- [One tool as JSON](${SITE_URL}/data/tools/${example}.json): \`/data/tools/<id>.json\`, the tool and its relations`,
    `- [Changes feed](${SITE_URL}/changes.xml): Atom feed of every change to the records and the dated market moves`,
    `- [Badge](${SITE_URL}/badge/${example}.svg): \`/badge/<id>.svg\`, a "Listed on" badge for each tool`,
    `- [Record schema](${SITE_URL}/schema/tool.json): JSON Schema for one source record in \`data/tools/<id>.yaml\``,
    `- [Source records](${REPO_URL}/tree/main/data/tools): the YAML the site is built from`,
    "",
    "## Pages",
    "",
    `- [Map](${SITE_URL}/): every tool by lifecycle phase`,
    `- [Tool pages](${SITE_URL}/tools/${example}): \`/tools/<id>\`, one per tool`,
    `- [Changes](${SITE_URL}/changes): what changed in the data, newest first`,
    `- [Market moves](${SITE_URL}/moves): acquisitions and shutdowns`,
    `- [Stack X-ray](${SITE_URL}/x-ray): pick the tools a team runs, see phase coverage, overlaps, model dependence, ownership changes and pricing mix`,
    `- [Evaluate an AI SDLC tool](${SITE_URL}/evaluate): the questions to put to a vendor on data, continuity, pricing, integration and security; \`/evaluate/<id>\` shows what one tool's vendor has published, and \`/evaluate.md\` and \`/evaluate.csv\` download the list`,
    `- [Software ownership: the thesis](${SITE_URL}/ownership): the maintainer's paper on convergence, flow and accountability in agentic development, separate from the records`,
    `- [Insights](${SITE_URL}/insights): coverage and what is published`,
    `- [About](${SITE_URL}/about): the inclusion bar and the method`,
    `- [Contribute](${SITE_URL}/contribute): how to request a change`,
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

function toolMarkdown(t: Tool): string {
  const out = [
    `## ${t.name}`,
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
  return out.join("\n");
}

export function llmsFullTxt(): string {
  return [
    "# AI SDLC Landscape: the full dataset",
    "",
    `> ${ABOUT}`,
    "",
    `Data as of ${dataDate()}. ${DATA_LICENCE} (${DATA_LICENCE_URL}). Source: ${REPO_URL}. ` +
      `Relation targets that are not tools here are shown by name: ${getLandscape().externals.map((e) => nameOf(e.id)).join(", ")}.`,
    "",
    howToRequest(),
    "",
    `The maintainer's paper on software ownership is at ${SITE_URL}/ownership. It is separate from the records below.`,
    "",
    ...allTools().map(toolMarkdown).flatMap((s) => [s, ""]),
  ].join("\n");
}
