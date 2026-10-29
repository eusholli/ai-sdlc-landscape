import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_CONTAINER } from "@/components/site-name";
import { nameOf, postBySlug, posts, phases } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { breadcrumbJsonLd, jsonLdText, postJsonLd } from "@/lib/jsonld";
import { postLabel } from "@/lib/blog";
import { OPEN_GRAPH } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return posts().map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = postBySlug(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}`, types: { "text/markdown": `/blog/${post.slug}.md` } },
    openGraph: {
      ...OPEN_GRAPH, type: "article", description: post.description, url: `/blog/${post.slug}`, publishedTime: post.date,
      ...(post.author ? { authors: [post.author] } : {}),
    },
  };
}

const LINK = "rounded-sm outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50";

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = postBySlug(slug);
  if (!post) notFound();
  const phaseLabel = new Map<string, string>(phases().map((p) => [p.id, p.label]));
  const about = [
    ...post.phases.map((id) => ({ href: `/phases/${id}`, label: phaseLabel.get(id) ?? id })),
    ...post.tools.map((id) => ({ href: `/tools/${id}`, label: nameOf(id) })),
  ];

  return (
    <main id="main" className={`${SITE_CONTAINER} py-10`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(postJsonLd(post)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdText(breadcrumbJsonLd([["Blog", "/blog"], [post.title, `/blog/${post.slug}`]])) }}
      />
      <article className="mx-auto flex max-w-3xl flex-col gap-6">
        <Link href="/blog" className={`inline-flex items-center gap-1 text-sm text-muted-foreground ${LINK} max-md:min-h-11`}>
          <ArrowLeft className="size-4" aria-hidden />
          All posts
        </Link>
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">{post.title}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(post.date)}. {postLabel(post, formatDate)}.
          </p>
          {post.kind === "signed" && (
            <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
              This is {post.author}&apos;s opinion. It is not part of the data, and no record on this site cites it.
            </p>
          )}
        </header>
        <div className="paper" dangerouslySetInnerHTML={{ __html: post.html }} />
        {about.length > 0 && (
          <nav aria-labelledby="post-about" className="flex flex-col gap-2 border-t pt-6 text-sm">
            <h2 id="post-about" className="font-semibold">
              Pages this post is about
            </h2>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {about.map((a) => (
                <li key={a.href}>
                  <Link href={a.href} className={`underline underline-offset-4 ${LINK}`}>
                    {a.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </article>
    </main>
  );
}
