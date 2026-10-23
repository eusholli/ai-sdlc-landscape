"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SITE_CONTAINER } from "@/components/site-name";
import { Button } from "@/components/ui/button";
import { WhatsNewStrip, type WhatsNewItem } from "@/components/whats-new-strip";
import { REPO_URL } from "@/lib/site";

const STORAGE_KEY = "ai-sdlc-landscape:intro-collapsed";
const FALLBACK_HEIGHT = "6rem";
const LINK =
  "rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50";

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsed(collapsed: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  } catch {
    // Private mode or blocked storage: the choice just lasts for this visit.
  }
}

/**
 * The home page title and one-line description, with the map slotted below it. The intro can be
 * collapsed to the title alone. The "What's new" strip sits under it and shrinks with it. The
 * measured height of both is published as `--intro-h` so the map views can subtract it and still
 * fit the viewport.
 */
export function HomeIntro({ children, whatsNew }: { children: React.ReactNode; whatsNew: WhatsNewItem[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const [height, setHeight] = useState<number | null>(null);
  const introRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCollapsed(readCollapsed());
  }, []);

  useEffect(() => {
    const el = introRef.current;
    if (!el) return;
    const measure = () => setHeight(el.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    writeCollapsed(next);
  }

  const Chevron = collapsed ? ChevronDown : ChevronUp;

  return (
    <div style={{ "--intro-h": height === null ? FALLBACK_HEIGHT : `${height}px` } as React.CSSProperties}>
      <div ref={introRef}>
      <section aria-labelledby="home-title" className="border-b bg-background">
        <div className={`${SITE_CONTAINER} flex items-start justify-between gap-4 py-2.5`}>
          <div className="min-w-0">
            <h1 id="home-title" className="text-lg leading-7 font-semibold tracking-tight">
              AI SDLC Landscape
            </h1>
            <p
              id="home-intro"
              hidden={collapsed}
              className="mt-1 max-w-4xl text-sm leading-5 text-pretty text-muted-foreground"
            >
              A neutral, public map of the AI tools that work across the software development lifecycle. Every fact has
              a public source. The data and code are open{" "}
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className={LINK}>
                on GitHub
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              , and anyone, person or agent, can{" "}
              <Link href="/contribute" className={LINK}>
                request a change
              </Link>
              .
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="max-md:size-11"
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-controls="home-intro"
            aria-label={collapsed ? "Show description" : "Hide description"}
          >
            <Chevron aria-hidden />
          </Button>
        </div>
      </section>
      <WhatsNewStrip items={whatsNew} collapsed={collapsed} />
      </div>
      {children}
    </div>
  );
}
