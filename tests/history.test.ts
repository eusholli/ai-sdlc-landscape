import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { recordHistory, retrievedOnly } from "@/scripts/history";

let dir = "";
afterEach(() => { if (dir) rmSync(dir, { recursive: true, force: true }); dir = ""; });

const RECORD = `id: a
name: A
sources:
  - {field: summary, url: https://a.example/, retrieved: 2026-01-02}
`;

/** A throwaway repo; each commit is made by `who` on `date`. */
function repo() {
  dir = mkdtempSync(join(tmpdir(), "history-"));
  mkdirSync(join(dir, "data/tools"), { recursive: true });
  const git = (...args: string[]) => execFileSync("git", ["-C", dir, ...args], { encoding: "utf8" });
  git("init", "-q");
  const commit = (who: string, date: string, msg = "change") => {
    git("add", "-A");
    execFileSync("git", ["-C", dir, "-c", `user.name=${who}`, "-c", "user.email=x@example.com", "commit", "-q", "-m", msg], {
      env: { ...process.env, GIT_AUTHOR_DATE: `${date}T12:00:00Z`, GIT_COMMITTER_DATE: `${date}T12:00:00Z` },
    });
    return git("rev-parse", "HEAD").trim();
  };
  const file = (id: string) => join(dir, "data/tools", `${id}.yaml`);
  return { git, commit, file };
}

describe("record history", () => {
  it("is null outside a git checkout", () => {
    dir = mkdtempSync(join(tmpdir(), "history-"));
    expect(recordHistory(dir)).toBeNull();
  });

  it("records who added a record and who last edited it", () => {
    const { commit, file } = repo();
    writeFileSync(file("a"), RECORD);
    const first = commit("Ada", "2026-01-02");
    writeFileSync(file("a"), RECORD + "hq: London\n");
    const second = commit("Grace", "2026-02-03");
    expect(recordHistory(dir)!.get("a")).toEqual({
      added: "2026-01-02", added_by: "Ada", added_commit: first,
      edited: "2026-02-03", edited_by: "Grace", edited_commit: second,
    });
  });

  it("does not count a commit that only moves retrieved dates", () => {
    const { commit, file } = repo();
    writeFileSync(file("a"), RECORD);
    const first = commit("Ada", "2026-01-02");
    writeFileSync(file("a"), RECORD.replace("2026-01-02", "2026-03-04"));
    commit("Refresher", "2026-03-04");
    expect(recordHistory(dir)!.get("a")!.edited_commit).toBe(first);
  });

  it("does not count a commit listed in .git-blame-ignore-revs", () => {
    const { commit, file } = repo();
    writeFileSync(file("a"), RECORD);
    const first = commit("Ada", "2026-01-02");
    writeFileSync(file("a"), RECORD.replace("name: A", "name:  A"));
    const bulk = commit("Formatter", "2026-03-04");
    writeFileSync(join(dir, ".git-blame-ignore-revs"), `# reformat\n${bulk}\n`);
    commit("Ada", "2026-03-05", "ignore the reformat");
    expect(recordHistory(dir)!.get("a")!.edited_commit).toBe(first);
  });

  it("keeps the history of a record whose id is renamed", () => {
    const { commit, file } = repo();
    writeFileSync(file("a"), RECORD);
    const first = commit("Ada", "2026-01-02");
    writeFileSync(file("b"), readFileSync(file("a"), "utf8").replace("id: a", "id: b"));
    rmSync(file("a"));
    const moved = commit("Grace", "2026-02-03");
    const h = recordHistory(dir)!;
    expect(h.has("a")).toBe(false);
    expect(h.get("b")).toMatchObject({ added_commit: first, added_by: "Ada", edited_commit: moved });
  });

  it("forgets a deleted record", () => {
    const { commit, file } = repo();
    writeFileSync(file("a"), RECORD);
    commit("Ada", "2026-01-02");
    renameSync(file("a"), join(dir, "elsewhere.yaml"));
    commit("Ada", "2026-01-03");
    expect(recordHistory(dir)!.has("a")).toBe(false);
  });

  it("tells a date refresh from a real change", () => {
    const line = "  - {field: summary, url: https://a.example/, retrieved: 2026-01-02}";
    expect(retrievedOnly([line], [line.replace("01-02", "05-06")])).toBe(true);
    expect(retrievedOnly([line], [line.replace("a.example", "b.example")])).toBe(false);
    expect(retrievedOnly([], ["hq: London"])).toBe(false);
  });
});
