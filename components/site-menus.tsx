"use client";

import { ChevronDown, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import { useState, type ComponentProps } from "react";
import { useCompare } from "@/components/compare/use-compare";
import { NAV, isCurrent, isGroupCurrent, type NavGroup, type NavItem } from "@/components/site-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { analyzeHref } from "@/lib/compare";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type ItemLinkProps = { item: NavItem; current: boolean; className: string } & Omit<ComponentProps<"a">, "href" | "className">;

// The rest props carry what DropdownMenu.Item passes through asChild (ref, role, handlers); without the ref, a click never closes the menu.
function ItemLink({ item, current, className, ...rest }: ItemLinkProps) {
  const body = (
    <>
      <item.Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="flex min-w-0 flex-col">
        <span className="font-medium">{item.label}</span>
        <span className="text-xs text-muted-foreground">{item.blurb}</span>
      </span>
    </>
  );
  // Files (the feed, the JSON) are plain links: the client router must not try to render them.
  return item.download ? (
    <a {...rest} href={item.href} className={className}>{body}</a>
  ) : (
    <Link {...rest} href={item.href} aria-current={current ? "page" : undefined} className={className}>{body}</Link>
  );
}

const ITEM =
  "flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none select-none hover:bg-muted focus-visible:bg-muted data-[highlighted]:bg-muted aria-[current=page]:bg-muted";

/** A direct link's href. Analyze choices carries the tools chosen so far, so the choice survives the move. */
function useGroupHref() {
  const { ids, via } = useCompare();
  return (group: NavGroup) => (group.id === "analyze" ? analyzeHref(ids, "choose", via) : group.href!);
}

/** The direct links and the About menu, from 1024 px up. */
export function DesktopMenus() {
  const pathname = usePathname();
  const hrefOf = useGroupHref();
  return (
    <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
      {NAV.map((group) => {
        const active = isGroupCurrent(group, pathname);
        if (!group.items) {
          return (
            <Button key={group.id} asChild variant="ghost" size="sm" className={cn("px-2.5", active && "bg-muted")}>
              <Link href={hrefOf(group)} aria-current={active ? "page" : undefined}>
                {group.label}
              </Link>
            </Button>
          );
        }
        return (
          <DropdownMenu.Root key={group.id} modal={false}>
            <DropdownMenu.Trigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn("gap-1 px-2.5 data-[state=open]:bg-muted", active && "bg-muted")}
              >
                {group.label}
                <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={6}
                className="z-50 flex w-80 flex-col gap-0.5 rounded-md bg-popover p-1.5 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
              >
                {group.items.map((item) => (
                  <DropdownMenu.Item key={item.href} asChild>
                    <ItemLink item={item} current={isCurrent(item, pathname)} className={ITEM} />
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        );
      })}
    </nav>
  );
}

/** Every page in one sheet, under 1024 px, with the theme choice. */
export function CompactMenu() {
  const pathname = usePathname();
  const hrefOf = useGroupHref();
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="max-sm:h-11 max-sm:w-11 lg:hidden" aria-label="Menu">
          <Menu aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(22rem,100vw)] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav aria-label="Main" className="flex flex-col gap-5 px-4 pb-6">
          <ul className="flex flex-col gap-0.5">
            {NAV.filter((g) => !g.items).map((group) => (
              <li key={group.id}>
                <Link
                  href={hrefOf(group)}
                  aria-current={isGroupCurrent(group, pathname) ? "page" : undefined}
                  className={cn(ITEM, "min-h-11 items-center font-medium")}
                  onClick={() => setOpen(false)}
                >
                  {group.label}
                </Link>
              </li>
            ))}
          </ul>
          {NAV.filter((g) => g.items).map((group) => (
            <section key={group.id} aria-labelledby={`menu-${group.id}`} className="flex flex-col gap-0.5">
              <h2 id={`menu-${group.id}`} className="px-2.5 pb-1 text-xs font-medium text-muted-foreground">{group.label}</h2>
              {group.items!.map((item) => (
                <ItemLink key={item.href} item={item} current={isCurrent(item, pathname)} className={cn(ITEM, "min-h-11")} onClick={() => setOpen(false)} />
              ))}
            </section>
          ))}
          <div className="flex items-center justify-between px-2.5">
            <span className="text-sm">Theme</span>
            <ThemeToggle />
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
