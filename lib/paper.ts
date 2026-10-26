// The thesis paper, rendered at build time. Server only: marked turns content/ownership.md into
// HTML with slugged heading ids and KaTeX math; the page reads the result and the table of contents.
import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Marked } from "marked";
import markedKatex from "marked-katex-extension";

export type PaperHeading = { id: string; text: string; depth: 2 | 3 };

/** One row of the paper's glossary table, with its anchor on /ownership. */
export type PaperTerm = { term: string; definition: string; id: string };

/** The terms the paper introduces, shown first on /ownership and in /llms.txt. */
export const KEY_TERMS = ["Software ownership", "Software factory", "Factory engineering"] as const;

export type Paper = {
  title: string;
  author: string;
  role: string;
  version: string;
  date: string;
  html: string;
  toc: PaperHeading[];
  glossary: PaperTerm[];
  /** The id of the glossary's heading, or null when the paper has none. */
  glossaryId: string | null;
};

export const termId = (term: string) => `term-${slugify(term)}`;

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

// Table cell text as plain words: math keeps its source (epsilon as ε), markup and escapes go.
const plain = (text: string) =>
  text
    .replace(/\$+([^$]+)\$+/g, "$1")
    .replace(/\\(?:var)?epsilon/g, "ε")
    .replace(/[*_`]/g, "")
    .replace(/\\(.)/g, "$1")
    .trim();

let cached: Paper | null = null;

export function getPaper(): Paper {
  if (cached) return cached;
  cached = renderPaper(readFileSync(join(process.cwd(), "content/ownership.md"), "utf8"));
  return cached;
}

/** The paper from its Markdown source. The glossary is the table under a heading named "Glossary". */
export function renderPaper(raw: string): Paper {
  const { meta, body } = parseFrontmatter(raw);
  const toc: PaperHeading[] = [];
  const used = new Map<string, number>();

  const marked = new Marked();
  marked.use(markedKatex({ throwOnError: false, nonStandard: true }));
  const source = mathDelimiters(body);

  const glossary: PaperTerm[] = [];
  const tokens = marked.lexer(source);
  const at = tokens.findIndex((t) => t.type === "heading" && /glossary/i.test(t.text));
  const table = at < 0 ? undefined : tokens.slice(at + 1).find((t) => t.type === "table" || t.type === "heading");
  if (table?.type === "table") {
    for (const row of table.rows) {
      const term = plain(row[0].text);
      glossary.push({ term, definition: plain(row[1].text), id: termId(term) });
    }
  }
  const unanchored = new Set(glossary.map((g) => g.term));
  let inGlossary = false;
  let glossaryId: string | null = null;

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
        inGlossary = /glossary/i.test(text);
        if (inGlossary) glossaryId ??= id;
        return `<h${depth} id="${id}">${html}</h${depth}>\n`;
      },
      code({ text, lang }) {
        if (lang === "mermaid") {
          const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          return `<pre class="paper-mermaid" data-mermaid><code>${esc}</code></pre>\n`;
        }
        return false;
      },
      // A glossary row carries the term's anchor, so each definition has its own URL.
      tablerow({ text }) {
        const m = text.match(/^<td[^>]*>([\s\S]*?)<\/td>/);
        const term = m ? plain(m[1].replace(/<[^>]+>/g, "")) : "";
        const id = inGlossary && unanchored.delete(term) ? ` id="${termId(term)}"` : "";
        return `<tr${id}>\n${text}</tr>\n`;
      },
    },
  });

  const html = marked.parse(source, { async: false });
  return {
    title: meta.title,
    author: meta.author,
    role: meta.role,
    version: meta.version,
    date: meta.date,
    html,
    toc,
    glossary,
    glossaryId,
  };
}

/** The key terms with their glossary definitions. Throws if the paper drops one. */
export function keyTerms(p: Paper): PaperTerm[] {
  return KEY_TERMS.map((term) => {
    const found = p.glossary.find((g) => g.term === term);
    if (!found) throw new Error(`content/ownership.md: the glossary has no row for "${term}"`);
    return found;
  });
}
