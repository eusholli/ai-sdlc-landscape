// A list of tools, each linking to its page with its logo, company and the vendor's own claim.
// Used by the phase pages and by "Other tools in <phase>" on a tool page.
import Link from "next/link";
import { Logo } from "@/components/logo";
import type { Tool } from "@/lib/types";

export function ToolRows({ tools }: { tools: Tool[] }) {
  return (
    <ul className="divide-y rounded-lg border">
      {tools.map((tool) => (
        <li key={tool.id}>
          <Link
            href={`/tools/${tool.id}`}
            prefetch={false}
            className="flex items-start gap-3 p-3 outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Logo name={tool.name} src={tool.logo} phase={tool.primaryPhase} size={36} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-semibold">{tool.name}</span>
              <span className="text-xs text-muted-foreground">{tool.company}</span>
              {tool.summary && (
                <span className="text-sm text-pretty text-muted-foreground">{`“${tool.summary}”`}</span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
