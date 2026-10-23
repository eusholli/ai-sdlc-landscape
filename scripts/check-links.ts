// Check that every source URL in data/tools/ still answers. Needs the network, so it is not part
// of `pnpm check`.
//
//   pnpm data:links              # every record
//   pnpm data:links --changed    # only records changed against origin/main (for a PR)
//   pnpm data:links --refresh    # also set `retrieved` to today on each source that answered
//
// 403, 419 and 429 mean the site refused an automated fetch, not that the page is gone, so they are
// reported as blocked and do not fail the run. Anything else that is not 2xx after redirects fails.
// A `repo` source on the vendor's own site must also link to the repo's GitHub account, since that
// link is what makes the account the vendor's; a page that answers without it fails too.
// The package script raises Node's header limit: some vendor sites send more than its 16 KB default.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseDocument } from "yaml";

const DIR = "data/tools";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
const BLOCKED = new Set([401, 403, 419, 429, 999]);

const why = new Map<string, string>();

async function status(url: string): Promise<number> {
  for (const method of ["HEAD", "GET"]) {
    try {
      const r = await fetch(url, { method, headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(20_000) });
      // An unread body holds its connection open, and the next requests to that host stall.
      await r.body?.cancel();
      if (r.ok || method === "GET") return r.status;
    } catch (e) {
      const err = e as Error & { cause?: { code?: string } };
      why.set(url, err.cause?.code ?? err.name);
      if (method === "GET") return 0;
    }
  }
  return 0;
}

/** Whether the page links to github.com/<owner>, the account that `repo` names. Null when unread. */
async function linksTo(url: string, owner: string): Promise<boolean | null> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(20_000) });
    if (!r.ok) { await r.body?.cancel(); return null; }
    const esc = owner.replace(/[.]/g, "\\.");
    return new RegExp(`github\\.com/${esc}(?=[/"'?#\\s]|$)`, "i").test(await r.text());
  } catch { return null; }
}

function files(changed: boolean): string[] {
  const all = readdirSync(DIR).filter((f) => f.endsWith(".yaml"));
  if (!changed) return all;
  const diff = execFileSync("git", ["diff", "--name-only", "origin/main", "--", DIR], { encoding: "utf8" });
  const touched = new Set(diff.split("\n").filter(Boolean).map((p) => p.slice(DIR.length + 1)));
  return all.filter((f) => touched.has(f));
}

async function main() {
  const changed = process.argv.includes("--changed"), refresh = process.argv.includes("--refresh");
  const today = new Date().toISOString().slice(0, 10);
  const docs = files(changed).map((f) => ({ f, doc: parseDocument(readFileSync(join(DIR, f), "utf8")) }));
  const urls = [...new Set(docs.flatMap(({ doc }) =>
    ((doc.toJS().sources ?? []) as { url: string }[]).map((s) => s.url)))];

  const result = new Map<string, number>();
  const queue = [...urls];
  await Promise.all(Array.from({ length: 4 }, async () => {
    for (let u = queue.shift(); u; u = queue.shift()) result.set(u, await status(u));
  }));

  const unlinked: string[] = [];
  for (const { f, doc } of docs) {
    const t = doc.toJS() as { repo?: string; sources?: { field: string; url: string }[] };
    if (!t.repo) continue;
    const owner = new URL(t.repo).pathname.split("/")[1];
    for (const s of (t.sources ?? []).filter((x) => x.field === "repo" && !x.url.startsWith("https://github.com/"))) {
      if ((await linksTo(s.url, owner)) === false) unlinked.push(`${f}: ${s.url} does not link to github.com/${owner}`);
    }
  }
  for (const u of unlinked) console.log(`UNLINKED ${u}`);

  const dead = urls.filter((u) => { const s = result.get(u)!; return !(s >= 200 && s < 300) && !BLOCKED.has(s); });
  const blocked = urls.filter((u) => BLOCKED.has(result.get(u)!));
  for (const u of blocked) console.log(`blocked ${result.get(u)} ${u}`);
  for (const u of dead) console.log(`DEAD    ${result.get(u) || `no answer (${why.get(u)})`} ${u}`);

  if (refresh) {
    for (const { f, doc } of docs) {
      let touched = false;
      for (const s of (doc.get("sources") as { items: { get(k: string): unknown; set(k: string, v: unknown): void }[] } | undefined)?.items ?? []) {
        const st = result.get(String(s.get("url")));
        if (st && st >= 200 && st < 300 && s.get("retrieved") !== today) { s.set("retrieved", today); touched = true; }
      }
      if (touched) writeFileSync(join(DIR, f), doc.toString({ lineWidth: 0, flowCollectionPadding: false }));
    }
  }
  console.log(`${urls.length} URLs in ${docs.length} records: ${urls.length - dead.length - blocked.length} ok, ` +
    `${blocked.length} blocked, ${dead.length} dead, ${unlinked.length} repo sources unlinked`);
  process.exit(dead.length || unlinked.length ? 1 : 0);
}

main();
