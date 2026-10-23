import { KIT } from "@/lib/kit";

export const dynamic = "force-static";

const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;

/** Blank `answer` and `source` columns: the buyer fills them in while talking to a vendor. */
export function GET() {
  const rows = [
    "group,id,question,why,answer,source",
    ...KIT.map((q) => [q.group, q.id, q.text, q.why, "", q.ref?.url ?? ""].map(cell).join(",")),
  ];
  return new Response(rows.join("\n") + "\n", {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
