import type { Metadata } from "next";
import { Suspense } from "react";
import { FilterBar } from "@/components/filters/filter-bar";
import { HomeIntro } from "@/components/home-intro";
import { PhaseListStatic } from "@/components/list/phase-list-static";
import { LandscapeMap } from "@/components/map/landscape-map";
import { VIEW_HEIGHT } from "@/components/map/map-layout";
import { MovesSection } from "@/components/moves/moves-section";
import { StatsStrip } from "@/components/stats-strip";
import { externals, fullLifecycle, layers, phases, relationsLite, segments, toolsLite } from "@/lib/data";
import { datasetJsonLd, jsonLdText, websiteJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <main id="main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(websiteJsonLd()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(datasetJsonLd()) }} />
      <HomeIntro
        stats={<StatsStrip />}
        filters={
          <div className="hidden md:block">
            <FilterBar tools={toolsLite()} phases={phases()} segments={segments()} />
          </div>
        }
      >
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
              <div aria-hidden className={`hidden ${VIEW_HEIGHT} border-b bg-muted/30 md:block`} />
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
            moves={<MovesSection />}
          />
        </Suspense>
      </HomeIntro>
    </main>
  );
}
