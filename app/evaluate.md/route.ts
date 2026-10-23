import { KIT, KIT_GROUPS } from "@/lib/kit";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const body = [
    "# Evaluate an AI SDLC tool",
    "",
    `${KIT.length} questions to put to a vendor. Open ${SITE_URL}/evaluate/<id> to see what a tool's vendor has published for each.`,
    "",
    ...KIT_GROUPS.flatMap((g) => [
      `## ${g.title}`,
      "",
      g.blurb,
      "",
      ...KIT.filter((q) => q.group === g.id).flatMap((q, i) => [
        `${i + 1}. ${q.text}`,
        `   Why: ${q.why}${q.ref ? ` Source: ${q.ref.url}` : ""}`,
      ]),
      "",
    ]),
  ].join("\n");
  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
