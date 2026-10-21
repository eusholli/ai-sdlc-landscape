"use client";

import { useEffect, useState } from "react";
import { RELATION_STYLE } from "@/components/map/relation-style";
import type { RelationType } from "@/lib/types";

export interface Palette {
  /** Index 0 is stage 1. */
  stage: string[];
  layerInfra: string;
  layerModel: string;
  external: string;
  foreground: string;
  background: string;
  muted: string;
  relation: Record<RelationType, string>;
}

function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  const resolve = (expression: string) => {
    const name = /var\((--[\w-]+)\)/.exec(expression)?.[1];
    return name ? read(name, "#888888") : expression;
  };

  const relation = Object.fromEntries(
    (Object.keys(RELATION_STYLE) as RelationType[]).map((type) => [type, resolve(RELATION_STYLE[type].color)]),
  ) as Record<RelationType, string>;

  return {
    stage: [1, 2, 3, 4, 5, 6].map((n) => read(`--stage-${n}`, "#888888")),
    layerInfra: read("--layer-infra", "#6250d6"),
    layerModel: read("--layer-model", "#6b6a65"),
    external: read("--muted-foreground", "#888888"),
    foreground: read("--foreground", "#111111"),
    background: read("--background", "#ffffff"),
    muted: read("--muted-foreground", "#888888"),
    relation,
  };
}

/**
 * Canvas cannot use CSS variables, so the theme colours are read from the document. A class
 * observer re-reads them when next-themes flips light and dark, which keeps dark mode correct.
 */
export function usePalette(): Palette | null {
  const [palette, setPalette] = useState<Palette | null>(null);

  useEffect(() => {
    const update = () => setPalette(readPalette());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    return () => observer.disconnect();
  }, []);

  return palette;
}
