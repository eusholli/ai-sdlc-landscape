"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

// Draws each <pre data-mermaid> inside the article as an SVG. Mermaid loads on this page only and
// only when a diagram exists; without script the diagram source stays readable in its code block.
export function PaperMermaid({ targetId }: { targetId: string }) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const root = document.getElementById(targetId);
    const blocks = root ? Array.from(root.querySelectorAll<HTMLElement>("pre[data-mermaid]")) : [];
    if (!blocks.length) return;
    let cancelled = false;

    (async () => {
      const { default: mermaid } = await import("mermaid");
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: resolvedTheme === "dark" ? "dark" : "neutral",
      });
      for (const [i, block] of blocks.entries()) {
        const source = block.dataset.source ?? block.textContent ?? "";
        block.dataset.source = source;
        try {
          const { svg } = await mermaid.render(`paper-mermaid-${i}`, source);
          if (cancelled) return;
          block.classList.add("paper-mermaid-drawn");
          block.innerHTML = svg;
        } catch {
          // Leave the source text in place.
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [targetId, resolvedTheme]);

  return null;
}
