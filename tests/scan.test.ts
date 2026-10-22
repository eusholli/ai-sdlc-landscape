import { describe, expect, it } from "vitest";
import { links } from "@/scripts/scan";

describe("scan", () => {
  it("collects external links with their text, and skips the page's own site", () => {
    const html = `<a href="https://www.tool.dev/x">Tool <b>Dev</b></a> <a href="/about">About</a>
      <a href="https://blog.example/">Blog</a> <a href="mailto:a@b.c">Mail</a>`;
    expect(links(html, "https://blog.example/post")).toEqual([{ host: "tool.dev", text: "Tool Dev" }]);
  });
});
