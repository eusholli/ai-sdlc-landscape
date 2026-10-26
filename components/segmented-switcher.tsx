"use client";

import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { ToggleGroup } from "radix-ui";

export interface SegmentOption<V extends string> {
  value: V;
  label: string;
  icon: LucideIcon;
}

/**
 * A row of icon-and-label choices with a sliding pill under the active one. The Landscape views
 * and the Analyze choices tabs both use it. Labels hide below 640 px, so each icon carries one.
 */
export function SegmentedSwitcher<V extends string>({
  options,
  value,
  onChange,
  label,
  pillId,
}: {
  options: readonly SegmentOption<V>[];
  /** The active value, or "" for none. */
  value: V | "";
  onChange: (next: V) => void;
  label: string;
  /** A layoutId unique to this switcher, so two switchers never share a pill. */
  pillId: string;
}) {
  const reduceMotion = useReducedMotion();
  const isOption = (v: string): v is V => options.some((o) => o.value === v);

  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(next) => {
        if (isOption(next)) onChange(next);
      }}
      aria-label={label}
      className="inline-flex items-center rounded-lg bg-muted p-0.5"
    >
      {options.map(({ value: v, label: text, icon: Icon }) => (
        <ToggleGroup.Item
          key={v}
          value={v}
          aria-label={text}
          className="relative inline-flex h-7 items-center rounded-md px-3 text-sm max-sm:h-10 max-sm:px-3 font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=on]:text-foreground"
        >
          {value === v && (
            <motion.span
              aria-hidden
              layoutId={reduceMotion ? undefined : pillId}
              initial={reduceMotion ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={reduceMotion ? { duration: 0.15 } : { type: "spring", bounce: 0.15, duration: 0.35 }}
              className="absolute inset-0 rounded-md bg-background shadow-sm ring-1 ring-border"
            />
          )}
          <span className="relative flex items-center gap-1.5">
            <Icon className="size-3.5" aria-hidden />
            <span className="max-sm:sr-only">{text}</span>
          </span>
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
