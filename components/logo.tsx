// A tool's own icon, or a monogram when none was found. Use this everywhere a logo appears.
// A plain <img> on purpose: the set mixes SVG, ICO, PNG and WebP, which next/image does not
// handle well, and every file is already small.
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { monogram, phaseColor } from "@/lib/format";
import type { PhaseId } from "@/lib/types";

export function Logo({
  name,
  src,
  phase = null,
  size = 32,
  className,
}: {
  name: string;
  src: string | null;
  /** Tints the monogram with the tool's stage colour. */
  phase?: PhaseId | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const box = cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-white ring-1 ring-black/10 dark:ring-white/10", className);

  if (!src || failed) {
    return (
      <span
        aria-hidden
        className={cn(box, "font-semibold text-foreground")}
        style={{
          width: size,
          height: size,
          // A tint, not the full stage colour: white on the brighter stages fails 4.5:1.
          background: `color-mix(in oklch, ${phaseColor(phase)} 30%, var(--card))`,
          boxShadow: `inset 0 -3px 0 ${phaseColor(phase)}`,
          fontSize: Math.max(9, size * 0.38),
        }}
      >
        {monogram(name)}
      </span>
    );
  }
  return (
    <span className={box} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="h-[82%] w-[82%] object-contain"
      />
    </span>
  );
}
