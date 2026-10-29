// /blog/rss.xml: the RSS feed of the posts, for feed readers, agents and the social drafting job.
import { blogFeed } from "@/lib/feed";

export const dynamic = "force-static";

export function GET() {
  return new Response(blogFeed(), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
