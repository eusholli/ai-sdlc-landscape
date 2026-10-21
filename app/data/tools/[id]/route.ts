// One static JSON file per tool at /data/tools/<id>.json, generated at build time. The drawer
// fetches this so client bundles never carry the full dataset.
import { allTools, relationsFor, toolById } from "@/lib/data";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return allTools().map((t) => ({ id: `${t.id}.json` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tool = toolById(id.replace(/\.json$/, ""));
  if (!tool) return new Response("Not found", { status: 404 });
  return Response.json({ tool, relations: relationsFor(tool.id) });
}
