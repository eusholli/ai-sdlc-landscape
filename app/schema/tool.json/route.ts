// The JSON Schema for one record in data/tools/, so an agent can check a change before it asks.
import phases from "@/data/phases.json";
import { SITE_URL } from "@/lib/site";
import { toolSchema } from "@/scripts/schema";

export const dynamic = "force-static";

export function GET() {
  return Response.json(toolSchema(phases, `${SITE_URL}/schema/tool.json`), {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
