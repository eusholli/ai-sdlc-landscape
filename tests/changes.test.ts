// The timeline, the feed, the badge and the monthly digest. Run `pnpm data` first: lib/data reads
// the generated landscape.json. Nothing here depends on the content of a real record.
import { describe, expect, it } from "vitest";
import { badgeSvg } from "@/lib/badge";
import { buildDate, changes, freshnessSummary, isNew, timeline, toolsLite } from "@/lib/data";
import { digest, digestFacts, digestMarkdown, digestMonths, digestPost } from "@/lib/digest";
import { atomFeed } from "@/lib/feed";

const MARKETING = /\b(unlock|elevate|supercharge|seamless|delve|cutting-edge|game-changing|revolutioni[sz]e)\b/i;

describe("timeline", () => {
  it("is newest first", () => {
    const dates = timeline().map((e) => e.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("never shows an undated move", () => {
    for (const e of timeline()) expect(e.date).toMatch(/^\d{4}-\d{2}(-\d{2})?$/);
  });

  it("gives every entry and change a sentence", () => {
    for (const e of timeline()) expect(e.text.trim()).not.toBe("");
    for (const c of changes()) expect(c.text.trim()).not.toBe("");
  });

  it("respects a limit", () => {
    expect(timeline(1).length).toBe(Math.min(1, timeline().length));
  });

  it("marks as new only tools added on their own", () => {
    const batched = new Set(changes().filter((c) => c.kind === "batch").flatMap((c) => c.tools));
    const added = new Set(changes().filter((c) => c.kind === "added").map((c) => c.tool));
    for (const t of toolsLite()) {
      expect(t.isNew).toBe(isNew(t.id));
      if (t.isNew) expect(added.has(t.id) || !batched.has(t.id)).toBe(true);
    }
  });
});

describe("freshness summary", () => {
  it("counts every record with sources once", () => {
    const total = freshnessSummary().reduce((s, f) => s + f.count, 0);
    expect(total).toBe(toolsLite().filter((t) => t.freshness).length);
  });
});

describe("feed", () => {
  it("is Atom with one entry per timeline entry, up to the limit", () => {
    const xml = atomFeed(5);
    expect(xml.startsWith('<?xml version="1.0" encoding="utf-8"?>')).toBe(true);
    expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
    expect(xml.match(/<entry>/g)?.length ?? 0).toBe(Math.min(5, timeline().length));
    expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;)/);
  });

  it("dates every entry as an Atom timestamp", () => {
    for (const m of atomFeed().matchAll(/<updated>([^<]+)<\/updated>/g)) {
      expect(m[1]).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00Z$/);
    }
  });
});

describe("badge", () => {
  it("names the tool and escapes it", () => {
    const svg = badgeSvg('A & "B" <C>', "#2a78d6");
    expect(svg).toContain("A &amp; &quot;B&quot; &lt;C&gt;");
    expect(svg).not.toContain("<C>");
    expect(svg).toMatch(/^<svg [^>]*role="img"/);
  });

  it("grows with the name", () => {
    const w = (s: string) => Number(badgeSvg(s, "#000").match(/width="(\d+)"/)![1]);
    expect(w("A much longer tool name")).toBeGreaterThan(w("Short"));
  });
});

describe("digest", () => {
  it("covers every month on the timeline from the first change on", () => {
    const first = changes().at(-1)?.date.slice(0, 7) ?? "";
    const months = new Set(timeline().map((e) => e.date.slice(0, 7)).filter((m) => m >= first));
    expect(new Set(digestMonths())).toEqual(months);
  });

  it("says so when a month had no changes", () => {
    expect(digestFacts(digest("1999-01"))).toEqual(["No changes to the records this month."]);
  });

  it("follows the writing rules", () => {
    for (const m of [...digestMonths(), "1999-01"]) {
      const d = digest(m);
      for (const text of [digestPost(d), digestMarkdown(d)]) {
        expect(text).not.toContain("—");
        expect(text).not.toMatch(MARKETING);
      }
    }
  });

  it("links the post to the month's page", () => {
    expect(digestPost(digest("1999-01"))).toContain("/changes/1999-01");
  });

  it("measures freshness from the build", () => {
    expect(digestMarkdown(digest(buildDate().slice(0, 7)))).toContain(`As of ${buildDate()}:`);
  });
});
