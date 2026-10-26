import { describe, expect, it } from "vitest";
import { analyzeHref, focusTools, normalizeCompare, splitChoices } from "@/lib/compare";
import type { PhaseChoice } from "@/lib/connections";
import type { PhaseId } from "@/lib/types";

describe("normalizeCompare", () => {
  it("drops repeats and keeps the order, with no cap", () => {
    expect(normalizeCompare(["a", "b", "a", "c", "d", "e"])).toEqual(["a", "b", "c", "d", "e"]);
  });
});

describe("splitChoices", () => {
  it("splits the choices into the stack and the tools added from a suggestion, in URL order", () => {
    expect(splitChoices(["a", "b", "c", "b"], ["c", "a"])).toEqual({ base: ["b"], added: ["a", "c"] });
  });

  it("ignores a via id that is not chosen", () => {
    expect(splitChoices(["a"], ["x"])).toEqual({ base: ["a"], added: [] });
  });
});

describe("analyzeHref", () => {
  it("carries the selection and leaves the default tab out", () => {
    expect(analyzeHref([])).toBe("/analyze");
    expect(analyzeHref(["a", "b", "a"])).toBe("/analyze?compare=a,b");
    expect(analyzeHref(["a b"], "compare")).toBe("/analyze?tab=compare&compare=a%20b");
  });

  it("carries the focused phase", () => {
    expect(analyzeHref(["a", "b"], "compare", [], "build" as PhaseId)).toBe("/analyze?tab=compare&compare=a,b&focus=build");
  });

  it("carries the added tools that are still chosen", () => {
    expect(analyzeHref(["a", "b"], "choose", ["b", "x"])).toBe("/analyze?compare=a,b&via=b");
  });
});

describe("focusTools", () => {
  const card = (phase: string, tools: string[]): PhaseChoice => ({ phase: phase as PhaseId, tools, gap: false, suggested: [], added: [] });
  const coverage = [card("plan", ["a"]), card("build", ["a", "b", "c"])];

  it("gives the choices in the focused phase, in choice order", () => {
    expect(focusTools(coverage, "build")).toEqual({ phase: "build", ids: ["a", "b", "c"] });
  });

  it("is null for a phase with fewer than two choices, an unknown phase or no focus", () => {
    expect(focusTools(coverage, "plan")).toBeNull();
    expect(focusTools(coverage, "nope")).toBeNull();
    expect(focusTools(coverage, null)).toBeNull();
  });
});
