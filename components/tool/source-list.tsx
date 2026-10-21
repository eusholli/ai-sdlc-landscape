import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate, hostOf } from "@/lib/format";
import { TIER_LABELS, fieldLabel, sourceAnchor, type SourceGroup } from "./facts";
import { SectionHeading, type HeadingTag } from "./section-heading";

export function SourceList({
  toolId,
  groups,
  heading,
}: {
  toolId: string;
  groups: SourceGroup[];
  heading: HeadingTag;
}) {
  return (
    <section aria-labelledby="sources-heading" className="flex flex-col gap-3">
      <SectionHeading as={heading} id="sources-heading">
        Sources
      </SectionHeading>
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sources recorded.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {groups.map((group, index) => (
            <li key={group.field} id={sourceAnchor(toolId, group.field)} className="scroll-mt-4">
              <p className="text-xs font-medium">
                <span className="tabular-nums text-muted-foreground">{index + 1}. </span>
                {fieldLabel(group.field)}
              </p>
              <ul className="mt-1 flex flex-col gap-1.5">
                {group.sources.map((source) => (
                  <li key={source.url} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={source.url}
                      className="inline-flex items-center gap-1 rounded-sm break-all underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {hostOf(source.url)}
                      <ExternalLink className="size-3 shrink-0" aria-hidden />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                    <Badge variant="outline" title={`Tier ${source.tier}: ${TIER_LABELS[source.tier]}`}>
                      <span className="font-mono">{source.tier}</span> {TIER_LABELS[source.tier]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Retrieved <span className="tabular-nums">{formatDate(source.retrieved)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
