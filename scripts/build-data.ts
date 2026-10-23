// Build data/landscape.json from the source records, and check them.
//
//   npx tsx scripts/build-data.ts           # check, then write data/landscape.json
//   npx tsx scripts/build-data.ts --check   # check only; exits 1 on any error
//
// data/tools/<id>.yaml, one file per tool or model provider, is the hand-kept source. The site
// reads landscape.json, which is generated and not committed. Provenance is checked, not trusted:
// a field with a value and no source is an error, and every source carries the date it was read.
// A field with no value reads "unknown" in the output. Each record's history (who added it and who
// last changed it, and when) comes from git; see scripts/history.ts.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { type Contributor, contributors, headCommit, type History, recordHistory } from "./history";

export const FIELDS_SOURCED = [
  "summary", "customers", "traction", "gtm_partners", "pricing_model", "entry_price",
  "deployment", "models", "open_source", "repo", "compliance", "founded", "hq", "headcount_band",
  "funding_total", "last_round", "status",
] as const;
export const FIELDS_JUDGED = ["sub_kind", "target_buyer", "interface", "autonomy"] as const;
export const FIELDS_PLACEMENT = ["id", "name", "company", "url", "layer", "primary_phase", "phases", "segment"] as const;
const KNOWN_KEYS = new Set<string>([...FIELDS_PLACEMENT, ...FIELDS_JUDGED, ...FIELDS_SOURCED, "relations", "sources"]);

export const REL_TYPES = new Set([
  "integrates_with", "built_on_model", "acquired_by", "partners_with", "competes_with", "ships_inside",
]);
export const TRADE_PRESS = new Set([
  "techcrunch.com", "theregister.com", "venturebeat.com", "thenewstack.io", "devops.com",
  "siliconangle.com", "businesswire.com", "prnewswire.com", "globenewswire.com", "reuters.com",
  "bloomberg.com", "cnbc.com", "forbes.com", "fortune.com", "axios.com", "theinformation.com",
  "infoworld.com", "zdnet.com", "techtarget.com", "geekwire.com", "sdtimes.com", "leaddev.com",
  "helpnetsecurity.com", "securityweek.com", "darkreading.com", "wsj.com", "ft.com",
  "theverge.com", "wired.com", "fintech.global", "calcalistech.com", "ctech.calcalistech.com",
  "techzine.eu", "itpro.com", "computerweekly.com", "finsmes.com", "reworked.co",
  "techfundingnews.com", "arcticstartup.com", "builtinsf.com", "globes.co.il",
]);
const TIER_D_HINT = /(wiseguy|marketresearch|giiresearch|top-\d+|best-.*-tools)/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

type Rec = Record<string, unknown>;
interface SourceIn { field: string; url: string; retrieved: string }
interface RelationIn { type: string; to: string; sources?: string[] }

const host = (url: string) => {
  try { return new URL(url).host.toLowerCase().replace(/^www\./, ""); } catch { return ""; }
};
const base = (h: string) => h.split(".").slice(-2).join(".");

// On GitHub the publisher is the account in the path, not the host: github.com/<owner>/...
const GITHUB = "github.com";
const REPO = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;
const owner = (url: string) => {
  if (host(url) !== GITHUB) return "";
  try { return new URL(url).pathname.split("/")[1]?.toLowerCase() ?? ""; } catch { return ""; }
};

/**
 * A: the vendor's own site, or a page under the vendor's GitHub account, which is the account in
 * `repo` or in the tool's own url when that is on GitHub. B: trade press on the list above.
 * C: anything else, including any other GitHub account.
 */
export function tier(url: string, toolUrl: string, repo = ""): "A" | "B" | "C" {
  const h = host(url), th = host(toolUrl);
  if (h === GITHUB) {
    const own = owner(repo) || owner(toolUrl);
    if (own && owner(url) === own) return "A";
  } else if (th !== GITHUB && base(h) === base(th)) return "A";
  if ([...TRADE_PRESS].some((d) => h === d || h.endsWith("." + d))) return "B";
  return "C";
}

