// Look for AI SDLC tools the landscape does not hold yet.
//
//   pnpm scan                  # search, read what the results link to, write .scan/<date>.md
//   pnpm scan --max-pages 80   # read fewer pages (default 250)
//   pnpm scan --fresh          # search again even if today's results are saved in .scan/
//
// For each query in data/scan.yaml it asks a search API for 20 results, then reads every result
// page and collects the sites it links to. A site scores one point for each other site whose pages
// name it, counted once per site so one blog's share buttons and footer do not add up, and two for
// each time it is itself a search result. Sites a record already names (its url or any of its
// sources), sites rejected in data/screened.yaml, ignore_hosts and the trade press list are
// dropped; the rest, best first, are the candidates. A candidate whose title or link text carries a
// record's name is flagged, not dropped. Entries deferred in screened.yaml are listed again at the
// end for another look.
//
// The output is a list for a person to judge against the inclusion bar in CONTRIBUTING.md, and
// docs/scan.md says how. A scan never writes a record or touches data/.
//
// Needs SERPER_API_KEY (serper.dev) in .env.local or the environment. Without it, the scan prints
// the queries so they can be run by hand, and stops.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { parse } from "yaml";
import { TRADE_PRESS } from "./build-data";

config({ path: ".env.local", quiet: true });

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
const LIST_MAX = 100;

export const hostOf = (u: string) => {
  try { return new URL(u).host.toLowerCase().replace(/^www\./, ""); } catch { return ""; }
};
/** True when `h` is `known` or one of its subdomains. */
const under = (h: string, known: string) => h === known || h.endsWith("." + known);

interface Screened { name: string; url: string; decision: "rejected" | "deferred"; reason: string; date: string }
interface Candidate { host: string; direct: number; sites: Set<string>; pages: Set<string>; anchors: Map<string, number>; title?: string }
const score = (c: Candidate) => 2 * c.direct + c.sites.size;

/** Every external host an HTML page links to, with the link text used for it. */
export function links(html: string, pageUrl: string): { host: string; text: string }[] {
  const self = hostOf(pageUrl);
  const out: { host: string; text: string }[] = [];
  for (const m of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    let url: URL;
    try { url = new URL(m[1], pageUrl); } catch { continue; }
    if (!/^https?:$/.test(url.protocol)) continue;
    const h = url.host.toLowerCase().replace(/^www\./, "");
    if (!h || h === self) continue;
    out.push({ host: h, text: m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 60) });
  }
  return out;
}

/** Twenty results, or ten when the account refuses twenty for this query (free Serper plans do). */
async function search(q: string, key: string): Promise<{ title: string; link: string }[]> {
  let last = "";
  for (const num of [20, 10]) {
    const r = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": key, "Content-Type": "application/json" },
      body: JSON.stringify({ q, num }),
      signal: AbortSignal.timeout(30_000),
    });
    if (r.ok) return ((await r.json()).organic ?? []) as { title: string; link: string }[];
    last = `${r.status} ${(await r.text()).slice(0, 120)}`;
    if (r.status !== 400) break;
  }
  throw new Error(last);
}

async function page(url: string): Promise<string> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(15_000) });
    if (!r.ok || !(r.headers.get("content-type") ?? "").includes("html")) { await r.body?.cancel(); return ""; }
    return (await r.text()).slice(0, 2_000_000);
  } catch { return ""; }
}

