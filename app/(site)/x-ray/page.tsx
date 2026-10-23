import type { Metadata } from "next";
import { Suspense } from "react";
import { SITE_CONTAINER } from "@/components/site-name";
import { XrayView } from "@/components/xray/xray-view";
import { marketMoves, phases, relationsLite, xrayTools } from "@/lib/data";

export const metadata: Metadata = {
  title: "Stack X-ray",
  description:
    "Pick the AI tools your team runs and see phase coverage, overlaps, model dependence, ownership changes and pricing mix, each fact sourced.",
  alternates: { canonical: "/x-ray" },
};

export default function XrayPage() {
  return (
    <main id="main" className={`${SITE_CONTAINER} py-8`}>
      <h1 className="text-2xl font-semibold tracking-tight">Stack X-ray</h1>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        Pick the AI tools your team runs. Every fact comes from the records, and a fact a vendor has not published
        says so. The selection is kept in the URL, so you can share it.
      </p>
      <div className="mt-6">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading the X-ray.</p>}>
          <XrayView tools={xrayTools()} relations={relationsLite()} moves={marketMoves()} phases={phases()} />
        </Suspense>
      </div>
    </main>
  );
}
