// Fetch a logo for each record into public/logos/<id>.<ext>.
//
//   pnpm logos            # fill gaps only: an existing logo is kept
//   pnpm logos --force    # fetch every logo again
//
// For each record it reads the vendor homepage, takes the largest declared apple-touch-icon or
// icon link, falls back to /apple-touch-icon.png and /favicon.ico, and saves it. Only the vendor's
// own site is used; no third-party logo service. A tool with no icon gets none, and the site draws
// a monogram.
import { mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const OUT = "public/logos";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
const TYPES: Record<string, string> = {
  "image/png": "png", "image/svg+xml": "svg", "image/x-icon": "ico", "image/vnd.microsoft.icon": "ico",
  "image/jpeg": "jpg", "image/webp": "webp",
};
const EXTS = new Set(Object.values(TYPES));

const get = (url: string) =>
  fetch(url, { headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(15_000) });
const host = (u: string) => new URL(u).host.replace(/^www\./, "");
const attr = (tag: string, name: string) => tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1] ?? "";

function sizeOf(tag: string): number {
  const m = attr(tag, "sizes").match(/(\d+)x\d+/);
  if (m) return Number(m[1]);
  if (attr(tag, "href").toLowerCase().endsWith(".svg")) return 512;
  return attr(tag, "rel").toLowerCase().includes("apple-touch-icon") ? 180 : 32;
}

async function candidates(url: string): Promise<string[]> {
  // A project hosted on github.com would otherwise get GitHub's own mark: use its owner's avatar.
  const gh = url.match(/^https:\/\/github\.com\/([^/]+)\//);
  if (gh && !["github", "features"].includes(gh[1].toLowerCase())) return [`https://github.com/${gh[1]}.png?size=256`];
  const out: string[] = [];
  let base = url;
  try {
    const r = await get(url);
    base = r.url;
    const tags = ((await r.text()).match(/<link\b[^>]*>/gi) ?? []).filter((t) => attr(t, "rel").toLowerCase().includes("icon"));
    tags.sort((a, b) => sizeOf(b) - sizeOf(a));
    for (const t of tags) if (attr(t, "href")) out.push(new URL(attr(t, "href"), base).href);
  } catch { /* fall through to the conventional paths */ }
  out.push(new URL("/apple-touch-icon.png", base).href, new URL("/favicon.ico", base).href);
  return [...new Set(out)];
}

const existing = (id: string) => readdirSync(OUT).filter((n) => n.slice(0, n.lastIndexOf(".")) === id);
const clear = (id: string) => existing(id).forEach((n) => unlinkSync(join(OUT, n)));

async function fetchOne(t: { id: string; url: string }, force: boolean, acquired: Set<string>): Promise<string> {
  if (!force && existing(t.id).length) return "kept";
  // An acquired product whose site now redirects to its buyer would show the buyer's mark.
  // graphite.dev to graphite.com is a rebrand; tabnine.com to tricentis.com is a move.
  if (acquired.has(t.id)) {
    try {
      const r = await get(t.url);
      if (host(r.url).split(".").at(-2) !== host(t.url).split(".").at(-2)) {
        clear(t.id);
        return "none";
      }
    } catch { /* keep going */ }
  }
  for (const u of await candidates(t.url)) {
    if (u.startsWith("data:")) continue;
    let r: Response;
    try { r = await get(u); } catch { continue; }
    const ctype = (r.headers.get("content-type") ?? "").split(";")[0].trim();
    const ext = TYPES[ctype] ?? (u.slice(-5).includes(".") ? u.split(".").at(-1)!.toLowerCase() : "");
    const body = Buffer.from(await r.arrayBuffer());
    if (r.status !== 200 || !EXTS.has(ext) || body.length < 100) continue;
    clear(t.id);
    writeFileSync(join(OUT, `${t.id}.${ext}`), body);
    return `${ext} ${body.length}B`;
  }
  return "none";
}

async function main() {
  const force = process.argv.includes("--force");
  mkdirSync(OUT, { recursive: true });
  const recs = readdirSync("data/tools").filter((f) => f.endsWith(".yaml"))
    .map((f) => parse(readFileSync(join("data/tools", f), "utf8")) as { id: string; url: string; relations?: { type: string }[] })
    .map((r) => ({ ...r, id: String(r.id) }));
  const acquired = new Set(recs.filter((r) => r.relations?.some((x) => x.type === "acquired_by")).map((r) => r.id));
  const results: [string, string][] = [];
  const queue = [...recs];
  await Promise.all(Array.from({ length: 12 }, async () => {
    for (let t = queue.shift(); t; t = queue.shift()) results.push([t.id, await fetchOne(t, force, acquired)]);
  }));
  const missing = results.filter(([, s]) => s === "none").map(([id]) => id).sort();
  console.log(`${recs.length - missing.length} of ${recs.length} have a logo; none for: ${missing.join(", ") || "-"}`);
}

main();
