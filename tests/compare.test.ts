import { describe, expect, it } from "vitest";
import { analyzeHref, normalizeCompare, splitChoices } from "@/lib/compare";

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
    expect(analyzeHref(["a b"], "stack")).toBe("/analyze?tab=stack&compare=a%20b");
  });

  it("carries the added tools that are still chosen", () => {
    expect(analyzeHref(["a", "b"], "choose", ["b", "x"])).toBe("/analyze?compare=a,b&via=b");
  });
});
