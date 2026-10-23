import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import raw from "@/data/landscape.json";
import {
  allTools, coverageMatrix, externals, fieldCompleteness, hasPage, marketMoves, relations,
  relationsFor, toolById, toolsByLayer, toolsByPhase, toolsLite,
} from "@/lib/data";
import { applyFilters, deploymentBuckets, pricingBucket, searchLite, type Filters } from "@/lib/filters";

const empty: Filters = {
  q: "", phase: [], segment: [], kind: [], pricing: [], deploy: [], autonomy: [], iface: [], buyer: [],
  oss: false, moved: false,
};

describe("data contract", () => {
  it("keeps every node", () => {
    expect(allTools().length).toBe(raw.nodes.length);
    expect(allTools().length).toBe(readdirSync("data/tools").filter((f) => f.endsWith(".yaml")).length);
  });

  it("resolves every relation endpoint to a tool, model or external", () => {
    const ids = new Set([...allTools().map((t) => t.id), ...externals().map((e) => e.id)]);
    for (const r of relations()) {
      expect(ids.has(r.from), `from ${r.from}`).toBe(true);
      expect(ids.has(r.to), `to ${r.to}`).toBe(true);
    }
  });

  it("never leaks the 'unknown' sentinel into the typed data", () => {
    for (const t of allTools()) {
      for (const [k, v] of Object.entries(t)) {
        if (k === "sources") continue;
        expect(v, `${t.id}.${k}`).not.toBe("unknown");
        if (Array.isArray(v)) expect(v.includes("unknown"), `${t.id}.${k}`).toBe(false);
      }
    }
  });

  it("gives every list field a real array or null", () => {
    for (const t of allTools()) {
      for (const k of ["interface", "targetBuyer", "deployment", "customers", "models", "compliance", "gtmPartners"] as const) {
        const v = t[k];
        expect(v === null || (Array.isArray(v) && v.length > 0), `${t.id}.${k}`).toBe(true);
      }
    }
  });

  it("places every non-layer tool in exactly one phase column", () => {
    const placed = Object.values(toolsByPhase()).flat();
    const layered = Object.values(toolsByLayer()).flat();
    expect(placed.length + layered.length).toBe(allTools().length);
    expect(new Set(placed.map((t) => t.id)).size).toBe(placed.length);
  });

  it("points every logo at a file under /logos or null", () => {
    for (const t of allTools()) if (t.logo) expect(t.logo).toMatch(/^\/logos\/[\w.-]+\.(png|svg|ico|jpg|webp)$/);
  });
});

describe("selectors", () => {
  it("lists one move per tool with a status, dated ones first in date order", () => {
    const moves = marketMoves();
    const moved = allTools().filter((t) => t.status && t.status !== "preview");
    expect(moves.map((m) => m.tool).sort()).toEqual(moved.map((t) => t.id).sort());
    const acquired = new Set(relations().filter((r) => r.type === "acquired_by").map((r) => r.from));
    for (const m of moves) {
      if (m.kind === "acquired" && acquired.has(m.tool)) expect(m.acquirer, m.tool).toBeTruthy();
    }
    const dated = moves.filter((m) => m.date).map((m) => m.date!);
    expect(dated).toEqual([...dated].sort());
    const firstUndated = moves.findIndex((m) => !m.date);
    if (firstUndated >= 0) expect(moves.slice(firstUndated).every((m) => !m.date)).toBe(true);
  });

  it("resolves relation names in both directions", () => {
    const from = relations().find((r) => hasPage(r.from))!.from;
    const rel = relationsFor(from);
    expect(rel.length).toBeGreaterThan(0);
    expect(rel.every((r) => r.otherName.length > 0)).toBe(true);
    expect(toolById("no-such-tool")).toBeUndefined();
  });

  it("builds a coverage matrix and a completeness panel", () => {
    const tools = allTools().filter((t) => t.kind === "tool").length;
    expect(coverageMatrix().reduce((a, c) => a + c.count, 0)).toBeGreaterThan(tools);
    const gtm = fieldCompleteness().find((f) => f.field === "gtmPartners")!;
    expect(gtm.total).toBe(tools);
    expect(gtm.known).toBeLessThan(gtm.total);
  });
});

describe("filters and search", () => {
  const lite = toolsLite();

  it("returns everything with no filters", () => {
    expect(applyFilters(lite, empty).length).toBe(lite.length);
  });

  it("filters by phase coverage and open source", () => {
    const code = applyFilters(lite, { ...empty, phase: ["code"] });
    expect(code.every((t) => t.phases.includes("code"))).toBe(true);
    const oss = applyFilters(lite, { ...empty, oss: true });
    expect(oss.length).toBeGreaterThan(0);
    expect(oss.length).toBe(lite.filter((t) => t.openSource).length);
  });

  it("finds a tool by a customer name", () => {
    const fixture = { ...lite[0], id: "fixture", name: "Fixture", company: "Fixture Co", summary: null, customers: ["Zyxwv Corp"] };
    const hits = searchLite([fixture], "zyxwv");
    expect(hits).toMatchObject([{ id: "fixture", matched: "customer", match: "Zyxwv Corp" }]);
  });

  it("buckets pricing and deployment", () => {
    expect(pricingBucket("seat plus usage")).toBe("seat");
    expect(pricingBucket("free (open source)")).toBe("free");
    expect(pricingBucket("quote (45-day free trial)")).toBe("enterprise");
    expect(pricingBucket(null)).toBeNull();
    expect(deploymentBuckets(["saas", "byoc (AWS, GCP, Azure)"])).toEqual(["saas", "private"]);
    for (const t of allTools()) if (t.pricingModel) expect(t.pricingBucket, t.pricingModel).not.toBe("other");
  });
});
