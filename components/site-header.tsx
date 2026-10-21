"use client";

import { ArrowLeftRight, Info, Search } from "lucide-react";
import Link from "next/link";
import { useQueryStates } from "nuqs";
import { useEffect } from "react";
import { SITE_CONTAINER, HEADER_GRID, SiteName } from "@/components/site-name";
import { SiteNav } from "@/components/site-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { ViewSwitcher } from "@/components/view-switcher";
import { filterParsers } from "@/lib/filters";
import { OPEN_COMPARE_EVENT, OPEN_SEARCH_EVENT, emit } from "@/lib/ui-events";

export function SiteHeader() {
  const [{ compare }] = useQueryStates(filterParsers);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        emit(OPEN_SEARCH_EVENT);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className={`${SITE_CONTAINER} ${HEADER_GRID}`}>
      <SiteName />

      <div className="order-last col-span-2 flex items-center justify-center gap-2 md:order-none md:col-span-1">
        <ViewSwitcher />
        <SiteNav className="md:hidden" />
      </div>

      <div className="flex items-center justify-end gap-1.5">
        <Button variant="outline" size="sm" onClick={() => emit(OPEN_SEARCH_EVENT)} aria-label="Search tools">
          <Search aria-hidden />
          <span className="hidden lg:inline">Search</span>
          <Kbd className="hidden 2xl:inline-flex">⌘K</Kbd>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => emit(OPEN_COMPARE_EVENT)}
          aria-label={compare.length ? `Compare, ${compare.length} selected` : "Compare"}
        >
          <ArrowLeftRight aria-hidden />
          <span className="hidden xl:inline">Compare</span>
          {compare.length > 0 && (
            <Badge variant="secondary" className="min-w-5 px-1.5 font-mono tabular-nums">
              {compare.length}
            </Badge>
          )}
        </Button>

        <ThemeToggle />

        <SiteNav className="hidden md:flex" />

        <Button asChild variant="ghost" size="sm">
          <Link href="/about" aria-label="About">
            <Info aria-hidden />
            <span className="hidden 2xl:inline">About</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
