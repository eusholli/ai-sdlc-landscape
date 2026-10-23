// The thesis paper, rendered at build time. Server only: marked turns content/ownership.md into
// HTML with slugged heading ids and KaTeX math; the page reads the result and the table of contents.
import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Marked } from "marked";
import markedKatex from "marked-katex-extension";

export type PaperHeading = { id: string; text: string; depth: 2 | 3 };

export type Paper = {
  title: string;
  author: string;
  role: string;
  version: string;
  date: string;
  html: string;
  toc: PaperHeading[];
};

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error("content/ownership.md: missing frontmatter");
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].replace(/^"(.*)"$/, "$1");
  }
  return { meta, body: raw.slice(m[0].length) };
}

// The paper writes math as \( .. \) and \[ .. \]. marked reads a backslash before a bracket as an
// escape, so rewrite both to the dollar form the KaTeX extension takes, leaving code fences alone.
function mathDelimiters(body: string): string {
  return body
    .split(/(^```[\s\S]*?^```)/m)
    .map((part) =>
      part.startsWith("```")
        ? part
        : part
            .replace(/\\\[([\s\S]*?)\\\]/g, (_, m: string) => `\n$$${m.trim()}$$\n`)
            .replace(/\\\(([\s\S]*?)\\\)/g, (_, m: string) => `$${m.trim()}$`),
    )
    .join("");
}

let cached: Paper | null = null;

export function getPaper(): Paper {
  if (cached) return cached;
  const { meta, body } = parseFrontmatter(readFileSync(join(process.cwd(), "content/ownership.md"), "utf8"));
  const toc: PaperHeading[] = [];
  const used = new Map<string, number>();

  const marked = new Marked();
  marked.use(markedKatex({ throwOnError: false, nonStandard: true }));
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        const text = html.replace(/<[^>]+>/g, "");
        let id = slugify(text);
        const n = used.get(id) ?? 0;
        used.set(id, n + 1);
        if (n) id = `${id}-${n}`;
        if (depth === 2 || depth === 3) toc.push({ id, text, depth });
        return `<h${depth} id="${id}">${html}</h${depth}>\n`;
      },
      code({ text, lang }) {
        if (lang === "mermaid") {
          const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          return `<pre class="paper-mermaid" data-mermaid><code>${esc}</code></pre>\n`;
        }
        return false;
      },
    },
  });

  const html = marked.parse(mathDelimiters(body), { async: false });
  cached = {
    title: meta.title,
    author: meta.author,
    role: meta.role,
    version: meta.version,
    date: meta.date,
    html,
    toc,
  };
  return cached;
}
