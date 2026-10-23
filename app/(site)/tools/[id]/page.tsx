import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_CONTAINER } from "@/components/site-name";
import { ToolDetail } from "@/components/tool/tool-detail";
import { allTools, changesFor, isNew, relationsFor, toolById } from "@/lib/data";
import { jsonLdText, toolJsonLd } from "@/lib/jsonld";
import { toolDetailRefs } from "@/lib/tool-refs";

export const dynamicParams = false;

export function generateStaticParams() {
  return allTools().map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const tool = toolById(id);
  if (!tool) return { title: "Tool not found" };
  return {
    title: tool.name,
    description: tool.summary ?? `${tool.name} by ${tool.company}. The vendor has not published a one-line claim.`,
    alternates: { canonical: `/tools/${tool.id}` },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tool = toolById(id);
  if (!tool) notFound();

  return (
    <main id="main" className={`${SITE_CONTAINER} py-8`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(toolJsonLd(tool)) }} />
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
            data={{ tool, relations: relationsFor(tool.id), changes: changesFor(tool.id), isNew: isNew(tool.id) }}
            refs={toolDetailRefs()}
            variant="page"
          />
        </div>
      </div>
    </main>
  );
}
