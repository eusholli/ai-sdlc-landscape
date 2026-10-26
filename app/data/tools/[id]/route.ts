// One static file per tool, generated at build time: /data/tools/<id>.json, which the drawer
// fetches so client bundles never carry the full dataset, and /data/tools/<id>.md for agents,
// also served at /tools/<id>.md (a rewrite in next.config.ts).
import { allTools, changesFor, connectionsOf, isNew, relationsFor, toolById } from "@/lib/data";
import { toolMarkdown } from "@/lib/llms";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return allTools().flatMap((t) => [{ id: `${t.id}.json` }, { id: `${t.id}.md` }]);
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tool = toolById(id.replace(/\.(json|md)$/, ""));
  if (!tool) return new Response("Not found", { status: 404 });
  // Copies of the tool page: point search engines at the page itself.
  const canonical = { Link: `<${SITE_URL}/tools/${tool.id}>; rel="canonical"` };
  if (id.endsWith(".md")) {
    return new Response(toolMarkdown(tool, 1), {
      headers: { "Content-Type": "text/markdown; charset=utf-8", ...canonical },
    });
  }
  return Response.json(
    { tool, relations: relationsFor(tool.id), changes: changesFor(tool.id),
      isNew: isNew(tool.id), connections: tool.kind === "tool" ? connectionsOf(tool.id) : undefined },
    { headers: canonical },
  );
}
