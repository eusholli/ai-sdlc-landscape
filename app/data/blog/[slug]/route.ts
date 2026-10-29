// One Markdown file per post at /data/blog/<slug>.md, also served at /blog/<slug>.md (a rewrite
// in next.config.ts): the post as written, with its title and what kind of post it is.
import { postBySlug, posts } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { postLabel } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return posts().map((n) => ({ slug: `${n.slug}.md` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = postBySlug(slug.replace(/\.md$/, ""));
  if (!post) return new Response("Not found", { status: 404 });
  // A link in a post is written root-relative for the page; out of context it needs the origin.
  const body = post.body.replace(/\]\(\//g, `](${SITE_URL}/`);
  const text = [`# ${post.title}`, "", `${formatDate(post.date)}. ${postLabel(post, formatDate)}.`, "", body, ""].join("\n");
  return new Response(text, {
    headers: { "Content-Type": "text/markdown; charset=utf-8", Link: `<${SITE_URL}/blog/${post.slug}>; rel="canonical"` },
  });
}
