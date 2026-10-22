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
 * History per record id, or null when `root` is not inside a git checkout (a scratch copy in a
 * test, say). Throws when the checkout is shallow: a shallow clone makes its oldest commit look
 * like the one that added every record, and a wrong date reads as true.
 */
export function recordHistory(root = "."): Map<string, History> | null {
  try { git(root, ["rev-parse", "--git-dir"]); } catch { return null; }
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
  const top = git(root, ["rev-parse", "--show-toplevel"]).trim();
  const ignorePath = join(top, ".git-blame-ignore-revs");
  const ignored = new Set(existsSync(ignorePath)
    ? readFileSync(ignorePath, "utf8").split("\n").map((l) => l.trim()).filter((l) => /^[0-9a-f]{7,40}$/.test(l))
    : []);
  const isIgnored = (sha: string) => [...ignored].some((i) => sha.startsWith(i));

  // Oldest first, so a rename carries what came before it.
  const log = git(root, ["log", "--reverse", "-M", `--format=%x00%H%x09%an%x09%as%x09${TRAILER}`, "--unified=0",
    "-p", "--", "data/tools"]);
  const out = new Map<string, History>();
  const idOf = (p: string) => p.match(/^data\/tools\/(.+)\.yaml$/)?.[1];

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
      const oldId = idOf(renameFrom ?? from.replace(/^a\//, ""));
      const newId = idOf(renameTo ?? to.replace(/^b\//, ""));
      if (to === "/dev/null") { if (oldId) out.delete(oldId); continue; }
      if (!newId) continue;
      const prior = oldId ? out.get(oldId) : undefined;
      if (oldId && oldId !== newId) out.delete(oldId);
      const body = lines.filter((l) => !l.startsWith("--- ") && !l.startsWith("+++ "));
      const removed = body.filter((l) => l.startsWith("-")).map((l) => l.slice(1));
      const added = body.filter((l) => l.startsWith("+")).map((l) => l.slice(1));
      if (!prior) {
        out.set(newId, {
          added: c.date, added_by: c.author, added_commit: c.sha,
          edited: c.date, edited_by: c.author, edited_commit: c.sha,
          requested_by: c.requests,
        });
        continue;
      }
      // A rename changes the id, which is an edit even when no line moved.
      const counts = !isIgnored(c.sha) && (oldId !== newId || !retrievedOnly(removed, added));
      out.set(newId, counts
        ? { ...prior, edited: c.date, edited_by: c.author, edited_commit: c.sha, requested_by: addRequests(prior.requested_by, c.requests) }
        : prior);
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
