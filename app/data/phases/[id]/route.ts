// One static file per lifecycle phase: /data/phases/<id>.json (the phase and the ids of its tools)
// and /data/phases/<id>.md for agents, also served at /phases/<id>.md (a rewrite in next.config.ts).
import { allTools, phases } from "@/lib/data";
import { phaseMarkdown } from "@/lib/llms";
import { phasePage } from "@/lib/phase-page";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return phases().flatMap((p) => [{ id: `${p.id}.json` }, { id: `${p.id}.md` }]);
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const phaseId = id.replace(/\.(json|md)$/, "");
  const page = phasePage(phaseId, phases(), allTools());
  if (!page) return new Response("Not found", { status: 404 });
  // Copies of the phase page: point search engines at the page itself.
  const canonical = { Link: `<${SITE_URL}/phases/${page.phase.id}>; rel="canonical"` };
  if (id.endsWith(".md")) {
    return new Response(phaseMarkdown(phaseId), {
      headers: { "Content-Type": "text/markdown; charset=utf-8", ...canonical },
    });
  }
  return Response.json(
    { phase: page.phase, primary: page.primary.map((t) => t.id), alsoCovers: page.alsoCovers.map((t) => t.id) },
    { headers: canonical },
  );
}
