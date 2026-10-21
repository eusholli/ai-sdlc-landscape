"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { phaseColor } from "@/lib/format";
import { MoveEntry, type MoveItem } from "./move-entry";

function TimelineItem({ item }: { item: MoveItem }) {
  const ref = useRef<HTMLLIElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 90%", "end 10%"] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.94, 1, 0.94]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.45, 1, 0.45]);

  return (
    <motion.li
      ref={ref}
      style={reduceMotion ? undefined : { scale, opacity, transformOrigin: "left center" }}
      className="relative"
    >
      <span
        aria-hidden
        className="absolute top-5 -left-[2.375rem] size-3 rounded-full ring-4 ring-background"
        style={{ background: phaseColor(item.phase) }}
      />
      <MoveEntry item={item} />
    </motion.li>
  );
}

export function MovesTimeline({ items }: { items: MoveItem[] }) {
  const listRef = useRef<HTMLOListElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 60%", "end 60%"] });

  return (
    <div className="relative">
      <div aria-hidden className="absolute top-0 bottom-0 left-4 w-px bg-border" />
      <motion.div
        aria-hidden
        className="absolute top-0 bottom-0 left-4 w-px origin-top bg-foreground/60"
        style={{ scaleY: reduceMotion ? 1 : scrollYProgress }}
      />
      <ol ref={listRef} className="flex flex-col gap-6 pl-12">
        {items.map((item) => (
          <TimelineItem key={item.id} item={item} />
        ))}
      </ol>
    </div>
  );
}