const asList = (v: unknown): unknown[] => (v == null ? [] : Array.isArray(v) ? v : [v]);
const isEmpty = (v: unknown) =>
  v == null || v === "" || v === "unknown" || (Array.isArray(v) && v.length === 0) ||
  (typeof v === "object" && !Array.isArray(v) && Object.keys(v as object).length === 0);

export interface BuildResult { data: Rec | null; errors: string[]; warns: string[] }

export function buildLandscape(root = "."): BuildResult {
  const errors: string[] = [], warns: string[] = [];
  const phases = JSON.parse(readFileSync(join(root, "data/phases.json"), "utf8"));
  const phaseIds = new Set(phases.phases.map((p: Rec) => p.id));
  const layerIds = new Set(phases.layers.map((l: Rec) => l.id));
  const segIds = new Set(phases.segments.map((s: Rec) => s.id));
  const phaseOrder = new Map<unknown, number>(phases.phases.map((p: Rec) => [p.id, p.order as number]));

  const dir = join(root, "data/tools");
  const tools: Rec[] = [];
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".yaml")).sort()) {
    let t: Rec;
    try {
      t = parse(readFileSync(join(dir, f), "utf8"));
    } catch (e) {
      errors.push(`${f}: not valid YAML (${(e as Error).message.split("\n")[0]})`);
      continue;
    }
    if (!t || typeof t !== "object") { errors.push(`${f}: empty record`); continue; }
    t.id = String(t.id ?? "");
    if (`${t.id}.yaml` !== f) errors.push(`${f}: id ${JSON.stringify(t.id)} does not match the file name`);
    for (const k of Object.keys(t)) if (!KNOWN_KEYS.has(k)) errors.push(`${t.id}: unknown field ${k}`);
    tools.push(t);
  }

  const ids = tools.map((t) => t.id as string);
  const idSet = new Set(ids);
  if (idSet.size !== ids.length) errors.push(`duplicate ids: ${ids.filter((i, n) => ids.indexOf(i) !== n).join(", ")}`);
  const urlOf = new Map(tools.map((t) => [t.id as string, String(t.url ?? "")]));
  const repoOf = new Map(tools.map((t) => [t.id as string, String(t.repo ?? "")]));

  const logoDir = join(root, "public/logos");
  const logos = existsSync(logoDir) ? readdirSync(logoDir).sort() : [];

  let history: Map<string, History> | null = null;
  let people: Contributor[] | null = null;
  try {
    history = recordHistory(root);
    people = contributors(root);
  } catch (e) { errors.push(`history: ${(e as Error).message}`); }

  const nodes: Rec[] = [], relations: Rec[] = [], externals = new Map<string, Rec>();
  for (const t of tools) {
    const tid = t.id as string;
    for (const k of ["name", "company", "url"]) if (isEmpty(t[k])) errors.push(`${tid}: ${k} is required`);
    const layer = (t.layer as string | undefined) ?? null;
    const rec: Rec = { id: tid, kind: layer === "model" ? "model" : "tool" };
    rec.name = t.name ?? "unknown";
    rec.company = String(t.company ?? "unknown");
    rec.url = t.url ?? "unknown";
    const logo = logos.find((n) => n.slice(0, n.lastIndexOf(".")) === tid);
    rec.logo_url = logo ? `/logos/${logo}` : null;
    rec.layer = layer;

    // placement
    const pp = (t.primary_phase as string | undefined) ?? null;
    if (layer) {
      if (!layerIds.has(layer)) errors.push(`${tid}: unknown layer ${layer}`);
    } else if (!phaseIds.has(pp)) {
      errors.push(`${tid}: primary_phase ${JSON.stringify(pp)} not in phases.json`);
    }
    let ph = asList(t.phases) as string[];
    if (!ph.length && pp) ph = [pp];
    for (const p of ph) if (!phaseIds.has(p)) errors.push(`${tid}: phase ${JSON.stringify(p)} not in phases.json`);
    if (pp && !ph.includes(pp)) ph = [pp, ...ph];
    rec.primary_phase = pp;
    rec.phases = ph;
    const seg = (t.segment as string | undefined) ??
      (ph.length >= 6 ? "full-lifecycle" : ph.length >= 2 ? "multi-phase" : "point");
    if (!segIds.has(seg)) errors.push(`${tid}: segment ${JSON.stringify(seg)} unknown`);
    rec.segment = rec.kind === "tool" ? seg : null;
    for (const k of FIELDS_JUDGED) rec[k] = t[k] ?? "unknown";

    // sourced fields
    const prov: Rec[] = [];
    const sourced = new Set<string>();
    for (const s of asList(t.sources) as SourceIn[]) {
      if (!s || typeof s !== "object" || !s.field || !s.url) {
        errors.push(`${tid}: a source needs field and url: ${JSON.stringify(s)}`);
        continue;
      }
      if (!/^https?:\/\//.test(s.url)) errors.push(`${tid}: source for ${s.field} is not a web URL: ${s.url}`);
      if (!ISO_DATE.test(String(s.retrieved ?? ""))) {
        errors.push(`${tid}: source for ${s.field} needs a retrieved date (YYYY-MM-DD): ${s.url}`);
      }
      if (TIER_D_HINT.test(s.url)) errors.push(`${tid}: looks like a Tier D source: ${s.url}`);
      sourced.add(s.field);
      prov.push({ field: s.field, url: s.url, tier: tier(s.url, String(t.url ?? ""), String(t.repo ?? "")), retrieved: String(s.retrieved) });
    }
    // The repo decides which GitHub account speaks for the vendor, so the vendor has to name it:
    // its source is a page on the vendor's own site (scripts/check-links.ts checks it links there),
    // or the repo itself when the tool's url is on GitHub.
    if (t.open_source === true && isEmpty(t.repo)) errors.push(`${tid}: open_source needs a repo`);
    if (!isEmpty(t.repo)) {
      const repo = String(t.repo), tu = String(t.url ?? "");
      if (!REPO.test(repo)) errors.push(`${tid}: repo must be https://github.com/<owner>/<name>: ${repo}`);
      if (owner(tu) && owner(tu) !== owner(repo)) errors.push(`${tid}: repo is not under the GitHub account in url`);
      const own = (u: string) => (owner(tu) ? owner(u) === owner(tu) : host(u) !== GITHUB && base(host(u)) === base(host(tu)));
      if (!prov.some((p) => p.field === "repo" && own(p.url as string))) {
        errors.push(`${tid}: repo needs a source on the vendor's own site`);
      }
    }
    for (const k of FIELDS_SOURCED) {
      const v = t[k];
      const empty = isEmpty(v);
      rec[k] = empty ? "unknown" : v;
      if (!empty && !sourced.has(k)) errors.push(`${tid}: ${k} has a value but no source`);
      if (!empty && k === "status" && String(v).startsWith("acquired")) {
        // The acquirer's own announcement is a party disclosure, so it is Tier A too.
        const buyers = (asList(t.relations) as RelationIn[]).filter((r) => r?.type === "acquired_by").map((r) => r.to);
        const tiers = new Set(prov.filter((p) => p.field === "status").map((p) =>
          buyers.some((b) => tier(p.url as string, urlOf.get(b) ?? "", repoOf.get(b)) === "A") ? "A" : p.tier));
        if (!tiers.has("A") && !tiers.has("B")) errors.push(`${tid}: acquisition needs a Tier A or B source`);
      }
    }
    rec.sources = prov;
    const dates = prov.map((p) => p.retrieved as string).filter((d) => ISO_DATE.test(d)).sort();
    rec.last_verified = dates.at(-1) ?? "unknown";
    // Null outside a git checkout, and for a record not yet committed.
    rec.history = history?.get(tid) ?? null;
    nodes.push(rec);

    for (const r of asList(t.relations) as RelationIn[]) {
      if (!r || typeof r !== "object" || !/^[\w.-]+$/.test(String(r.to ?? ""))) {
        errors.push(`${tid}: bad relation ${JSON.stringify(r)}`);
        continue;
      }
      const to = String(r.to);
      if (!REL_TYPES.has(r.type)) errors.push(`${tid}: unknown relation type ${r.type}`);
      if (!idSet.has(to) && !externals.has(to)) externals.set(to, { id: to, kind: "external", name: to });
      const srcs = asList(r.sources).map(String);
      if (!srcs.length) warns.push(`${tid}: relation ${r.type} ${to} has no source`);
      relations.push({ from: tid, to, type: r.type, sources: srcs });
    }
    if (rec.kind === "tool" && rec.summary === "unknown") warns.push(`${tid}: no summary`);
  }

  // The screened list: what a scan found and a person turned away. A tool cannot be both.
  const scrPath = join(root, "data/screened.yaml");
  const screened = (existsSync(scrPath) ? parse(readFileSync(scrPath, "utf8")) ?? [] : []) as Rec[];
  // Whole URLs, not hosts: a screened project on github.com is not the record that also lives there.
  const sameUrl = (u: string) => host(u) + (() => { try { return new URL(u).pathname.replace(/\/$/, ""); } catch { return ""; } })();
  const toolUrls = new Set(tools.map((t) => sameUrl(String(t.url ?? ""))));
  for (const s of screened) {
    const label = `screened.yaml: ${String(s?.name ?? JSON.stringify(s))}`;
    if (!s?.name || !/^https?:\/\//.test(String(s.url ?? ""))) errors.push(`${label} needs a name and a web URL`);
    if (!["rejected", "deferred"].includes(String(s?.decision))) errors.push(`${label}: decision must be rejected or deferred`);
    if (!s?.reason) errors.push(`${label} needs a reason`);
    if (!ISO_DATE.test(String(s?.date ?? ""))) errors.push(`${label} needs a date (YYYY-MM-DD)`);
    if (s?.url && toolUrls.has(sameUrl(String(s.url)))) errors.push(`${label} is also a record; delete one`);
  }

  const extPath = join(root, "data/externals.yaml");
  const extNames: Record<string, string> = existsSync(extPath) ? parse(readFileSync(extPath, "utf8")) ?? {} : {};
  for (const [k, e] of externals) e.name = extNames[k] ?? k;
  for (const k of Object.keys(extNames)) if (!externals.has(k)) warns.push(`externals.yaml: ${k} is not a relation target`);

  // Phase order, then the cross-cutting layers, then name: the order the census page lists them.
  const rank = (n: Rec): number => (n.layer ? 100 : (phaseOrder.get(n.primary_phase) ?? 99));
  nodes.sort((a, b) => rank(a) - rank(b) || String(a.name).localeCompare(String(b.name)));

  const generated = nodes.map((n) => n.last_verified as string).filter((d) => d !== "unknown").sort().at(-1) ?? "";
  const data = {
    generated,
    // The commit the data was built from: with `generated`, the version of the dataset.
    commit: headCommit(root),
    description: "AI in the software development lifecycle: tools by phase, with typed relations. " +
      "Every non-unknown field traces to a public page in `sources`.",
    phases: phases.phases, layers: phases.layers, segments: phases.segments,
    nodes,
    externals: [...externals.values()].sort((a, b) => String(a.id).localeCompare(String(b.id))),
    relations,
    contributors: people ?? [],
  };
  return { data: errors.length ? null : data, errors, warns };
}

function main() {
  const check = process.argv.includes("--check");
  const { data, errors, warns } = buildLandscape();
  for (const e of errors) console.log("ERROR", e);
  for (const w of warns) console.log("warn ", w);
  if (data) {
    const nodes = data.nodes as Rec[];
    const tools = nodes.filter((n) => n.kind === "tool").length;
    console.log(`${tools} tools, ${nodes.length - tools} model nodes, ${(data.externals as Rec[]).length} external nodes, ` +
      `${(data.relations as Rec[]).length} relations, ${warns.length} warnings`);
    if (!check) writeFileSync("data/landscape.json", JSON.stringify(data, null, 1) + "\n");
  } else {
    console.log(`${errors.length} errors, ${warns.length} warnings`);
  }
  process.exit(errors.length ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
