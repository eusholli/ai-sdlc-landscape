// The name size on a map logo tile. Fixture names only.
import { describe, expect, it } from "vitest";
import { tileNameClass } from "@/lib/tile-name";

describe("tileNameClass", () => {
  it("keeps the default size for short words", () => {
    expect(tileNameClass("Acme Code")).toBe("text-[11px]");
    expect(tileNameClass("Tenletters")).toBe("text-[11px]");
  });

  it("steps down when any word is long", () => {
    expect(tileNameClass("Elevenchars")).toBe("text-[10px] tracking-tight");
    expect(tileNameClass("The Twelvechars Tool")).toBe("text-[10px] tracking-tight");
  });

  it("handles an empty name", () => {
    expect(tileNameClass("")).toBe("text-[11px]");
  });
});
