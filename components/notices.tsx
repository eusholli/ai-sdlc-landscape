"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { TOAST_EVENT } from "@/lib/ui-events";

const VISIBLE_MS = 5000;

/** One transient message at a time, announced politely to screen readers. */
export function Notices() {
  const [notice, setNotice] = useState<{ id: number; text: string } | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let counter = 0;
    const onToast = (event: Event) => {
      clearTimeout(timer);
      setNotice({ id: ++counter, text: (event as CustomEvent<string>).detail });
      timer = setTimeout(() => setNotice(null), VISIBLE_MS);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4"
    >
      {notice && (
        <div
          key={notice.id}
          className="pointer-events-auto flex max-w-md items-center gap-3 rounded-lg border bg-popover px-4 py-2.5 text-sm text-popover-foreground shadow-lg motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
        >
          <span>{notice.text}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss message"
            className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
