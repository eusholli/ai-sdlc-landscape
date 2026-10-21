"use client";

import { Maximize, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ZOOM_LEVELS, type ZoomLevel } from "./zoom-level";

interface MapControlsProps {
  /** With `onZoomTo`, shows the three-step detail indicator beside the buttons. */
  level?: ZoomLevel;
  onZoomTo?: (scale: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  fitLabel?: string;
}

export function MapControls({
  level,
  onZoomIn,
  onZoomOut,
  onZoomTo,
  onFit,
  fitLabel = "Fit to screen",
}: MapControlsProps) {
  return (
    <div className="absolute right-4 bottom-4 flex items-end gap-2">
      {onZoomTo && (
        <div
          role="group"
          aria-label="Detail level"
          className="flex flex-col overflow-hidden rounded-md border bg-background text-xs shadow-xs"
        >
          {[...ZOOM_LEVELS].reverse().map((step) => (
            <button
              key={step.id}
              type="button"
              aria-pressed={level === step.id}
              onClick={() => onZoomTo(step.scale)}
              className={cn(
                "px-2.5 py-1.5 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset",
                level === step.id ? "bg-muted font-semibold" : "text-muted-foreground",
              )}
            >
              {step.label}
            </button>
          ))}
        </div>
      )}
      <div role="group" aria-label="Map zoom" className="flex flex-col gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Zoom in"
          title="Zoom in (+)"
          onClick={onZoomIn}
        >
          <ZoomIn />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Zoom out"
          title="Zoom out (-)"
          onClick={onZoomOut}
        >
          <ZoomOut />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={fitLabel}
          title={`${fitLabel} (0)`}
          onClick={onFit}
        >
          <Maximize />
        </Button>
      </div>
    </div>
  );
}
