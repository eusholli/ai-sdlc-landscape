import { Suspense } from "react";
import { PhaseListStatic } from "@/components/list/phase-list-static";
import { LandscapeMap } from "@/components/map/landscape-map";
import { externals, fullLifecycle, layers, phases, relationsLite, segments, toolsLite } from "@/lib/data";

export default function Home() {
  return (
    <main id="main">
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
            <div aria-hidden className="hidden h-[calc(100dvh-10.5rem)] min-h-[32rem] border-b bg-muted/30 md:block" />
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
    </main>
  );
}
