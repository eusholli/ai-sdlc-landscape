import { STAGES, layerColor } from "@/lib/format";

const LAYERS = [
  { id: "agent-infra", label: "Agent infrastructure" },
  { id: "model", label: "Model providers" },
] as const;

export function StageLegend({ className }: { className?: string }) {
  return (
    <ul
      aria-label="Lifecycle stages and layers"
      className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground ${className ?? ""}`}
    >
      {STAGES.map((stage) => (
        <li key={stage.id} className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: `var(--stage-${stage.id})` }} />
          {stage.label}
        </li>
      ))}
      <li aria-hidden className="hidden h-3.5 w-px bg-border sm:block" />
      {LAYERS.map((layer) => (
        <li key={layer.id} className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-full" style={{ background: layerColor(layer.id) }} />
          {layer.label}
        </li>
      ))}
    </ul>
  );
}
