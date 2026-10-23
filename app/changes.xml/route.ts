// /changes.xml: the Atom feed of the timeline, for feed readers and agents.
import { atomFeed } from "@/lib/feed";

export const dynamic = "force-static";

export function GET() {
  return new Response(atomFeed(), {
    headers: { "Content-Type": "application/atom+xml; charset=utf-8", "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
