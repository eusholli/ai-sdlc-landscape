import { Suspense } from "react";
import { SearchPalette } from "@/components/filters/search-palette";
import { Notices } from "@/components/notices";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { HEADER_GRID, SITE_CONTAINER, SiteName } from "@/components/site-name";
import { WhatsNewStrip } from "@/components/whats-new-strip";
import { ToolDrawer } from "@/components/tool/tool-drawer";
import { phases, toolsLite } from "@/lib/data";
import { toolDetailRefs } from "@/lib/tool-refs";
import { whatsNewItems } from "@/lib/whats-new";

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:ring-3 focus:ring-ring/50"
      >
        Skip to content
      </a>
      <WhatsNewStrip items={whatsNewItems()} />
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <Suspense
          fallback={
            <div className={`${SITE_CONTAINER} ${HEADER_GRID}`}>
              <SiteName />
            </div>
          }
        >
          <SiteHeader />
        </Suspense>
      </header>
      <Suspense fallback={null}>
        <SearchPalette tools={toolsLite()} phases={phases()} />
      </Suspense>
      <div className="flex-1">{children}</div>
      <SiteFooter />
      <Suspense fallback={null}>
        <ToolDrawer refs={toolDetailRefs()} />
      </Suspense>
      <Notices />
    </div>
  );
}
