"use client";

import { Map as MapIcon, Network, List, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useQueryStates } from "nuqs";
import { usePathname, useRouter } from "next/navigation";
import { ToggleGroup } from "radix-ui";
import { filterParsers } from "@/lib/filters";

const OPTIONS = [
  { value: "map", label: "Map", icon: MapIcon },
  { value: "network", label: "Network", icon: Network },
  { value: "list", label: "List", icon: List },
] as const satisfies readonly { value: string; label: string; icon: LucideIcon }[];

type View = (typeof OPTIONS)[number]["value"];

const isView = (v: string): v is View => OPTIONS.some((o) => o.value === v);

export function ViewSwitcher() {
  const [{ view }, setQuery] = useQueryStates(filterParsers);
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const onHome = pathname === "/";

  function select(next: string) {
    if (!isView(next)) return;
    if (onHome) setQuery({ view: next });
    else router.push(`/?view=${next}`);
  }

  return (
    <ToggleGroup.Root
      type="single"
      value={onHome ? view : ""}
      onValueChange={select}
      aria-label="View"
      className="inline-flex items-center rounded-lg bg-muted p-0.5"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = onHome && view === value;
        return (
          <ToggleGroup.Item
            key={value}
            value={value}
            className="relative inline-flex h-7 items-center rounded-md px-3 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=on]:text-foreground"
          >
            {active && (
              <motion.span
                aria-hidden
                layoutId={reduceMotion ? undefined : "view-pill"}
                initial={reduceMotion ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={reduceMotion ? { duration: 0.15 } : { type: "spring", bounce: 0.15, duration: 0.35 }}
                className="absolute inset-0 rounded-md bg-background shadow-sm ring-1 ring-border"
              />
            )}
            <span className="relative flex items-center gap-1.5">
              <Icon className="size-3.5" aria-hidden />
              {label}
            </span>
          </ToggleGroup.Item>
        );
      })}
    </ToggleGroup.Root>
  );
}
