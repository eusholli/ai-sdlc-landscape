"use client";

import { Maximize, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}

export function MapControls({ onZoomIn, onZoomOut, onFit }: MapControlsProps) {
  return (
    <div role="group" aria-label="Map zoom" className="absolute right-4 bottom-4 flex flex-col gap-1">
      <Button type="button" variant="outline" size="icon-sm" aria-label="Zoom in" title="Zoom in (+)" onClick={onZoomIn}>
        <ZoomIn />
      </Button>
      <Button type="button" variant="outline" size="icon-sm" aria-label="Zoom out" title="Zoom out (-)" onClick={onZoomOut}>
        <ZoomOut />
      </Button>
      <Button type="button" variant="outline" size="icon-sm" aria-label="Fit to screen" title="Fit to screen (0)" onClick={onFit}>
        <Maximize />
      </Button>
    </div>
  );
}
