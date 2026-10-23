import { describe, expect, it } from "vitest";
import { marketMoves, phases, relationsLite, xrayTools } from "@/lib/data";
import { buildXray } from "@/lib/xray";

const PICK = ["cursor", "coderabbit", "snyk", "datadog-bits", "linear"];
const all = xrayTools();
const sel = all.filter((t) => PICK.includes(t.id));
const phaseIds = phases().map((p) => p.id);
const report = buildXray(sel, relationsLite(), marketMoves(), phaseIds);

describe("buildXray", () => {
  it("finds the five picked records", () => {
    expect(sel.map((t) => t.id).sort()).toEqual([...PICK].sort());
  });

  it("covers every phase, in order", () => {
    expect(report.coverage).toHaveLength(13);
    expect(report.coverage.map((c) => c.phase)).toEqual(phaseIds);
  });

  it("lists single-model tools whose record holds one model", () => {
    for (const s of report.singleModel) {
      const t = all.find((x) => x.id === s.tool)!;
      expect(t.models).toHaveLength(1);
      expect(t.models![0]).toBe(s.model);
    }
  });

  it("lists as moved only tools with a status", () => {
    for (const m of report.moved) expect(all.find((x) => x.id === m.tool)!.status).not.toBeNull();
  });

  it("keeps link ends inside the selection", () => {
    const ids = new Set(sel.map((t) => t.id));
    for (const l of report.links) {
      expect(ids.has(l.from)).toBe(true);
      expect(ids.has(l.to)).toBe(true);
    }
  });

  it("keeps gaps apart from covered phases", () => {
    const covered = new Set(report.coverage.filter((c) => c.tools.length > 0).map((c) => c.phase));
    for (const g of report.gaps) expect(covered.has(g)).toBe(false);
  });
});
