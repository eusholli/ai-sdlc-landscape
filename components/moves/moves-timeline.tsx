"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { MoveEntry } from "@/components/moves/move-entry";
import type { MoveItem } from "@/components/moves/types";

function TimelineRow({ item, reduceMotion }: { item: MoveItem; reduceMotion: boolean }) {
  const ref = useRef<HTMLLIElement>(null);
  // Progress is 0.5 when the entry is centred in the viewport, whatever its height.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.5, 0.7, 1], [0.95, 0.97, 1, 0.97, 0.95]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.5, 0.7, 1], [0.6, 0.8, 1, 0.8, 0.6]);
  const dotScale = useTransform(scrollYProgress, [0, 0.3, 0.5, 0.7, 1], [0.6, 0.8, 1.35, 0.8, 0.6]);

  return (
    <li ref={ref} className="relative">
      <motion.span
        aria-hidden
        className="absolute top-6 -left-[35.5px] size-3 rounded-full bg-foreground ring-4 ring-background"
        style={reduceMotion ? undefined : { scale: dotScale }}
      />
      <motion.div className="origin-left" style={reduceMotion ? undefined : { scale, opacity }}>
        <MoveEntry item={item} />
      </motion.div>
    </li>
  );
}

export function MovesTimeline({ items }: { items: MoveItem[] }) {
  const reduceMotion = useReducedMotion() ?? false;
  const listRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 70%", "end 50%"] });

  return (
    <ol ref={listRef} className="relative space-y-6 pl-10">
      <span aria-hidden className="absolute top-3 bottom-3 left-2.5 w-px bg-border" />
      <motion.span
        aria-hidden
        className="absolute top-3 bottom-3 left-2.5 w-px origin-top bg-foreground"
        style={{ scaleY: reduceMotion ? 1 : scrollYProgress }}
      />
      {items.map((item) => (
        <TimelineRow key={item.toolId} item={item} reduceMotion={reduceMotion} />
      ))}
    </ol>
  );
}
