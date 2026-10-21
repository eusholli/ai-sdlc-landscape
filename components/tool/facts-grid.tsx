import { cn } from "@/lib/utils";
import type { Tool } from "@/lib/types";
import { FACTS, UNKNOWN, sourceAnchor } from "./facts";
import { SectionHeading, type HeadingTag } from "./section-heading";

export function FactsGrid({
  tool,
  sourceNumbers,
  heading,
}: {
  tool: Tool;
  /** Field name to the number of its entry in the sources list. */
  sourceNumbers: Record<string, number>;
  heading: HeadingTag;
}) {
  return (
    <section aria-labelledby="facts-heading" className="flex flex-col gap-3">
      <SectionHeading as={heading} id="facts-heading">
        Facts
      </SectionHeading>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {FACTS.map((fact) => {
          const value = fact.value(tool);
          const unknown = value === UNKNOWN;
          const sourceNumber = sourceNumbers[fact.field];
          return (
            <div key={fact.field} className={cn("min-w-0", fact.wide && "sm:col-span-2")}>
              <dt className="text-xs text-muted-foreground">{fact.label}</dt>
              <dd className={cn("mt-0.5 text-sm break-words", unknown && "text-muted-foreground")}>
                {value}
                {!unknown && sourceNumber ? (
                  <sup className="ml-0.5 text-[10px] tabular-nums">
                    <a
                      href={`#${sourceAnchor(tool.id, fact.field)}`}
                      aria-label={`${sourceNumber}, source for ${fact.label}`}
                      className="rounded-sm px-0.5 text-muted-foreground underline-offset-2 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {sourceNumber}
                    </a>
                  </sup>
                ) : null}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
