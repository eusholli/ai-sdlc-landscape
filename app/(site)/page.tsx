import { Suspense } from "react";
import { LandscapeMap } from "@/components/map/landscape-map";
import { fullLifecycle, layers, phases, relationsLite, toolsLite } from "@/lib/data";

export default function Home() {
  return (
    <main id="main">
      <Suspense fallback={<div aria-hidden className="h-[calc(100dvh-7rem)] min-h-[32rem] border-b bg-muted/30" />}>
        <LandscapeMap
          tools={toolsLite()}
          relations={relationsLite()}
          phases={phases()}
          layers={layers()}
          fullLifecycleIds={fullLifecycle().map((t) => t.id)}
        />
      </Suspense>
    </main>
  );
}
