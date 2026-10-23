import { describe, expect, it } from "vitest";
import { allTools, kitFor } from "@/lib/data";
import { KIT, KIT_GROUPS, SOURCE_FIELD } from "@/lib/kit";

describe("evaluation kit", () => {
  it("has unique ids", () => {
    expect(new Set(KIT.map((q) => q.id)).size).toBe(KIT.length);
  });
  it("puts every question in a known group", () => {
    const groups = new Set(KIT_GROUPS.map((g) => g.id));
    for (const q of KIT) expect(groups.has(q.group)).toBe(true);
  });
  it("names a field a record can answer, or none", () => {
    const sample = allTools()[0];
    for (const q of KIT) {
      if (q.field === null || q.field === "relations") continue;
      expect(q.field in sample).toBe(true);
      expect(SOURCE_FIELD[q.field]).toBeDefined();
    }
  });
  it("answers every question for a tool", () => {
    expect(kitFor("cursor")?.answers).toHaveLength(KIT.length);
  });
  it("returns nothing for an unknown id", () => {
    expect(kitFor("nope")).toBeUndefined();
  });
  it("never invents an answer: a null field is always unpublished", () => {
    const kit = kitFor("cursor")!;
    for (const a of kit.answers) if (a.q.field === null) expect(a.value).toBeNull();
  });
});
