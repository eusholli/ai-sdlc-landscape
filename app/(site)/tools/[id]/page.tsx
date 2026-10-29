import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_CONTAINER } from "@/components/site-name";
import { ToolRows } from "@/components/tool-rows";
import { ToolDetail } from "@/components/tool/tool-detail";
import { VendorBadge } from "@/components/tool/vendor-badge";
import { allTools, changesFor, connectionsOf, isNew, otherToolsInPhase, placeLabel, relationsFor, toolById } from "@/lib/data";
import { breadcrumbJsonLd, jsonLdText, toolJsonLd } from "@/lib/jsonld";
import { OPEN_GRAPH, type TitleFacets, toolDescription, toolTitle } from "@/lib/seo";
import type { Tool } from "@/lib/types";
import { toolDetailRefs } from "@/lib/tool-refs";

export const dynamicParams = false;

/** How many other tools the page lists before linking to the phase page for the rest. */
const OTHERS_SHOWN = 8;

const facetsOf = (tool: Tool): TitleFacets => ({
  pricing: Boolean(tool.pricingModel || tool.entryPrice),
  alternatives: otherToolsInPhase(tool).length > 0,
  integrations: relationsFor(tool.id).some((r) => r.type === "integrates_with"),
});

export function generateStaticParams() {
  return allTools().map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const tool = toolById(id);
  if (!tool) return { title: "Tool not found" };
  const place = placeLabel(tool);
  const description = toolDescription(tool, place);
  return {
    title: toolTitle(tool, place, facetsOf(tool)),
    description,
    alternates: {
      canonical: `/tools/${tool.id}`,
      types: { "text/markdown": `/tools/${tool.id}.md`, "application/json": `/data/tools/${tool.id}.json` },
    },
    openGraph: { ...OPEN_GRAPH, description, url: `/tools/${tool.id}` },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tool = toolById(id);
  if (!tool) notFound();
  const phaseLabel = tool.primaryPhase ? placeLabel(tool) : null;
  const others = otherToolsInPhase(tool);
  const crumbs: [string, string][] = [
    ...(tool.primaryPhase && phaseLabel ? [[phaseLabel, `/phases/${tool.primaryPhase}`] as [string, string]] : []),
    [tool.name, `/tools/${tool.id}`],
  ];

  return (
    <main id="main" className={`${SITE_CONTAINER} py-8`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(toolJsonLd(tool, placeLabel(tool))) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(breadcrumbJsonLd(crumbs)) }} />
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to the map
        </Link>
        <div className="mt-6">
          <ToolDetail
            data={{ tool, relations: relationsFor(tool.id), changes: changesFor(tool.id), isNew: isNew(tool.id),
              connections: tool.kind === "tool" ? connectionsOf(tool.id) : undefined }}
            refs={toolDetailRefs()}
            variant="page"
          />
        </div>
        {others.length > 0 && phaseLabel && (
          <section aria-labelledby="others-heading" className="mt-10 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 id="others-heading" className="text-xl font-semibold tracking-tight">
                Other tools in {phaseLabel}
              </h2>
              <p className="text-sm text-muted-foreground">Listed by name, not ranked. Each claim is the vendor&apos;s own words.</p>
            </div>
            <ToolRows tools={others.slice(0, OTHERS_SHOWN)} />
            {others.length > OTHERS_SHOWN && (
              <Link
                href={`/phases/${tool.primaryPhase}`}
                className="inline-flex items-center gap-1 self-start rounded-sm text-sm underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 max-md:min-h-11"
              >
                All {others.length + 1} tools in {phaseLabel}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            )}
          </section>
        )}
        {/* Only tools carry the "Listed on" badge; a platform is listed because tools link to it. */}
        {tool.kind === "tool" && <VendorBadge id={tool.id} name={tool.name} />}
      </div>
    </main>
  );
}
