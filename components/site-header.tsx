"use client";

import { Activity, ArrowLeftRight, BarChart3, Info, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryStates } from "nuqs";
import { useEffect } from "react";
import { SITE_CONTAINER, HEADER_GRID, SiteName } from "@/components/site-name";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { ViewSwitcher } from "@/components/view-switcher";
import { normalizeCompare } from "@/lib/compare";
import { filterParsers } from "@/lib/filters";
import { OPEN_SEARCH_EVENT, emit } from "@/lib/ui-events";

const NAV_LINKS = [
  { href: "/moves", label: "Moves", Icon: Activity },
  { href: "/insights", label: "Insights", Icon: BarChart3 },
  { href: "/about", label: "About", Icon: Info },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [{ compare }] = useQueryStates(filterParsers);
  const compareIds = normalizeCompare(compare);

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

      <div className="order-last col-span-2 flex justify-center md:order-none md:col-span-1">
        <ViewSwitcher />
      </div>

      <div className="flex items-center justify-end gap-1.5">
        <Button variant="outline" size="sm" onClick={() => emit(OPEN_SEARCH_EVENT)} aria-label="Search tools">
          <Search aria-hidden />
          <span className="hidden sm:inline">Search</span>
          <Kbd className="hidden md:inline-flex">⌘K</Kbd>
        </Button>

        <Button asChild variant="outline" size="sm">
          <Link
            href={compareIds.length ? `/compare?compare=${compareIds.map(encodeURIComponent).join(",")}` : "/compare"}
            aria-label={compareIds.length ? `Compare, ${compareIds.length} selected` : "Compare"}
          >
            <ArrowLeftRight aria-hidden />
            <span className="hidden md:inline">Compare</span>
            {compareIds.length > 0 && (
              <Badge variant="secondary" className="min-w-5 px-1.5 font-mono tabular-nums">
                {compareIds.length}
              </Badge>
            )}
          </Link>
        </Button>

        <ThemeToggle />

        <nav aria-label="Pages" className="flex items-center gap-0.5">
          {NAV_LINKS.map(({ href, label, Icon }) => (
            <Button key={href} asChild variant="ghost" size="sm">
              <Link href={href} aria-label={label} aria-current={pathname === href ? "page" : undefined}>
                <Icon aria-hidden />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            </Button>
          ))}
        </nav>
      </div>
    </div>
  );
}
