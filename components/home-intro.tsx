"use client";

import { useQueryStates } from "nuqs";
import { Suspense, useEffect, useRef, useState } from "react";
import { SITE_CONTAINER } from "@/components/site-name";
import { ViewSwitcher } from "@/components/view-switcher";
import { filterParsers } from "@/lib/filters";
import { cn } from "@/lib/utils";

// The stats strip, filter bar and view switcher row, before the intro is measured.
const FALLBACK_HEIGHT = "7.25rem";

/**
 * The home page dataset summary (which says what the site is), the filter bar and then the view
 * switcher, with the map slotted below. The measured height of all of it is published as
 * `--intro-h` so the map views can subtract it and still fit the viewport. The header already
 * names the site, so the page title is for screen readers only.
 */
export function HomeIntro({
  stats,
  filters,
  children,
}: {
  stats: React.ReactNode;
  filters: React.ReactNode;
  children: React.ReactNode;
}) {
  const [height, setHeight] = useState<number | null>(null);
  const introRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = introRef.current;
    if (!el) return;
    const measure = () => setHeight(el.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ "--intro-h": height === null ? FALLBACK_HEIGHT : `${height}px` } as React.CSSProperties}>
      <div ref={introRef}>
      <h1 className="sr-only">AI SDLC Landscape: AI tools across the software development lifecycle</h1>
      {stats}
      {filters}
      <Suspense fallback={<SwitcherRow phoneHidden><div aria-hidden className="h-8 w-48" /></SwitcherRow>}>
        <ViewSwitcherRow />
      </Suspense>
      </div>
      {children}
    </div>
  );
}

/**
 * On phones the map and list views show the list, which carries the switcher under its own search
 * and filters, so this row only shows there for the network and market moves views.
 */
function ViewSwitcherRow() {
  const [{ view }] = useQueryStates(filterParsers);
  return (
    <SwitcherRow phoneHidden={view === "map" || view === "list"}>
      <ViewSwitcher />
    </SwitcherRow>
  );
}

function SwitcherRow({ phoneHidden, children }: { phoneHidden: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("border-b bg-background", phoneHidden && "hidden md:block")}>
      <div className={`${SITE_CONTAINER} flex justify-end py-2`}>{children}</div>
    </div>
  );
}