async function pool<T>(items: T[], n: number, fn: (t: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(Array.from({ length: n }, async () => { for (let t = queue.shift(); t !== undefined; t = queue.shift()) await fn(t); }));
}

const cell = (s: string) => s.replace(/\|/g, "/").replace(/\s+/g, " ").trim();

async function main() {
  const arg = (name: string) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
  const maxPages = Number(arg("--max-pages") ?? 250);
  const year = String(new Date().getUTCFullYear());
  const today = new Date().toISOString().slice(0, 10);

  const cfg = parse(readFileSync("data/scan.yaml", "utf8")) as { queries: string[]; ignore_hosts: string[] };
  const queries = cfg.queries.map((q) => q.replaceAll("{year}", year));
  const key = process.env.SERPER_API_KEY;
  if (!key) {
    console.log("No SERPER_API_KEY, so no search was run. Run these by hand, or add the key to .env.local:\n");
    for (const q of queries) console.log(`  ${q}`);
    return;
  }

  const records = readdirSync("data/tools").filter((f) => f.endsWith(".yaml"))
    .map((f) => parse(readFileSync(join("data/tools", f), "utf8")) as { id: string; name?: string; url?: string; sources?: { url: string }[] });
  // A record's name seen in a candidate's title or link text (devin.ai, "Devin") is flagged, not
  // dropped: it may be the same product on another domain, or a new one with a similar name.
  const names = records.filter((r) => String(r.name ?? "").length >= 4)
    .map((r) => ({ id: String(r.id), re: new RegExp(`\\b${String(r.name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i") }));
  const looksLike = (c: Candidate) => {
    const text = [c.title ?? "", ...c.anchors.keys()].join(" | ");
    return names.filter((n) => n.re.test(text)).map((n) => n.id).slice(0, 3);
  };
  const screened = (parse(readFileSync("data/screened.yaml", "utf8")) ?? []) as Screened[];
  const known = new Set<string>([
    // A record's sources name its other domains (devin.ai beside cognition.ai), so they are known too.
    ...records.flatMap((r) => [String(r.url ?? ""), ...(r.sources ?? []).map((s) => s.url)]).map(hostOf),
    // A screened URL with a path (a repo, a blog post) names a project, not the whole site.
    ...screened.filter((s) => s.decision === "rejected" && /^https?:\/\/[^/]+\/?$/.test(s.url)).map((s) => hostOf(s.url)),
    ...cfg.ignore_hosts, ...TRADE_PRESS,
  ].filter(Boolean));
  const deferred = screened.filter((s) => s.decision === "deferred");
  const deferredHosts = new Set(deferred.map((s) => hostOf(s.url)));
  const skip = (h: string) => [...known].some((k) => under(h, k)) || deferredHosts.has(h);

  const found = new Map<string, Candidate>();
  const seenHosts = new Set<string>();
  const touch = (h: string) => {
    seenHosts.add(h);
    if (skip(h)) return undefined;
    let c = found.get(h);
    if (!c) found.set(h, (c = { host: h, direct: 0, sites: new Set(), pages: new Set(), anchors: new Map() }));
    return c;
  };

  const leads = new Set<string>();
  const failed: string[] = [];
  // Today's search results are saved, so a rerun to tune the filters costs no searches.
  mkdirSync(".scan", { recursive: true });
  const saved = `.scan/${today}.search.json`;
  const cache: Record<string, { title: string; link: string }[]> =
    !process.argv.includes("--fresh") && existsSync(saved) ? JSON.parse(readFileSync(saved, "utf8")) : {};
  for (const q of queries) {
    if (!cache[q]) {
      try { cache[q] = await search(q, key); } catch (e) { failed.push(`${q} (${(e as Error).message})`); continue; }
    }
    for (const r of cache[q]) {
      leads.add(r.link);
      const c = touch(hostOf(r.link));
      if (c) { c.direct += 1; c.anchors.set(r.title, (c.anchors.get(r.title) ?? 0) + 1); }
    }
  }
  writeFileSync(saved, JSON.stringify(cache));
  if (failed.length === queries.length) throw new Error(`every search failed, first: ${failed[0]}`);
  for (const f of failed) console.log(`search failed: ${f}`);
  console.log(`${queries.length - failed.length} of ${queries.length} queries, ${leads.size} result pages; reading up to ${maxPages}`);

  let read = 0;
  await pool([...leads].slice(0, maxPages), 4, async (url) => {
    const html = await page(url);
    if (html) read += 1;
    const perPage = new Set<string>();
    for (const { host, text } of links(html, url)) {
      const c = touch(host);
      if (!c) continue;
      if (text) c.anchors.set(text, (c.anchors.get(text) ?? 0) + 1);
      if (perPage.has(host)) continue;
      perPage.add(host);
      c.pages.add(url);
      c.sites.add(hostOf(url));
    }
  });

  // One site naming another is noise; a search hit, or two sites naming it, is a lead.
  const list = [...found.values()].filter((c) => c.direct > 0 || c.sites.size >= 2)
    .sort((a, b) => score(b) - score(a) || a.host.localeCompare(b.host)).slice(0, LIST_MAX);
  await pool(list, 8, async (c) => {
    const html = await page(`https://${c.host}/`);
    c.title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim().slice(0, 90);
  });

  const lines = [
    `# Scan ${today}`, "",
    `${queries.length - failed.length} of ${queries.length} queries, ${leads.size} result pages, ${read} read. ` +
      `${list.length} candidates, best first.`,
    ...(failed.length ? ["", "Searches that failed:", ...failed.map((f) => `- ${f}`)] : []),
    "Judge each against the inclusion bar in CONTRIBUTING.md, then add a record or a screened.yaml entry (docs/scan.md).", "",
    "| Score | Site | Its title | Named as | Seen on | Names a record |", "|---|---|---|---|---|---|",
    ...list.map((c) => {
      const named = [...c.anchors.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
      const seen = [...c.pages].slice(0, 2).map((u, i) => `[${i + 1}](${u})`).join(" ");
      return `| ${score(c)} | https://${c.host} | ${cell(c.title ?? "")} | ${cell(named)} | ${seen}${c.direct ? " (search hit)" : ""} | ` +
        `${looksLike(c).join(", ")} |`;
    }),
    "", "## Deferred, for another look", "",
    ...deferred.map((s) => `- ${s.name} (${s.url}): ${s.reason}, ${s.date}.${seenHosts.has(hostOf(s.url)) ? " Seen again in this scan." : ""}`),
    "",
  ];
  const out = `.scan/${today}.md`;
  writeFileSync(out, lines.join("\n"));
  console.log(`${list.length} candidates written to ${out}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e.message); process.exit(1); });
