// The posts loader: what a data post and a signed post must carry, and the ids they may name.
// Uses fixture posts, never content/blog/.
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { postLabel, postsAbout, parsePost, readPosts } from "@/lib/blog";

const REFS = { tools: new Set(["alpha", "beta"]), phases: new Set(["code", "review"]) };

const DATA = `---
title: What the records show
description: A fixture data post.
date: 2026-02-03
kind: data
as_of: 2026-02-01
tools: [alpha]
phases: [code]
---

Body with **bold**.
`;

const SIGNED = `---
title: An opinion
description: A fixture signed post.
date: 2026-02-04
kind: signed
author: Fixture Author
---

Body.
`;

describe("parsePost", () => {
  it("reads a data post, with its dates kept as written", () => {
    const n = parsePost("what-the-records-show", DATA, REFS);
    expect(n).toMatchObject({ kind: "data", date: "2026-02-03", asOf: "2026-02-01", author: null, tools: ["alpha"], phases: ["code"] });
    expect(n.html).toContain("<strong>bold</strong>");
    expect(n.body.startsWith("Body")).toBe(true);
  });

  it("reads a signed post with its author and no data date", () => {
    expect(parsePost("an-opinion", SIGNED, REFS)).toMatchObject({ kind: "signed", author: "Fixture Author", asOf: null, tools: [] });
  });

  it("refuses a signed post with no author", () => {
    expect(() => parsePost("x", SIGNED.replace("author: Fixture Author\n", ""), REFS)).toThrow(/names its author/);
  });

  it("refuses a data post with an author or no as_of", () => {
    expect(() => parsePost("x", DATA.replace("kind: data", "kind: data\nauthor: Someone"), REFS)).toThrow(/carries no author/);
    expect(() => parsePost("x", DATA.replace("as_of: 2026-02-01\n", ""), REFS)).toThrow(/as_of/);
  });

  it("refuses an unknown kind, tool or phase, and lists every problem", () => {
    const bad = DATA.replace("kind: data", "kind: essay").replace("[alpha]", "[gamma]").replace("[code]", "[ship]");
    expect(() => parsePost("x", bad, REFS)).toThrow(/kind is "essay"[\s\S]*"gamma"[\s\S]*"ship"/);
  });

  it("refuses a file name that is not a slug", () => {
    expect(() => parsePost("Bad_Name", DATA, REFS)).toThrow(/file name/);
  });
});

describe("readPosts and helpers", () => {
  it("reads a folder newest first, and an absent folder as no posts", () => {
    const dir = mkdtempSync(join(tmpdir(), "posts-"));
    writeFileSync(join(dir, "older.md"), DATA);
    writeFileSync(join(dir, "newer.md"), SIGNED);
    writeFileSync(join(dir, "README.txt"), "ignored");
    expect(readPosts(dir, REFS).map((n) => n.slug)).toEqual(["newer", "older"]);
    expect(readPosts(join(dir, "missing"), REFS)).toEqual([]);
  });

  it("labels each kind and finds the posts about a tool or a phase", () => {
    const data = parsePost("d", DATA, REFS);
    const signed = parsePost("s", SIGNED, REFS);
    expect(postLabel(data, (d) => d)).toBe("Data post, from the records as of 2026-02-01");
    expect(postLabel(signed, (d) => d)).toBe("Signed opinion by Fixture Author, not data");
    expect(postsAbout([data, signed], { tool: "alpha" })).toEqual([data]);
    expect(postsAbout([data, signed], { phase: "review" })).toEqual([]);
  });
});
