import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildLandscape, tier } from "@/scripts/build-data";

type Node = { id: string; kind: string; sources: unknown[] };

let dir = "";
afterEach(() => { if (dir) rmSync(dir, { recursive: true, force: true }); dir = ""; });

/** A copy of data/ to break on purpose. */
function scratch(): string {
  dir = mkdtempSync(join(tmpdir(), "landscape-"));
  cpSync("data", join(dir, "data"), { recursive: true });
  return dir;
}

describe("build-data", () => {
  it("builds the committed records with no errors", () => {
    const { data, errors } = buildLandscape();
    expect(errors).toEqual([]);
    const nodes = data!.nodes as Node[];
    expect(nodes.filter((n) => n.kind === "tool").length).toBe(179);
    expect((data!.relations as unknown[]).length).toBe(268);
    expect(nodes.reduce((s, n) => s + n.sources.length, 0)).toBe(1131);
  });

  it("fails a value with no source", () => {
    const root = scratch();
    const f = join(root, "data/tools/kiro.yaml");
    writeFileSync(f, readFileSync(f, "utf8").replace(/\n {2}- \{field: entry_price,[^\n]*/, ""));
    const { data, errors } = buildLandscape(root);
    expect(data).toBeNull();
    expect(errors).toContain("kiro: entry_price has a value but no source");
  });

  it("fails a source with no retrieved date, and an unknown field", () => {
    const root = scratch();
    const f = join(root, "data/tools/kiro.yaml");
    writeFileSync(f, readFileSync(f, "utf8").replace(", retrieved: 2026-10-21}", "}") + "colour: blue\n");
    const { errors } = buildLandscape(root);
    expect(errors.some((e) => e.startsWith("kiro: source for summary needs a retrieved date"))).toBe(true);
    expect(errors).toContain("kiro: unknown field colour");
  });

  it("tiers a source by who published it", () => {
    expect(tier("https://kiro.dev/pricing/", "https://kiro.dev")).toBe("A");
    expect(tier("https://techcrunch.com/2025/x", "https://kiro.dev")).toBe("B");
    expect(tier("https://example.org/x", "https://kiro.dev")).toBe("C");
  });
});
