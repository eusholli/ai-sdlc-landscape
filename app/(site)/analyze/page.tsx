import type { Metadata } from "next";
import { Suspense } from "react";
import { AnalyzeView } from "@/components/analyze/analyze-view";
import { SITE_CONTAINER } from "@/components/site-name";
import { phases, relationsLite, toolsLite } from "@/lib/data";

const DESCRIPTION =
  "Choose AI SDLC tools, see the lifecycle phases they deliver to, find tools with a recorded link that cover the gaps, and compare them side by side.";

export const metadata: Metadata = {
  title: "Analyze choices",
  description: DESCRIPTION,
  alternates: { canonical: "/analyze" },
};

export default function AnalyzePage() {
  const tools = toolsLite().filter((t) => t.kind === "tool");
  return (
    <main id="main" className={`${SITE_CONTAINER} py-8`}>
      {/* The view reads the URL, so the static HTML holds only this fallback: give it the page's h1. */}
      <Suspense
        fallback={
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Analyze choices</h1>
            <p className="max-w-prose text-sm text-muted-foreground">{DESCRIPTION}</p>
            <p className="text-sm text-muted-foreground">Loading your choices.</p>
          </div>
        }
      >
        <AnalyzeView tools={tools} relations={relationsLite()} phases={phases()} />
      </Suspense>
    </main>
  );
}
