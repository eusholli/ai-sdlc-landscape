// /llms-full.txt: the whole dataset as Markdown, one section per tool with its sources.
import { llmsFullTxt } from "@/lib/llms";

export const dynamic = "force-static";

export function GET() {
  return new Response(llmsFullTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
