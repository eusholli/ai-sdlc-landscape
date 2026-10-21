"use client";

import { motion } from "motion/react";
import type { RelationType } from "@/lib/types";
import type { RelationEdge } from "./relation-index";
import { RELATION_ORDER, RELATION_STYLE } from "./relation-style";

/** Appears while a tile is active and lists only the relation types that tile has. */
export function RelationLegend({ edges }: { edges: RelationEdge[] }) {
  const counts = new Map<RelationType, number>();
  for (const edge of edges) counts.set(edge.type, (counts.get(edge.type) ?? 0) + 1);
  if (counts.size === 0) return null;

  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="pointer-events-none absolute top-4 left-4 min-w-40 rounded-md border bg-background/90 px-2.5 py-2 text-xs shadow-sm backdrop-blur"
    >
      <p className="mb-1.5 font-medium">Relations</p>
      <ul className="flex flex-col gap-1">
        {RELATION_ORDER.filter((type) => counts.has(type)).map((type) => (
          <li key={type} className="flex items-center gap-2">
            <span className="h-0.5 w-5 shrink-0 rounded-full" style={{ background: RELATION_STYLE[type].color }} />
            <span>{RELATION_STYLE[type].label}</span>
            <span className="ml-auto pl-3 font-mono text-muted-foreground tabular-nums">{counts.get(type)}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
