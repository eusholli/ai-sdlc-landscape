import type { RelationType } from "@/lib/types";
import { SectionHeading, type HeadingTag } from "./section-heading";
import { ToolLink } from "./tool-actions";
import type { ToolDetailRefs, ToolRelation } from "./types";

const TYPE_ORDER: RelationType[] = [
  "acquired_by",
  "built_on_model",
  "ships_inside",
  "integrates_with",
  "partners_with",
  "competes_with",
];

interface Group {
  key: string;
  label: string;
  items: { id: string; name: string }[];
}

function groupRelations(relations: ToolRelation[], labels: ToolDetailRefs["relationLabels"]): Group[] {
  const groups = new Map<string, Group>();
  for (const type of TYPE_ORDER) {
    for (const r of relations) {
      if (r.type !== type) continue;
      const label = labels[type][r.direction];
      // Symmetric types read the same in both directions, so they share one group.
      const key = `${type}|${label}`;
      const group = groups.get(key) ?? { key, label, items: [] };
      if (!group.items.some((i) => i.id === r.other)) group.items.push({ id: r.other, name: r.otherName });
      groups.set(key, group);
    }
  }
  for (const g of groups.values()) g.items.sort((a, b) => a.name.localeCompare(b.name));
  return [...groups.values()];
}

export function RelationGroups({
  relations,
  refs,
  heading,
}: {
  relations: ToolRelation[];
  refs: ToolDetailRefs;
  heading: HeadingTag;
}) {
  const groups = groupRelations(relations, refs.relationLabels);
  const linkable = new Set(refs.toolIds);

  return (
    <section aria-labelledby="relations-heading" className="flex flex-col gap-3">
      <SectionHeading as={heading} id="relations-heading">
        Relations
      </SectionHeading>
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No relations recorded.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <div key={group.key}>
              <p className="text-xs text-muted-foreground">
                {group.label} <span className="tabular-nums">({group.items.length})</span>
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <li key={item.id}>
                    {linkable.has(item.id) ? (
                      <ToolLink
                        id={item.id}
                        className="inline-block rounded-md border px-2 py-0.5 text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        {item.name}
                      </ToolLink>
                    ) : (
                      <span className="inline-block px-2 py-0.5 text-sm text-muted-foreground">{item.name}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
