"use client";

import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { SITE_CONTAINER } from "@/components/site-name";
import type { PhaseId } from "@/lib/types";

export interface WhatsNewItem {
  key: string;
  /** YYYY-MM-DD, or YYYY-MM for a market move. */
  date: string;
  dateLabel: string;
  text: string;
  /** Set when the entry touched exactly one tool. */
  tool: { name: string; logo: string | null; phase: PhaseId | null } | null;
}

/**
 * One compact row at the top of the home page: the latest entries from the changes timeline. It
 * scrolls sideways rather than wrapping. When the intro is collapsed it keeps only the newest
 * entry. The entries slide in once on load, newest first, and then stay still.
 */
export function WhatsNewStrip({ items, collapsed }: { items: WhatsNewItem[]; collapsed: boolean }) {
  const reduce = useReducedMotion();
  if (items.length === 0) return null;
  const shown = collapsed ? items.slice(0, 1) : items;

  return (
    <div className="border-b bg-background">
      <div className={`${SITE_CONTAINER} flex items-center gap-3 py-1.5`}>
        <p className="shrink-0 text-xs font-semibold">What&apos;s new</p>
        <ul
          aria-label="Latest changes"
          tabIndex={0}
          className="flex min-w-0 flex-1 items-center gap-5 overflow-x-auto rounded-sm p-0.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {shown.map((item, index) => (
            <motion.li
              key={item.key}
              className="flex shrink-0 items-center gap-1.5 text-xs"
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={
                reduce
                  ? { duration: 0.15 }
                  : { type: "spring", stiffness: 260, damping: 26, delay: 0.15 + index * 0.12 }
              }
            >
              <time dateTime={item.date} className="font-mono whitespace-nowrap text-muted-foreground tabular-nums">
                {item.dateLabel}
              </time>
              {item.tool && <Logo name={item.tool.name} src={item.tool.logo} phase={item.tool.phase} size={16} />}
              <span title={item.text} className="max-w-[18rem] truncate">
                {item.text}
              </span>
            </motion.li>
          ))}
        </ul>
        <Link
          href="/changes"
          className="inline-flex shrink-0 items-center gap-1 rounded-sm text-xs underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 max-md:min-h-11 max-md:px-1"
        >
          All changes
          <ArrowRight aria-hidden className="size-3" />
        </Link>
      </div>
    </div>
  );
}
