// Who added each record and who last changed it, read from git rather than stored in the record,
// so it cannot drift or be set by hand.
//
// One `git log` pass over data/tools/ (renames followed) gives every record its first commit and
// its last edit. Two kinds of commit do not count as an edit: one that only moves `retrieved:`
// dates (what `pnpm data:links --refresh` writes), and one listed in .git-blame-ignore-revs, the
// usual home for bulk reformatting. The author is used, not the committer, because a GitHub squash
// merge commits as GitHub. Names only: an email address never reaches the site.
//
// A change made from an issue carries a `Requested-by: <name> (#<issue>)` trailer, so the person
// who asked is credited on the record and in the list of contributors, though the maintainer made
// the commit.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

export interface Request { name: string; issue: number }

export interface History {
  added: string; added_by: string; added_commit: string;
  edited: string; edited_by: string; edited_commit: string;
  /** Who asked for the counted changes to this record, oldest first. */
  requested_by: Request[];
}

export interface Contributor { name: string; issues: number[]; first: string }

interface Commit { sha: string; author: string; date: string; requests: Request[] }

const git = (root: string, args: string[]) =>
  execFileSync("git", ["-C", root, ...args], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });

const RETRIEVED = /,?\s*retrieved:\s*\d{4}-\d{2}-\d{2}/g;

const TRAILER = "%(trailers:key=Requested-by,valueonly,separator=%x1f)";

/**
 * Parse `Requested-by:` values. A value without an issue number is dropped, and anything that
 * looks like an email is cut out, so only a name reaches the site.
 */
