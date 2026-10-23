import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parse } from "yaml";
import { buildLandscape, FRESH_DAYS, freshness, STALE_DAYS, tier } from "@/scripts/build-data";

type Node = { id: string; kind: string; sources: unknown[] };

let dir = "";
afterEach(() => { if (dir) rmSync(dir, { recursive: true, force: true }); dir = ""; });

// A record the tests own, so editing a real one never breaks them.
const FIXTURE = `id: fixture-tool
name: Fixture Tool
company: Fixture Co
url: https://fixture.example
primary_phase: plan
summary: A tool that exists only in tests.
entry_price: Free
sources:
  - {field: summary, url: https://fixture.example/, retrieved: 2026-01-02}
  - {field: entry_price, url: https://fixture.example/pricing, retrieved: 2026-01-02}
`;

/** A copy of data/ with the fixture record added, to break on purpose. */
function scratch(record: string): string {
  dir = mkdtempSync(join(tmpdir(), "landscape-"));
  cpSync("data", join(dir, "data"), { recursive: true });
  writeFileSync(join(dir, "data/tools/fixture-tool.yaml"), record);
  return dir;
}

describe("build-data", () => {
  it("builds the committed records with no errors, and drops none of them", () => {
    const { data, errors } = buildLandscape();
    expect(errors).toEqual([]);
    const records = readdirSync("data/tools").filter((f) => f.endsWith(".yaml"))
      .map((f) => parse(readFileSync(join("data/tools", f), "utf8")) as { relations?: unknown[]; sources?: unknown[] });
    const nodes = data!.nodes as Node[];
    expect(nodes.length).toBe(records.length);
    expect((data!.relations as unknown[]).length).toBe(records.reduce((s, r) => s + (r.relations?.length ?? 0), 0));
    expect(nodes.reduce((s, n) => s + n.sources.length, 0)).toBe(records.reduce((s, r) => s + (r.sources?.length ?? 0), 0));
  });

  it("fails a value with no source", () => {
    const root = scratch(FIXTURE.replace(/\n {2}- \{field: entry_price,[^\n]*/, ""));
    const { data, errors } = buildLandscape(root);
    expect(data).toBeNull();
    expect(errors).toContain("fixture-tool: entry_price has a value but no source");
  });

  it("fails a source with no retrieved date, and an unknown field", () => {
    const root = scratch(FIXTURE.replace(", retrieved: 2026-01-02}", "}") + "colour: blue\n");
    const { errors } = buildLandscape(root);
    expect(errors.some((e) => e.startsWith("fixture-tool: source for summary needs a retrieved date"))).toBe(true);
    expect(errors).toContain("fixture-tool: unknown field colour");
  });

  it("fails a screened entry that is also a record, or has no reason", () => {
    const root = scratch(FIXTURE);
    writeFileSync(join(root, "data/screened.yaml"),
      "- {name: Fixture Tool, url: https://fixture.example, decision: rejected, reason: x, date: 2026-01-02}\n" +
      "- {name: Other, url: https://other.example, decision: maybe, date: 2026-01-02}\n");
    const { errors } = buildLandscape(root);
    expect(errors).toContain("screened.yaml: Fixture Tool is also a record; delete one");
    expect(errors).toContain("screened.yaml: Other: decision must be rejected or deferred");
    expect(errors).toContain("screened.yaml: Other needs a reason");
  });

  it("fails a relation that lists the same source twice", () => {
    const url = "https://fixture.example/news";
    const root = scratch(FIXTURE + `relations:\n  - {type: integrates_with, to: github, sources: [${url}, ${url}]}\n`);
    expect(buildLandscape(root).errors).toContain("fixture-tool: relation integrates_with github lists a source twice");
  });

  it("accepts the fixture as written", () => {
    expect(buildLandscape(scratch(FIXTURE)).errors).toEqual([]);
  });

  it("tiers a source by who published it", () => {
    expect(tier("https://kiro.dev/pricing/", "https://kiro.dev")).toBe("A");
    expect(tier("https://techcrunch.com/2025/x", "https://kiro.dev")).toBe("B");
    expect(tier("https://example.org/x", "https://kiro.dev")).toBe("C");
  });

  it("counts GitHub as the vendor's only under the vendor's own account", () => {
    const repo = "https://github.com/fixture-co/fixture";
    expect(tier("https://github.com/Fixture-Co/fixture#readme", "https://fixture.example", repo)).toBe("A");
    expect(tier("https://github.com/fixture-co/fixture", "https://fixture.example")).toBe("C");
    expect(tier("https://github.com/someone-else/fixture", "https://fixture.example", repo)).toBe("C");
    // A tool that lives on GitHub owns its account, not the whole of github.com.
    expect(tier("https://github.com/fixture-co/other", "https://github.com/fixture-co/fixture")).toBe("A");
    expect(tier("https://github.com/someone-else/x", "https://github.com/fixture-co/fixture")).toBe("C");
    expect(tier("https://docs.github.com/x", "https://github.com/fixture-co/fixture")).toBe("C");
  });

  it("needs a repo for open source, named on the vendor's own site", () => {
    const oss = FIXTURE.replace("sources:\n", "open_source: true\nsources:\n") +
      "  - {field: open_source, url: https://fixture.example/, retrieved: 2026-01-02}\n";
    expect(buildLandscape(scratch(oss)).errors).toContain("fixture-tool: open_source needs a repo");
    const withRepo = (src: string) => oss.replace("sources:\n", "repo: https://github.com/fixture-co/fixture\nsources:\n") +
      `  - {field: repo, url: ${src}, retrieved: 2026-01-02}\n`;
    expect(buildLandscape(scratch(withRepo("https://fixture.example/"))).errors).toEqual([]);
    expect(buildLandscape(scratch(withRepo("https://example.org/fixture"))).errors)
      .toContain("fixture-tool: repo needs a source on the vendor's own site");
    expect(buildLandscape(scratch(withRepo("https://github.com/fixture-co/fixture"))).errors)
      .toContain("fixture-tool: repo needs a source on the vendor's own site");
  });

  it("keeps the repo of a tool on GitHub under the account in its url", () => {
    const onGithub = FIXTURE.replace("url: https://fixture.example\n", "url: https://github.com/fixture-co/fixture\n")
      .replace("sources:\n", "repo: https://github.com/someone-else/fixture\nsources:\n") +
      "  - {field: repo, url: https://github.com/fixture-co/fixture, retrieved: 2026-01-02}\n";
    const { errors } = buildLandscape(scratch(onGithub));
    expect(errors).toEqual(["fixture-tool: repo is not under the GitHub account in url"]);
    expect(buildLandscape(scratch(FIXTURE.replace("sources:\n", "repo: https://gitlab.com/x/y\nsources:\n") +
      "  - {field: repo, url: https://fixture.example/, retrieved: 2026-01-02}\n")).errors)
      .toContain("fixture-tool: repo must be https://github.com/<owner>/<name>: https://gitlab.com/x/y");
  });
});

describe("freshness", () => {
  const day = (d: string, n: number) => new Date(Date.parse(d) + n * 86_400_000).toISOString().slice(0, 10);
  const today = "2026-06-30";

  it("dates a record by its oldest source read", () => {
    expect(freshness(["2026-06-20", "2026-06-01", "bad"], today)?.checked).toBe("2026-06-01");
  });

  it("bands by the age of the oldest read", () => {
    expect(freshness([day(today, -FRESH_DAYS)], today)?.band).toBe("fresh");
    expect(freshness([day(today, -FRESH_DAYS - 1)], today)?.band).toBe("aging");
    expect(freshness([day(today, -STALE_DAYS)], today)?.band).toBe("aging");
    expect(freshness([day(today, -STALE_DAYS - 1)], today)?.band).toBe("stale");
  });

  it("counts the share of sources read in the last 90 days", () => {
    expect(freshness([today, day(today, -STALE_DAYS - 1)], today)?.share90).toBe(0.5);
  });

  it("is null for a record with no dated sources", () => {
    expect(freshness([], today)).toBeNull();
  });

  it("is written onto every built record", () => {
    const { data } = buildLandscape(scratch(FIXTURE), "2026-01-10");
    const node = (data!.nodes as Array<Node & { freshness: unknown }>).find((n) => n.id === "fixture-tool");
    expect(node?.freshness).toEqual({ checked: "2026-01-02", share90: 1, band: "fresh" });
  });
});
