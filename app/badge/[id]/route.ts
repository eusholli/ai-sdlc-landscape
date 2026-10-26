// One static SVG badge per tool at /badge/<id>.svg, for vendors to show they are listed. A
// platform is listed only as something tools connect to, so it gets no badge.
import { BADGE_COLOURS, badgeSvg } from "@/lib/badge";
import { allTools, toolById } from "@/lib/data";
import { stageOf } from "@/lib/format";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return allTools().filter((t) => t.kind !== "platform").map((t) => ({ id: `${t.id}.svg` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tool = toolById(id.replace(/\.svg$/, ""));
  if (!tool || tool.kind === "platform") return new Response("Not found", { status: 404 });
  const colour = tool.layer ? BADGE_COLOURS[tool.layer] : tool.primaryPhase ? BADGE_COLOURS[stageOf(tool.primaryPhase)] : BADGE_COLOURS.model;
  return new Response(badgeSvg(tool.name, colour), {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
  });
}
