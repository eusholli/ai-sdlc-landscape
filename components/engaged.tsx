"use client";

// The "Engaged" event behind site-ops' visitor-quality number (references/metrics.md):
// fired when the visitor has viewed two pages or spent 60 seconds with a page visible.
// Plausible's aggregate API cannot union "two pages" with "60 seconds", so the browser
// decides and Plausible counts the goal by unique visitor, so a repeat fire inflates
// nothing. State lives in module memory only: no cookie, no localStorage or
// sessionStorage, nothing written to the device, so the site needs no consent banner. It
// survives client-side navigation and ends with a full reload. Mount once in the root
// layout, beside the Plausible snippet, and register a custom-event goal named "Engaged".

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SECONDS = 60;
let views = 0;
let sent = false;

function fire() {
  if (sent) return;
  sent = true;
  (window as unknown as { plausible?: (e: string) => void }).plausible?.("Engaged");
}

export function Engaged() {
  const path = usePathname();

  useEffect(() => {
    if (++views >= 2) return fire();

    let visible = 0;
    const t = setInterval(() => {
      if (document.visibilityState === "visible" && ++visible >= SECONDS) {
        clearInterval(t);
        fire();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [path]);

  return null;
}
