// The site mark that the tab icon, the home screen icon and favicon.ico draw from.
import { describe, expect, it } from "vitest";
import { markBars, markSvg, STAGE_HEX } from "@/lib/og";
import { ico } from "@/scripts/favicon";
import { markPadding, SOCIAL_ASSETS } from "@/scripts/social";

describe("site mark", () => {
  it("lays six rising bars in the stage colours inside the square", () => {
    const bars = markBars(32, 2);
    expect(bars.map((b) => b.color)).toEqual([1, 2, 3, 4, 5, 6].map((id) => STAGE_HEX[id]));
    for (const b of bars) {
      expect(b.x).toBeGreaterThanOrEqual(2);
      expect(b.y).toBeGreaterThanOrEqual(2);
      expect(b.x + b.width).toBeLessThanOrEqual(30 + 1e-9);
      expect(b.y + b.height).toBeLessThanOrEqual(30 + 1e-9);
    }
    const bottoms = new Set(bars.map((b) => (b.y + b.height).toFixed(6)));
    expect(bottoms.size).toBe(1);
    expect(bars.every((b, i) => i === 0 || b.height > bars[i - 1].height)).toBe(true);
  });

  it("writes the mark as an SVG of the requested size", () => {
    const svg = markSvg(32);
    expect(svg).toMatch(/^<svg [^>]*viewBox="0 0 32 32"/);
    expect(svg.match(/<rect /g)).toHaveLength(6);
  });

  it("packs PNG images into an ICO directory", () => {
    const a = Buffer.from([1, 2, 3]), b = Buffer.from([4, 5]);
    const out = ico([{ size: 16, data: a }, { size: 32, data: b }]);
    expect(out.readUInt16LE(2)).toBe(1);
    expect(out.readUInt16LE(4)).toBe(2);
    expect(out.readUInt8(6)).toBe(16);
    expect(out.readUInt32LE(6 + 8)).toBe(3);
    expect(out.readUInt32LE(6 + 12)).toBe(38);
    expect(out.readUInt32LE(22 + 12)).toBe(41);
    expect(out.subarray(38)).toEqual(Buffer.concat([a, b]));
  });

  it("keeps every bar corner of a profile image inside the circle the networks cut", () => {
    for (const a of SOCIAL_ASSETS.filter((x) => x.kind === "mark")) {
      expect(a.width).toBe(a.height);
      const c = a.width / 2;
      for (const b of markBars(a.width, markPadding(a.width))) {
        for (const [x, y] of [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]]) {
          expect(Math.hypot(x - c, y - c)).toBeLessThanOrEqual(c);
        }
      }
    }
  });

  it("draws the LinkedIn cover at its 6:1 display shape", () => {
    const cover = SOCIAL_ASSETS.find((a) => a.file === "linkedin-cover.png")!;
    expect(cover.width * 191).toBe(cover.height * 1128);
  });
});
