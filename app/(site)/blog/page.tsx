import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONTAINER } from "@/components/site-name";
import { posts } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { postLabel } from "@/lib/blog";
import { OPEN_GRAPH } from "@/lib/seo";

const DESCRIPTION =
  "Short posts on what the landscape's records show, each dated to the data it read, and signed opinions kept apart from the data.";

export const metadata: Metadata = {
  title: "Blog",
  description: DESCRIPTION,
  alternates: { canonical: "/blog", types: { "application/rss+xml": "/blog/rss.xml" } },
  openGraph: { ...OPEN_GRAPH, description: DESCRIPTION, url: "/blog" },
};

const LINK = "rounded-sm outline-none hover:underline underline-offset-4 focus-visible:ring-3 focus-visible:ring-ring/50";

export default function BlogPage() {
  const all = posts();
  return (
    <main id="main" className={`${SITE_CONTAINER} py-10`}>
      <div className="mx-auto flex max-w-3xl flex-col gap-8 text-[15px] leading-relaxed">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">Blog</h1>
          <p className="text-pretty text-muted-foreground">
            Posts and opinions on the market and the data, all opinions and statements are of the author. New posts
            are also in the{" "}
            <a href="/blog/rss.xml" className={`underline ${LINK}`}>
              blog feed
            </a>
            .
          </p>
        </header>
        <ol className="flex flex-col divide-y border-y">
          {all.map((n) => (
            <li key={n.slug} className="flex flex-col gap-1 py-5">
              <h2 className="text-lg font-semibold tracking-tight">
                <Link href={`/blog/${n.slug}`} className={LINK}>
                  {n.title}
                </Link>
              </h2>
              <p className="text-sm text-muted-foreground">
                {formatDate(n.date)}. {postLabel(n, formatDate)}.
              </p>
              <p className="text-pretty">{n.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
