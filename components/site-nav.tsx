"use client";

import { History, TrendingUp, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/moves", label: "Moves", icon: History },
  { href: "/insights", label: "Insights", icon: TrendingUp },
] as const satisfies readonly { href: string; label: string; icon: LucideIcon }[];

/** Icon only until there is room for the words. */
export function SiteNav({ className = "" }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Pages" className={`flex items-center gap-1.5 ${className}`}>
      {LINKS.map(({ href, label, icon: Icon }) => (
        <Button key={href} asChild variant="ghost" size="sm">
          <Link href={href} aria-label={label} aria-current={pathname === href ? "page" : undefined} title={label}>
            <Icon aria-hidden />
            <span className="hidden 2xl:inline">{label}</span>
          </Link>
        </Button>
      ))}
    </nav>
  );
}
