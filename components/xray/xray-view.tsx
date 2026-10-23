"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { AddToolPopover } from "@/components/compare/add-tool-popover";
import { CopyButton } from "@/components/copy-button";
import { ToolLink } from "@/components/tool/tool-actions";
import { Button } from "@/components/ui/button";
import { SITE_URL } from "@/lib/site";
import type { MarketMove, Phase, PhaseId, PricingBucket, RelationLite, XrayTool } from "@/lib/types";
import { buildXray } from "@/lib/xray";
import { useXray } from "./use-xray";

const PRICING_LABELS: Record<PricingBucket | "unpublished", string> = {
  free: "Free",
  seat: "Per seat",
  usage: "Usage based",
  subscription: "Subscription",
  enterprise: "Enterprise contract",
  other: "Other",
  unpublished: "Not published",
};

const FIELD_LABELS: Record<string, string> = {
  models: "models",
  pricingModel: "pricing model",
  deployment: "deployment",
  customers: "customers",
};

export function XrayView({
  tools,
  relations,
  moves,
  phases,
}: {
  tools: XrayTool[];
  relations: RelationLite[];
  moves: MarketMove[];
  phases: Phase[];
}) {
  const byId = useMemo(() => new Map(tools.map((t) => [t.id, t])), [tools]);
  const { ids, add, remove, clear } = useXray();
  const sel = ids.flatMap((id) => byId.get(id) ?? []);
  const report = useMemo(
    () => buildXray(sel, relations, moves, phases.map((p) => p.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids.join(","), relations, moves, phases],
  );

  const labelOf = (id: PhaseId) => phases.find((p) => p.id === id)?.label ?? id;
  const names = (list: string[]) =>
    list.map((id, i) => (
      <span key={id}>
        {i > 0 && ", "}
        <ToolLink id={id} className="font-medium underline-offset-2 hover:underline">
          {byId.get(id)?.name ?? id}
        </ToolLink>
      </span>
    ));

  const shareUrl = `${SITE_URL}/x-ray${ids.length ? `?xray=${ids.map(encodeURIComponent).join(",")}` : ""}`;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <AddToolPopover tools={tools} selected={ids} onAdd={(id) => add(id)} cap={null} />
          {ids.length > 0 && (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={clear}>
                Clear all
              </Button>
              <CopyButton text={shareUrl} label="link to this X-ray" buttonLabel="Copy link" />
            </>
          )}
        </div>
        {sel.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Selected tools">
            {sel.map((t) => (
              <li key={t.id} className="flex items-center gap-1 rounded-full border py-1 pl-3 pr-1 text-sm">
                <span>{t.name}</span>
                <Button type="button" variant="ghost" size="icon" className="size-6" onClick={() => remove(t.id)}>
                  <X aria-hidden />
                  <span className="sr-only">Remove {t.name}</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {sel.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
          <p className="font-medium">No tools picked yet</p>
          <p className="max-w-prose text-sm text-muted-foreground">
            Add the AI tools your team runs. The page shows what they cover, where they repeat each other, which
            models they depend on, who owns them and what the vendors have not published.
          </p>
          <AddToolPopover tools={tools} selected={ids} onAdd={(id) => add(id)} cap={null} />
        </div>
      ) : (
        <>
          <Section title="Coverage and gaps">
            <p className="text-sm text-muted-foreground">
              {report.gaps.length === 0
                ? "The selection covers every phase."
                : `No selected tool covers ${report.gaps.length} of ${report.coverage.length} phases.`}
            </p>
            <ul className="divide-y rounded-lg border text-sm">
              {report.coverage.map((c) => (
                <li key={c.phase} className="flex flex-wrap gap-x-4 gap-y-1 px-3 py-2">
                  <span className="w-44 shrink-0 text-muted-foreground">{labelOf(c.phase)}</span>
                  <span>{c.tools.length ? names(c.tools) : <span className="text-muted-foreground">No selected tool</span>}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Overlaps">
            {report.overlaps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No two selected tools share a primary phase.</p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm">
                {report.overlaps.map((o) => (
                  <li key={o.phase}>
                    {labelOf(o.phase)}: {names(o.tools)} each name it as their primary phase.
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Model dependence">
            {report.singleModel.length > 0 ? (
              <ul className="flex flex-col gap-1 text-sm">
                {report.singleModel.map((s) => (
                  <li key={s.tool}>
                    {names([s.tool])} publishes one model: {s.model}.
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No selected tool publishes a single model.</p>
            )}
            {report.modelsUnpublished.length > 0 && (
              <p className="text-sm">Not published: models for {names(report.modelsUnpublished)}.</p>
            )}
          </Section>

          <Section title="Ownership changes">
            {report.moved.length === 0 ? (
              <p className="text-sm text-muted-foreground">No selected tool has a recorded acquisition or shutdown.</p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm">
                {report.moved.map((m) => (
                  <li key={m.tool}>
                    {names([m.tool])}: {m.status}
                    {m.move?.date ? ` (${m.move.date})` : " (date not published)"}.{" "}
                    {m.move?.sources.map((url, i) => (
                      <a key={url} href={url} className="underline underline-offset-2" rel="noopener noreferrer">
                        {`Source ${i + 1}`}{" "}
                      </a>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Pricing mix">
            <ul className="divide-y rounded-lg border text-sm">
              {(Object.keys(PRICING_LABELS) as (PricingBucket | "unpublished")[])
                .filter((b) => report.pricing[b].length > 0)
                .map((b) => (
                  <li key={b} className="flex flex-wrap gap-x-4 gap-y-1 px-3 py-2">
                    <span className="w-44 shrink-0 text-muted-foreground">{PRICING_LABELS[b]}</span>
                    <span>{names(report.pricing[b])}</span>
                  </li>
                ))}
            </ul>
          </Section>

          <Section title="Connections and isolated tools">
            {report.links.length === 0 ? (
              <p className="text-sm text-muted-foreground">The records show no link between the selected tools.</p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm">
                {report.links.map((l) => (
                  <li key={`${l.from}|${l.type}|${l.to}`}>
                    {names([l.from])} {l.type.replace(/_/g, " ")} {names([l.to])}
                  </li>
                ))}
              </ul>
            )}
            {report.isolated.length > 0 && (
              <p className="text-sm">No recorded link to another selected tool: {names(report.isolated)}.</p>
            )}
          </Section>

          <Section title="Questions to ask">
            {report.unpublished.length === 0 ? (
              <p className="text-sm text-muted-foreground">Every vendor publishes the fields this page checks.</p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm">
                {report.unpublished.map((u) => (
                  <li key={u.tool}>
                    {byId.get(u.tool)?.name ?? u.tool} has not published {u.fields.map((f) => FIELD_LABELS[f] ?? f).join(", ")}.{" "}
                    <Link href={`/evaluate/${u.tool}`} className="underline underline-offset-2">
                      Questions to ask this vendor
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}
