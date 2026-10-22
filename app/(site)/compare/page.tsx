import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareView } from "@/components/compare/compare-view";
import { SITE_CONTAINER } from "@/components/site-name";
import { phases, toolsLite } from "@/lib/data";

export const metadata: Metadata = {
  title: "Compare tools",
  description: "Put up to four AI SDLC tools side by side and see which facts differ.",
  alternates: { canonical: "/compare" },
};

export default function ComparePage() {
  return (
    <main id="main" className={`${SITE_CONTAINER} py-8`}>
      <h1 className="text-2xl font-semibold tracking-tight">Compare tools</h1>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        Up to four tools side by side. Rows where the values differ are highlighted. The selection is kept in the
        URL, so you can share it.
      </p>
      <div className="mt-6">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading the comparison.</p>}>
          <CompareView tools={toolsLite()} phases={phases()} />
        </Suspense>
      </div>
    </main>
  );
}
