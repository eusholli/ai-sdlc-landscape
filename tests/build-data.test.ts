import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parse } from "yaml";
import { buildLandscape, tier } from "@/scripts/build-data";

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

  it("accepts the fixture as written", () => {
    expect(buildLandscape(scratch(FIXTURE)).errors).toEqual([]);
  });

  it("tiers a source by who published it", () => {
    expect(tier("https://kiro.dev/pricing/", "https://kiro.dev")).toBe("A");
    expect(tier("https://techcrunch.com/2025/x", "https://kiro.dev")).toBe("B");
    expect(tier("https://example.org/x", "https://kiro.dev")).toBe("C");
  });
});
