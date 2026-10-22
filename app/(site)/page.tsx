import type { Metadata } from "next";
import { Suspense } from "react";
import { HomeIntro } from "@/components/home-intro";
import { PhaseListStatic } from "@/components/list/phase-list-static";
import { LandscapeMap } from "@/components/map/landscape-map";
import { externals, fullLifecycle, layers, phases, relationsLite, segments, toolsLite } from "@/lib/data";
import { datasetJsonLd, jsonLdText } from "@/lib/jsonld";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <main id="main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(datasetJsonLd()) }} />
      <HomeIntro>
        <Suspense
          fallback={
            <>
              <div className="md:hidden">
                <PhaseListStatic
                  tools={toolsLite()}
                  phases={phases()}
                  layers={layers()}
                  segments={segments()}
                  fullLifecycleIds={fullLifecycle().map((t) => t.id)}
                />
              </div>
              <div
                aria-hidden
                className="hidden h-[calc(100dvh-10.5rem-var(--intro-h,0rem))] min-h-[32rem] border-b bg-muted/30 md:block"
              />
            </>
          }
        >
          <LandscapeMap
            tools={toolsLite()}
            relations={relationsLite()}
            externals={externals()}
            phases={phases()}
            layers={layers()}
            segments={segments()}
            fullLifecycleIds={fullLifecycle().map((t) => t.id)}
          />
        </Suspense>
      </HomeIntro>
    </main>
  );
}
