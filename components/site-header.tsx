"use client";

import { Search } from "lucide-react";
import { useEffect } from "react";
import { SITE_CONTAINER, HEADER_GRID, SiteName } from "@/components/site-name";
import { CompactMenu, DesktopMenus } from "@/components/site-menus";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { OPEN_SEARCH_EVENT, emit } from "@/lib/ui-events";

export function SiteHeader() {
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

      <div className="hidden justify-center md:flex">
        <DesktopMenus />
      </div>

      <div className="flex items-center justify-end gap-1.5">
        <Button variant="outline" size="sm" className="max-sm:h-11 max-sm:w-11" onClick={() => emit(OPEN_SEARCH_EVENT)}>
          <Search aria-hidden />
          <span className="sr-only sm:not-sr-only">Search</span>
          <Kbd aria-hidden className="hidden xl:inline-flex">⌘K</Kbd>
        </Button>

        <div className="hidden lg:block">
          <ThemeToggle />
        </div>
        <CompactMenu />
      </div>
    </div>
  );
}
