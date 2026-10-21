"use client";

import { Minus, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryStates } from "nuqs";
import { Suspense, type MouseEvent, type ReactNode } from "react";
import { useCompare } from "@/components/compare/use-compare";
import { Button } from "@/components/ui/button";
import { filterParsers } from "@/lib/filters";

// Both components read the URL, which needs a Suspense boundary on a statically rendered page.
// Each has its own boundary with a plain fallback, so the rest of the page stays in the static HTML.

interface ToolLinkProps {
  id: string;
  className?: string;
  children: ReactNode;
}

const toolHref = (id: string) => `/?tool=${encodeURIComponent(id)}`;

function ToolLinkInner({ id, className, children }: ToolLinkProps) {
  const [, setQuery] = useQueryStates(filterParsers);
  const pathname = usePathname();

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
    if (pathname !== "/" || modified) return;
    event.preventDefault();
    void setQuery({ tool: id });
  };

  return (
    <Link href={toolHref(id)} onClick={onClick} className={className}>
      {children}
    </Link>
  );
}

/** Opens a tool in the drawer. On the home page it keeps the current view and filters. */
export function ToolLink(props: ToolLinkProps) {
  return (
    <Suspense
      fallback={
        <Link href={toolHref(props.id)} className={props.className}>
          {props.children}
        </Link>
      }
    >
      <ToolLinkInner {...props} />
    </Suspense>
  );
}

function CompareButtonInner({ id, name }: { id: string; name?: string }) {
  const { has, add, remove } = useCompare();
  const inSet = has(id);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-pressed={inSet}
      onClick={() => (inSet ? remove(id) : add(id, name))}
    >
      {inSet ? <Minus aria-hidden /> : <Plus aria-hidden />}
      {inSet ? "Remove from compare" : "Add to compare"}
    </Button>
  );
}

export function CompareButton({ id, name }: { id: string; name?: string }) {
  return (
    <Suspense
      fallback={
        <Button type="button" variant="outline" size="sm" disabled>
          <Plus aria-hidden />
          Add to compare
        </Button>
      }
    >
      <CompareButtonInner id={id} name={name} />
    </Suspense>
  );
}
