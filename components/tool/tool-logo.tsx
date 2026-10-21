"use client";

import { motion, useReducedMotion } from "motion/react";
import { Logo } from "@/components/logo";
import type { PhaseId } from "@/lib/types";

/**
 * The header logo shares `layoutId={"logo-" + id}` with the logo on the map tile, so it flies
 * from the tile into the drawer. With reduced motion it fades in over 150 ms instead.
 */
export function ToolLogo({
  id,
  name,
  src,
  phase,
  size = 56,
}: {
  id: string;
  name: string;
  src: string | null;
  phase: PhaseId | null;
  size?: number;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <motion.span
        className="inline-flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <Logo name={name} src={src} phase={phase} size={size} />
      </motion.span>
    );
  }

  return (
    <motion.span
      layoutId={"logo-" + id}
      className="inline-flex"
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
    >
      <Logo name={name} src={src} phase={phase} size={size} />
    </motion.span>
  );
}
