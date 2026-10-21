import { getLandscape } from "@/lib/data";

export const dynamic = "force-static";

export function GET() {
  return Response.json(getLandscape(), {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
