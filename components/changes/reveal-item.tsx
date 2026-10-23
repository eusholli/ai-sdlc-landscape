"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

const STAGGER_SECONDS = 0.04;
/** Only the first few entries of a group stagger. Later ones enter alone as the reader scrolls. */
const STAGGER_LIMIT = 8;

/**
 * A list item that fades and rises into view once. With reduced motion the rise is dropped and
 * only the opacity changes. The offset is part of the hidden state, so server and client markup match.
 */
export function RevealItem({ index, className, children }: { index: number; className?: string; children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.li
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -6% 0px" }}
      transition={
        reduceMotion
          ? { opacity: { duration: 0.15 }, y: { duration: 0 } }
          : {
              type: "spring",
              stiffness: 260,
              damping: 28,
              delay: index < STAGGER_LIMIT ? index * STAGGER_SECONDS : 0,
            }
      }
    >
      {children}
    </motion.li>
  );
}
