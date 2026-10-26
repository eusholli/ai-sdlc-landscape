"use client";

import { usePathname } from "next/navigation";
import { useQueryStates } from "nuqs";
import { useEffect, useRef, useState } from "react";
import { useCompare } from "@/components/compare/use-compare";
import { SITE_CONTAINER } from "@/components/site-name";
import { Button } from "@/components/ui/button";
import { EMPTY_CHOICES, choicesStore, cleanChoices, incomingAction, mergeChoices, type Choices } from "@/lib/choices";
import { filterParsers } from "@/lib/filters";

const urlParsers = { compare: filterParsers.compare, via: filterParsers.via };
const keyOf = (c: Choices) => `${c.compare.join(",")}|${c.via.join(",")}`;

/**
 * Keeps the saved choices and the URL in step. A link that carries `compare` is read in: taken as
 * is when nothing is saved, and asked about when it would change a saved selection. On Analyze
 * choices the URL then shows the saved selection, so the address is the share link; elsewhere the
 * keys are removed once read. Needs a Suspense boundary, like any nuqs hook.
 */
export function ChoicesUrlSync({ names }: { names: Record<string, string> }) {
  const pathname = usePathname();
  const [{ compare, via }, setQuery] = useQueryStates(urlParsers);
  const { ids, via: savedVia } = useCompare();
  const [pending, setPending] = useState<Choices | null>(null);
  // The last query this component read or wrote, so its own writes never read back as a shared link.
  const seen = useRef<string | null>(null);
  // The link being asked about, also in a ref so a second run of the effect sees it at once.
  const held = useRef<Choices | null>(null);

  const linkKey = `${compare.join(",")}|${via.join(",")}`;
  const savedKey = `${ids.join(",")}|${savedVia.join(",")}`;

  useEffect(() => {
    const store = choicesStore();
    if (linkKey !== seen.current && compare.length > 0) {
      const link = cleanChoices(compare, via);
      const action = incomingAction(store.get(), link);
      if (action === "adopt") store.set(link);
      if (action === "ask") setPending((held.current = link));
    }
    seen.current = linkKey;
    // Until the user answers, the address stays the shared link, so a reload asks again.
    if (held.current) return;

    const target = pathname === "/analyze" ? store.get() : EMPTY_CHOICES;
    if (keyOf(target) === linkKey) return;
    seen.current = keyOf(target);
    void setQuery({
      compare: target.compare.length ? target.compare : null,
      via: target.via.length ? target.via : null,
    });
    // compare and via are read through linkKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, linkKey, savedKey, pending, setQuery]);

  if (!pending) return null;

  const shared = pending.compare.filter((id) => names[id]).map((id) => names[id]);
  const resolve = (next: Choices | null) => {
    if (next) choicesStore().set(next);
    held.current = null;
    setPending(null);
  };

  return (
    <section aria-label="Shared choices" className="border-b bg-muted/50">
      <div className={`${SITE_CONTAINER} flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5`}>
        <p className="min-w-0 flex-[1_1_18rem] text-sm">
          <span className="font-medium">This link shares {shared.length === 1 ? "1 tool" : `${shared.length} tools`}</span>
          {shared.length > 0 && <span className="text-muted-foreground">: {shared.join(", ")}</span>}
          <span className="text-muted-foreground">. You already have choices saved.</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" className="max-sm:h-11" onClick={() => resolve(mergeChoices(choicesStore().get(), pending))}>
            Add to mine
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="max-sm:h-11"
            onClick={() => resolve(pending)}
          >
            Replace mine
          </Button>
          <Button type="button" size="sm" variant="ghost" className="max-sm:h-11" onClick={() => resolve(null)}>
            Keep mine
          </Button>
        </div>
      </div>
    </section>
  );
}
