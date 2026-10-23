"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/** `buttonLabel` replaces the default "Copy" text when the button needs a fuller visible name. */
export function CopyButton({ text, label, buttonLabel }: { text: string; label: string; buttonLabel?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="max-md:h-11 max-md:px-3.5" onClick={copy}>
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copied ? "Copied" : (buttonLabel ?? "Copy")}
        {!buttonLabel && <span className="sr-only"> {label}</span>}
      </Button>
      <span role="status" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </>
  );
}
