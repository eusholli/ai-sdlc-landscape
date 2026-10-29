import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { Post } from "@/lib/blog";

// "Posts about this tool" or "this phase": a link to each post that names the page. Renders nothing
// when no post does.
export function PostLinks({ posts, about }: { posts: Post[]; about: "tool" | "phase" }) {
  if (!posts.length) return null;
  return (
    <section aria-labelledby="posts-heading" className="flex flex-col gap-2 border-t pt-6 text-sm">
      <h2 id="posts-heading" className="font-semibold">
        Posts about this {about}
      </h2>
      <ul className="flex flex-col gap-1">
        {posts.map((n) => (
          <li key={n.slug}>
            <Link
              href={`/blog/${n.slug}`}
              className="rounded-sm underline underline-offset-4 outline-none hover:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 max-md:inline-flex max-md:min-h-11 max-md:items-center"
            >
              {n.title}
            </Link>{" "}
            <span className="text-muted-foreground">({formatDate(n.date)})</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
