import { Suspense } from "react";
import { LandscapeMap } from "@/components/map/landscape-map";
import { externals, fullLifecycle, layers, phases, relationsLite, segments, toolsLite } from "@/lib/data";

export default function Home() {
  return (
    <main id="main">
      <Suspense fallback={<div aria-hidden className="h-[calc(100dvh-10.5rem)] min-h-[32rem] border-b bg-muted/30" />}>
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