export function parseRequests(raw: string): Request[] {
  const out: Request[] = [];
  for (const v of raw.split("\x1f")) {
    const m = v.trim().match(/^(.*?)\s*\(#(\d+)\)$/);
    if (!m) continue;
    const name = m[1].replace(/<[^>]*>/g, "").replace(/\S+@\S+/g, "").replace(/\s+/g, " ").trim();
    if (name) out.push({ name, issue: Number(m[2]) });
  }
  return out;
}

const addRequests = (list: Request[], more: Request[]) => {
  const out = [...list];
  for (const r of more) if (!out.some((o) => o.name === r.name && o.issue === r.issue)) out.push(r);
  return out;
};

/** True when a file's changed lines differ only in their `retrieved:` dates. */
export function retrievedOnly(removed: string[], added: string[]): boolean {
  if (removed.length !== added.length) return false;
  const norm = (ls: string[]) => ls.map((l) => l.replace(RETRIEVED, "")).sort();
  const a = norm(removed), b = norm(added);
  return a.every((l, i) => l === b[i]);
}

/**
 * Makes sure the checkout has full history. False when `root` is not inside a git checkout (a
 * scratch copy in a test, say). Throws when the checkout stays shallow: a shallow clone makes its
 * oldest commit look like the one that added every record, and a wrong date reads as true.
 */
function fullHistory(root: string): boolean {
  try { git(root, ["rev-parse", "--git-dir"]); } catch { return false; }
  const shallow = () => git(root, ["rev-parse", "--is-shallow-repository"]).trim() === "true";
  if (shallow()) {
    // Vercel clones shallow and leaves no usable remote, but names the repo, which is public.
    const { VERCEL_GIT_PROVIDER: provider, VERCEL_GIT_REPO_OWNER: owner, VERCEL_GIT_REPO_SLUG: slug } = process.env;
    const sources = [[], provider === "github" && owner && slug ? [`https://github.com/${owner}/${slug}.git`] : null];
    const errors: string[] = [];
    for (const src of sources) {
      if (!src || !shallow()) continue;
      try { git(root, ["fetch", "--unshallow", "--quiet", ...src]); } catch (e) { errors.push((e as Error).message.split("\n")[0]); }
    }
    if (shallow()) {
      throw new Error(`the git checkout is shallow, so record history would be wrong; fetch full history first${errors.length ? ` (${errors.join("; ")})` : ""}`);
    }
    console.log("history: the checkout was shallow; fetched full history");
  }
  return true;
}

/** One record file touched by one commit. */
interface FileEvent {
  c: Commit;
  oldId?: string; newId?: string;
  oldPath: string; newPath: string;
  deleted: boolean;
  /** False for a commit that only moves `retrieved:` dates or is listed in .git-blame-ignore-revs. */
  counts: boolean;
}

/** Every change to a record file, oldest first, with renames followed. */
function fileEvents(root: string): FileEvent[] {
  const top = git(root, ["rev-parse", "--show-toplevel"]).trim();
  const ignorePath = join(top, ".git-blame-ignore-revs");
  const ignored = new Set(existsSync(ignorePath)
    ? readFileSync(ignorePath, "utf8").split("\n").map((l) => l.trim()).filter((l) => /^[0-9a-f]{7,40}$/.test(l))
    : []);
  const isIgnored = (sha: string) => [...ignored].some((i) => sha.startsWith(i));

  // Oldest first, so a rename carries what came before it.
  const log = git(root, ["log", "--reverse", "-M", `--format=%x00%H%x09%an%x09%as%x09${TRAILER}`, "--unified=0",
    "-p", "--", "data/tools"]);
  const idOf = (p: string) => p.match(/^data\/tools\/(.+)\.yaml$/)?.[1];
  const out: FileEvent[] = [];

  for (const chunk of log.split("\x00").slice(1)) {
    const [head, ...rest] = chunk.split("\n");
    const [sha, author, date, trailers = ""] = head.split("\t");
    const c: Commit = { sha, author, date, requests: parseRequests(trailers) };
    // One section per file: "diff --git a/X b/Y", then the rename or new-file lines, then hunks.
    for (const section of rest.join("\n").split(/^diff --git /m).slice(1)) {
      const lines = section.split("\n");
      const from = lines.find((l) => l.startsWith("--- "))?.slice(4) ?? "";
      const to = lines.find((l) => l.startsWith("+++ "))?.slice(4) ?? "";
      const renameFrom = lines.find((l) => l.startsWith("rename from "))?.slice(12);
      const renameTo = lines.find((l) => l.startsWith("rename to "))?.slice(10);
      const oldPath = renameFrom ?? from.replace(/^a\//, "");
      const newPath = renameTo ?? to.replace(/^b\//, "");
      const oldId = idOf(oldPath), newId = idOf(newPath);
      const body = lines.filter((l) => !l.startsWith("--- ") && !l.startsWith("+++ "));
      const removed = body.filter((l) => l.startsWith("-")).map((l) => l.slice(1));
      const added = body.filter((l) => l.startsWith("+")).map((l) => l.slice(1));
      // A rename changes the id, which is an edit even when no line moved.
      const counts = !isIgnored(c.sha) && (oldId !== newId || !retrievedOnly(removed, added));
      out.push({ c, oldId, newId, oldPath, newPath, deleted: to === "/dev/null", counts });
    }
  }
  return out;
}

/** History per record id, or null when `root` is not inside a git checkout. */
export function recordHistory(root = "."): Map<string, History> | null {
  if (!fullHistory(root)) return null;
  const out = new Map<string, History>();
  for (const { c, oldId, newId, deleted, counts } of fileEvents(root)) {
    if (deleted) { if (oldId) out.delete(oldId); continue; }
    if (!newId) continue;
    const prior = oldId ? out.get(oldId) : undefined;
    if (oldId && oldId !== newId) out.delete(oldId);
    if (!prior) {
      out.set(newId, {
        added: c.date, added_by: c.author, added_commit: c.sha,
        edited: c.date, edited_by: c.author, edited_commit: c.sha,
        requested_by: c.requests,
      });
      continue;
    }
    out.set(newId, counts
      ? { ...prior, edited: c.date, edited_by: c.author, edited_commit: c.sha, requested_by: addRequests(prior.requested_by, c.requests) }
      : prior);
  }
  return out;
}

/** A commit that adds more records than this is one batch, such as the first import. */
export const BATCH = 20;

export interface RelationRef { type: string; to: string }

/** One change to the data, as the change log on the site shows it. */
export interface Change {
  kind: "batch" | "added" | "updated" | "renamed" | "removed";
  date: string; commit: string; author: string;
  requested_by: Request[];
  /** The record's id after the change; null for a batch. */
  tool: string | null;
  /** Its name as the record gave it then, so a removed record still reads. */
  name: string | null;
  /** A batch: the ids it added. */
  tools?: string[];
  /** A rename: the old id. */
  from?: string;
  /** Fields whose value changed. Those also in `published` had no value before. */
  fields?: string[];
  published?: string[];
  relations_added?: RelationRef[];
  relations_removed?: RelationRef[];
  /** The new status text, when the status changed; null when it was cleared. */
  status?: string | null;
}

type Yaml = Record<string, unknown>;

const blank = (v: unknown) =>
  v == null || v === "" || v === "unknown" || (Array.isArray(v) && v.length === 0) ||
  (typeof v === "object" && !Array.isArray(v) && Object.keys(v as object).length === 0);

// Fields that are bookkeeping rather than facts. Sources are compared without their dates.
const NOT_FACTS = new Set(["id", "sources", "relations"]);

const relKeys = (y: Yaml): Map<string, RelationRef> => new Map(
  (Array.isArray(y.relations) ? y.relations as RelationRef[] : [])
    .filter((r) => r && typeof r === "object")
    .map((r) => [`${r.type} ${r.to}`, { type: String(r.type), to: String(r.to) }]));

const sourceKeys = (y: Yaml): string =>
  JSON.stringify((Array.isArray(y.sources) ? y.sources as { field?: string; url?: string }[] : [])
    .map((s) => `${s?.field} ${s?.url}`).sort());

/** What changed between two versions of a record, or null when no fact did. */
export function diffRecord(before: Yaml, after: Yaml):
  Pick<Change, "fields" | "published" | "relations_added" | "relations_removed" | "status"> | null {
  const fields: string[] = [], published: string[] = [];
  for (const k of [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()) {
    if (NOT_FACTS.has(k)) continue;
    const a = blank(before[k]) ? null : before[k], b = blank(after[k]) ? null : after[k];
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    fields.push(k);
    if (a === null) published.push(k);
  }
  if (sourceKeys(before) !== sourceKeys(after)) fields.push("sources");
  const rb = relKeys(before), ra = relKeys(after);
  const relations_added = [...ra].filter(([k]) => !rb.has(k)).map(([, r]) => r);
  const relations_removed = [...rb].filter(([k]) => !ra.has(k)).map(([, r]) => r);
  if (!fields.length && !relations_added.length && !relations_removed.length) return null;
  const out: ReturnType<typeof diffRecord> = { fields, published };
  if (relations_added.length) out!.relations_added = relations_added;
  if (relations_removed.length) out!.relations_removed = relations_removed;
  if (fields.includes("status")) out!.status = blank(after.status) ? null : String(after.status);
  return out;
}

/**
 * Every counted change to the records, oldest first, or null outside a git checkout. A commit
 * that adds more than BATCH records is one `batch` entry. A commit whose only changes are
 * bookkeeping (formatting, comments) is left out, as are the commits recordHistory skips.
 */
export function changeLog(root = "."): Change[] | null {
  if (!fullHistory(root)) return null;
  const show = (sha: string, path: string): Yaml => {
    try { return (parse(git(root, ["show", `${sha}:${path}`])) ?? {}) as Yaml; } catch { return {}; }
  };
  const events = fileEvents(root);
  const out: Change[] = [];
  const base = (e: FileEvent) => ({
    date: e.c.date, commit: e.c.sha, author: e.c.author, requested_by: e.c.requests,
  });
  const name = (y: Yaml) => (blank(y.name) ? null : String(y.name));

  for (let i = 0; i < events.length;) {
    const sha = events[i].c.sha;
    let j = i;
    while (j < events.length && events[j].c.sha === sha) j++;
    const commit = events.slice(i, j);
    i = j;
    const adds = commit.filter((e) => e.newId && !e.deleted && e.oldPath === "/dev/null");
    if (adds.length > BATCH) {
      out.push({ kind: "batch", ...base(adds[0]), tool: null, name: null, tools: adds.map((e) => e.newId!).sort() });
    }
    for (const e of commit) {
      if (!e.counts) continue;
      if (e.deleted) {
        if (e.oldId) out.push({ kind: "removed", ...base(e), tool: e.oldId, name: name(show(`${sha}^`, e.oldPath)) });
        continue;
      }
      if (!e.newId) continue;
      const after = show(sha, e.newPath);
      if (e.oldPath === "/dev/null") {
        if (adds.length <= BATCH) out.push({ kind: "added", ...base(e), tool: e.newId, name: name(after) });
        continue;
      }
      const diff = diffRecord(show(`${sha}^`, e.oldPath), after);
      if (e.oldId !== e.newId) {
        out.push({ kind: "renamed", ...base(e), tool: e.newId, name: name(after), from: e.oldId, ...diff });
      } else if (diff) {
        out.push({ kind: "updated", ...base(e), tool: e.newId, name: name(after), ...diff });
      }
    }
  }
  return out;
}

/** The commit the data was built from, or null outside a git checkout. */
export function headCommit(root = "."): string | null {
  try { return git(root, ["rev-parse", "HEAD"]).trim(); } catch { return null; }
}

/**
 * Everyone whose request changed the data, with the issues they raised, in the order they first
 * did. Null outside a git checkout. Assumes the checkout is full; recordHistory makes it so.
 */
export function contributors(root = "."): Contributor[] | null {
  try { git(root, ["rev-parse", "--git-dir"]); } catch { return null; }
  const log = git(root, ["log", "--reverse", `--format=%as%x09${TRAILER}`, "--", "data"]);
  const byName = new Map<string, Contributor>();
  for (const line of log.split("\n")) {
    const [date, trailers = ""] = line.split("\t");
    for (const r of parseRequests(trailers)) {
      const c = byName.get(r.name) ?? { name: r.name, issues: [], first: date };
      if (!c.issues.includes(r.issue)) c.issues.push(r.issue);
      byName.set(r.name, c);
    }
  }
  return [...byName.values()];
}
