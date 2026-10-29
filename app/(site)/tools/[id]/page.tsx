import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostLinks } from "@/components/post-links";
import { SITE_CONTAINER } from "@/components/site-name";
import { ToolDetail } from "@/components/tool/tool-detail";
import { VendorBadge } from "@/components/tool/vendor-badge";
import { allTools, changesFor, connectionsOf, isNew, posts, placeLabel, relationsFor, toolById } from "@/lib/data";
import { breadcrumbJsonLd, jsonLdText, toolJsonLd } from "@/lib/jsonld";
import { postsAbout } from "@/lib/blog";
import { OPEN_GRAPH, toolDescription, toolTitle } from "@/lib/seo";
import { toolDetailRefs } from "@/lib/tool-refs";

export const dynamicParams = false;

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
    title: toolTitle(tool, place),
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
        <div className="mt-8">
          <PostLinks posts={postsAbout(posts(), { tool: tool.id })} about="tool" />
        </div>
        {/* Only tools carry the "Listed on" badge; a platform is listed because tools link to it. */}
        {tool.kind === "tool" && <VendorBadge id={tool.id} name={tool.name} />}
      </div>
    </main>
  );
}
