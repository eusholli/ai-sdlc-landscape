import type { ReactNode } from "react";

export type HeadingTag = "h2" | "h3";

export function SectionHeading({ as: Tag, id, children }: { as: HeadingTag; id?: string; children: ReactNode }) {
  return (
    <Tag id={id} className="text-sm font-semibold">
      {children}
    </Tag>
  );
}
