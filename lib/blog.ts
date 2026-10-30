// Blog: short pieces at /blog, one Markdown file each in content/blog/<slug>.md. Server only.
//
// A data post reads the records and states what they showed on its `as_of` date, so its figures
// are a dated snapshot rather than counts the page derives. A signed post is one person's opinion,
// kept apart from the data as /ownership is: it carries its author and no record may cite it.
import "server-only";

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Marked } from "marked";
import { parse } from "yaml";

export type PostKind = "data" | "signed";

export interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  kind: PostKind;
  /** The person who signed it; a data post has none. */
  author: string | null;
  /** The data date a data post's figures were read on. */
  asOf: string | null;
  /** Tool and phase ids the post is about; their pages link back to it. */
  tools: string[];
  phases: string[];
  /** The cover drawn above the body, from public/blog/<slug>/; `png` is its share image. */
  cover: { src: string; png: string | null; alt: string } | null;
  /** The Markdown body, without frontmatter. */
  body: string;
  html: string;
}

/** What a post may name: the ids in the dataset. */
export interface PostRefs {
  tools: Set<string>;
  phases: Set<string>;
  /** Whether a file exists under public/, by its site path. Without it, covers go unchecked. */
  hasFile?: (path: string) => boolean;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// YAML reads an unquoted date as a Date; a post keeps it as the string it was written as.
const dateText = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : typeof v === "string" ? v : "");
const ids = (v: unknown) => (Array.isArray(v) ? v.map(String) : v == null ? [] : [String(v)]);

/** One post from its source. Throws with every problem found, so a bad post fails the build. */
export function parsePost(slug: string, raw: string, refs: PostRefs): Post {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error(`content/blog/${slug}.md: missing frontmatter`);
  const meta = (parse(m[1]) ?? {}) as Record<string, unknown>;
  const errors: string[] = [];
  const text = (k: string) => (typeof meta[k] === "string" ? (meta[k] as string).trim() : "");

  if (!SLUG.test(slug)) errors.push(`file name "${slug}" is not lower-case words joined by hyphens`);
  const title = text("title");
  const description = text("description");
  const date = dateText(meta.date);
  const asOf = meta.as_of == null ? null : dateText(meta.as_of);
  const author = text("author") || null;
  const kind = meta.kind;
  if (!title) errors.push("title is missing");
  if (!description) errors.push("description is missing");
  if (!DATE.test(date)) errors.push("date is not YYYY-MM-DD");
  if (kind !== "data" && kind !== "signed") errors.push(`kind is ${JSON.stringify(kind)}, not "data" or "signed"`);
  if (kind === "signed" && !author) errors.push("a signed post names its author");
  if (kind === "data" && author) errors.push("a data post carries no author; sign it or drop the author");
  if (kind === "data" && (!asOf || !DATE.test(asOf))) errors.push("a data post gives the data date it read as as_of: YYYY-MM-DD");
  const tools = ids(meta.tools);
  const phases = ids(meta.phases);
  for (const t of tools) if (!refs.tools.has(t)) errors.push(`tools: no record has the id "${t}"`);
  for (const p of phases) if (!refs.phases.has(p)) errors.push(`phases: no phase has the id "${p}"`);
  const coverFile = text("cover");
  const coverAlt = text("cover_alt");
  let cover: Post["cover"] = null;
  if (coverFile) {
    const src = `/blog/${slug}/${coverFile}`;
    const png = src.replace(/\.[a-z]+$/, ".png");
    if (!coverAlt) errors.push("cover_alt is missing; a cover says what it shows");
    if (refs.hasFile && !refs.hasFile(src)) errors.push(`cover: no file at public${src}`);
    cover = { src, png: !refs.hasFile || refs.hasFile(png) ? png : null, alt: coverAlt };
  } else if (coverAlt) errors.push("cover_alt is set but there is no cover");
  if (errors.length) throw new Error(`content/blog/${slug}.md:\n  ${errors.join("\n  ")}`);

  const body = raw.slice(m[0].length).trim();
  return {
    slug, title, description, date, kind: kind as PostKind, author, asOf: kind === "data" ? asOf : null,
    tools, phases, cover, body, html: new Marked().parse(body, { async: false }),
  };
}

/** Every post in `dir`, newest first. */
export function readPosts(dir: string, refs: PostRefs): Post[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parsePost(f.slice(0, -3), readFileSync(join(dir, f), "utf8"), refs))
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

/** "Data post, from the records as of 28 October 2026" or "Signed opinion by <name>, not data". */
export function postLabel(n: Pick<Post, "kind" | "author" | "asOf">, formatDate: (d: string) => string): string {
  return n.kind === "signed" ? `Signed opinion by ${n.author}, not data` : `Data post, from the records as of ${formatDate(n.asOf!)}`;
}

/** The posts that name a tool or a phase. */
export const postsAbout = (posts: Post[], about: { tool?: string; phase?: string }): Post[] =>
  posts.filter((n) => (about.tool && n.tools.includes(about.tool)) || (about.phase && n.phases.includes(about.phase)));
