import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { BATCH, changeLog, contributors, diffRecord, parseRequests, recordHistory, retrievedOnly } from "@/scripts/history";

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
      requested_by: [],
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

  it("credits the person who asked, from the Requested-by trailer, by name only", () => {
    const { commit, file } = repo();
    writeFileSync(file("a"), RECORD);
    commit("Ada", "2026-01-02", "Add A\n\nRequested-by: Linus <linus@example.com> (#7)");
    writeFileSync(file("a"), RECORD + "hq: London\n");
    commit("Ada", "2026-02-03", "Set the HQ\n\nCloses #9.\n\nRequested-by: Grace (#9)\nRequested-by: Linus (#9)");
    writeFileSync(file("a"), RECORD.replace("2026-01-02", "2026-03-04") + "hq: London\n");
    commit("Refresher", "2026-03-04", "Refresh\n\nRequested-by: Nobody (#11)");
    expect(recordHistory(dir)!.get("a")!.requested_by).toEqual([
      { name: "Linus", issue: 7 }, { name: "Grace", issue: 9 }, { name: "Linus", issue: 9 },
    ]);
    // The contributor list counts every request that changed the data, a date refresh included.
    expect(contributors(dir)).toEqual([
      { name: "Linus", issues: [7, 9], first: "2026-01-02" },
      { name: "Grace", issues: [9], first: "2026-02-03" },
      { name: "Nobody", issues: [11], first: "2026-03-04" },
    ]);
  });

  it("reads a Requested-by value only when it names an issue, and never keeps an email", () => {
    expect(parseRequests("Ada (#3)\x1fno issue here\x1fbob@example.com (#4)\x1fAda Lovelace ada@example.com (#5)")).toEqual([
      { name: "Ada", issue: 3 }, { name: "Ada Lovelace", issue: 5 },
    ]);
    expect(parseRequests("")).toEqual([]);
  });

  it("tells a date refresh from a real change", () => {
    const line = "  - {field: summary, url: https://a.example/, retrieved: 2026-01-02}";
    expect(retrievedOnly([line], [line.replace("01-02", "05-06")])).toBe(true);
    expect(retrievedOnly([line], [line.replace("a.example", "b.example")])).toBe(false);
    expect(retrievedOnly([], ["hq: London"])).toBe(false);
  });
});

describe("change log", () => {
  const rec = (id: string, extra = "") => RECORD.replace("id: a", `id: ${id}`).replace("name: A", `name: ${id.toUpperCase()}`) + extra;

  it("is null outside a git checkout", () => {
    dir = mkdtempSync(join(tmpdir(), "history-"));
    expect(changeLog(dir)).toBeNull();
  });

  it("folds a large first import into one batch entry", () => {
    const { commit, file } = repo();
    const ids = Array.from({ length: BATCH + 1 }, (_, i) => `t${String(i).padStart(2, "0")}`);
    for (const id of ids) writeFileSync(file(id), rec(id));
    const sha = commit("Ada", "2026-01-02");
    expect(changeLog(dir)).toEqual([{
      kind: "batch", date: "2026-01-02", commit: sha, author: "Ada", requested_by: [],
      tool: null, name: null, tools: ids,
    }]);
  });

  it("lists a single addition with who asked for it", () => {
    const { commit, file } = repo();
    writeFileSync(file("a"), rec("a"));
    commit("Ada", "2026-01-02", "Add A\n\nRequested-by: Lin <lin@example.com> (#4)");
    const [c] = changeLog(dir)!;
    expect(c).toMatchObject({ kind: "added", tool: "a", name: "A", requested_by: [{ name: "Lin", issue: 4 }] });
  });

  it("names the fields an edit published or changed, and the relations it added", () => {
    const { commit, file } = repo();
    writeFileSync(file("a"), rec("a", "hq: London\n"));
    commit("Ada", "2026-01-02");
    writeFileSync(file("a"), rec("a", "hq: Paris\nentry_price: Free\nrelations:\n  - {type: integrates_with, to: b}\n"));
    commit("Grace", "2026-02-03");
    expect(changeLog(dir)![1]).toMatchObject({
      kind: "updated", tool: "a", author: "Grace",
      fields: ["entry_price", "hq"], published: ["entry_price"],
      relations_added: [{ type: "integrates_with", to: "b" }],
    });
  });

  it("records a status change with the new text", () => {
    const { commit, file } = repo();
    writeFileSync(file("a"), rec("a"));
    commit("Ada", "2026-01-02");
    writeFileSync(file("a"), rec("a", "status: shut down\n"));
    commit("Ada", "2026-02-03");
    expect(changeLog(dir)![1]).toMatchObject({ kind: "updated", status: "shut down", published: ["status"] });
  });

  it("leaves out retrieved-only and formatting-only commits", () => {
    const { commit, file } = repo();
    writeFileSync(file("a"), rec("a"));
    commit("Ada", "2026-01-02");
    writeFileSync(file("a"), rec("a").replace("2026-01-02", "2026-03-04"));
    commit("Refresher", "2026-03-04");
    writeFileSync(file("a"), "# a comment\n" + rec("a").replace("2026-01-02", "2026-03-04"));
    commit("Formatter", "2026-03-05");
    expect(changeLog(dir)!.map((c) => c.kind)).toEqual(["added"]);
  });

  it("records renames and removals", () => {
    const { commit, file } = repo();
    writeFileSync(file("a"), rec("a"));
    writeFileSync(file("c"), rec("c"));
    commit("Ada", "2026-01-02");
    writeFileSync(file("b"), rec("a").replace("id: a", "id: b"));
    rmSync(file("a"));
    rmSync(file("c"));
    commit("Grace", "2026-02-03");
    const later = changeLog(dir)!.filter((c) => c.date === "2026-02-03");
    expect(later.map((c) => [c.kind, c.tool, c.from ?? null, c.name])).toEqual(
      expect.arrayContaining([["renamed", "b", "a", "A"], ["removed", "c", null, "C"]]));
  });
});

describe("diffRecord", () => {
  it("ignores source dates but notices a new source", () => {
    const src = (d: string, url = "https://a.example/") => ({ sources: [{ field: "summary", url, retrieved: d }] });
    expect(diffRecord(src("2026-01-01"), src("2026-02-02"))).toBeNull();
    expect(diffRecord(src("2026-01-01"), src("2026-01-01", "https://b.example/"))).toEqual({ fields: ["sources"], published: [] });
  });

  it("treats unknown and empty values as not published", () => {
    expect(diffRecord({ hq: "unknown" }, { hq: "" })).toBeNull();
    expect(diffRecord({ hq: "unknown" }, { hq: "Oslo" })).toEqual({ fields: ["hq"], published: ["hq"] });
  });

  it("reports a cleared status as null", () => {
    expect(diffRecord({ status: "preview" }, {})).toMatchObject({ fields: ["status"], status: null });
  });
});
