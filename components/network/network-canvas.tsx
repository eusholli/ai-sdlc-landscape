"use client";

import ForceGraph2D, { type ForceGraphMethods, type LinkObject, type NodeObject } from "react-force-graph-2d";
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { monogram } from "@/lib/format";
import { DIRECTED, LINE_STYLE, type GraphLinkData, type GraphLinkSeed, type GraphNode } from "./graph-model";
import type { Palette } from "./use-palette";

export interface NetworkCanvasHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  fit: () => void;
  pan: (dx: number, dy: number) => void;
  centerOn: (id: string) => void;
}

interface NetworkCanvasProps {
  nodes: GraphNode[];
  links: GraphLinkSeed[];
  width: number;
  height: number;
  palette: Palette;
  alphaById: ReadonlyMap<string, number>;
  focusId: string | null;
  /** Neighbours of the focused node, which get a name under the node even when zoomed out. */
  labelIds: ReadonlySet<string> | null;
  describe: (node: GraphNode) => string;
  reducedMotion: boolean;
  /** Fit the view once each time this key changes. */
  fitKey: string;
  onNodeClick: (id: string) => void;
  onBackgroundClick: () => void;
  handleRef: MutableRefObject<NetworkCanvasHandle | null>;
}

const LOGO_ZOOM_RADIUS = 12;

const logoCache = new Map<string, HTMLImageElement>();
const logoListeners = new Set<() => void>();

function logoFor(src: string): HTMLImageElement | null {
  let image = logoCache.get(src);
  if (!image) {
    image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => logoListeners.forEach((listener) => listener());
    image.src = src;
    logoCache.set(src, image);
  }
  return image.complete && image.naturalWidth > 0 ? image : null;
}

function fillOf(node: GraphNode, palette: Palette): string {
  if (node.external) return palette.external;
  if (node.layer) return node.layer === "agent-infra" ? palette.layerInfra : palette.layerModel;
  return node.stage ? palette.stage[node.stage - 1] : palette.muted;
}

const DASHES = { solid: [], dashed: [4, 3], dotted: [1.5, 2.5] } as const;

export default function NetworkCanvas({
  nodes,
  links,
  width,
  height,
  palette,
  alphaById,
  focusId,
  labelIds,
  describe,
  reducedMotion,
  fitKey,
  onNodeClick,
  onBackgroundClick,
  handleRef,
}: NetworkCanvasProps) {
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const hoveredRef = useRef<GraphNode | null>(null);
  const fittedKey = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  const graphData = useMemo(
    () => ({
      nodes: ready ? nodes : [],
      links: ready ? links.map((l) => ({ source: l.from, target: l.to, type: l.type })) : [],
    }),
    [ready, nodes, links],
  );

  // Forces are set before any data goes in, so the warm-up already uses them.
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const d3Force = fg.d3Force.bind(fg) as unknown as (name: string, force?: unknown) => unknown;

    const charge = d3Force("charge") as
      | { strength: (n: number) => unknown; distanceMax: (n: number) => unknown }
      | undefined;
    charge?.strength(-30);
    charge?.distanceMax(240);
    (d3Force("link") as { distance: (n: number) => unknown } | undefined)?.distance(34);

    // A gentle pull to the middle keeps unconnected nodes from drifting off screen.
    let members: GraphNode[] = [];
    const pull = Object.assign(
      (alpha: number) => {
        for (const n of members) {
          const k = (n.degree === 0 ? 0.12 : 0.025) * alpha;
          n.vx = (n.vx ?? 0) - (n.x ?? 0) * k;
          n.vy = (n.vy ?? 0) - (n.y ?? 0) * k;
        }
      },
      {
        initialize: (initial: GraphNode[]) => {
          members = initial;
        },
      },
    );
    d3Force("pull", pull);
    setReady(true);
  }, []);

  const refresh = useCallback(() => {
    // `refresh` exists on the underlying force-graph instance but not in the bundled typings.
    (fgRef.current as { refresh?: () => void } | undefined)?.refresh?.();
  }, []);

  useEffect(() => {
    logoListeners.add(refresh);
    return () => void logoListeners.delete(refresh);
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh, alphaById, focusId, labelIds, palette]);

  const fit = useCallback(
    (ms: number) => {
      fgRef.current?.zoomToFit(ms, 48);
    },
    [],
  );

  useEffect(() => {
    if (!ready) return;
    const frame = requestAnimationFrame(() => fit(0));
    return () => cancelAnimationFrame(frame);
  }, [ready, fitKey, fit]);

  useEffect(() => {
    const ms = reducedMotion ? 0 : 300;
    handleRef.current = {
      zoomIn: () => {
        const fg = fgRef.current;
        if (fg) fg.zoom(fg.zoom() * 1.4, ms);
      },
      zoomOut: () => {
        const fg = fgRef.current;
        if (fg) fg.zoom(fg.zoom() / 1.4, ms);
      },
      fit: () => fit(ms),
      pan: (dx, dy) => {
        const fg = fgRef.current;
        if (!fg) return;
        const centre = fg.centerAt();
        const k = fg.zoom();
        fg.centerAt(centre.x + dx / k, centre.y + dy / k, 0);
      },
      centerOn: (id) => {
        const fg = fgRef.current;
        const node = nodes.find((n) => n.id === id);
        if (!fg || !node || node.x === undefined || node.y === undefined) return;
        fg.centerAt(node.x, node.y, ms);
        fg.zoom(Math.max(fg.zoom(), 2.4), ms);
      },
    };
    return () => {
      handleRef.current = null;
    };
  }, [handleRef, reducedMotion, fit, nodes]);

  const paintNode = useCallback(
    (raw: NodeObject, ctx: CanvasRenderingContext2D, scale: number) => {
      const n = raw as GraphNode;
      if (n.x === undefined || n.y === undefined) return;
      const r = n.radius;
      const emphasised = n.id === focusId || hoveredRef.current?.id === n.id;
      const screenRadius = r * scale;

      ctx.save();
      ctx.globalAlpha = alphaById.get(n.id) ?? 1;

      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = fillOf(n, palette);
      ctx.fill();

      if (!n.external && screenRadius >= LOGO_ZOOM_RADIUS) {
        const image = n.logo ? logoFor(n.logo) : null;
        if (image) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(n.x, n.y, r - 0.75 / scale, 0, Math.PI * 2);
          ctx.clip();
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(n.x - r, n.y - r, r * 2, r * 2);
          const side = r * 1.3;
          try {
            ctx.drawImage(image, n.x - side / 2, n.y - side / 2, side, side);
          } catch {
            // An image the browser cannot draw keeps the plain coloured node.
          }
          ctx.restore();
        } else {
          ctx.fillStyle = "#ffffff";
          ctx.font = `700 ${r * 0.85}px system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(monogram(n.name), n.x, n.y);
        }
      }

      ctx.lineWidth = (emphasised ? 2.5 : 1) / scale;
      ctx.strokeStyle = emphasised ? palette.foreground : palette.background;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.stroke();

      if (n.moved) {
        ctx.setLineDash([2 / scale, 2 / scale]);
        ctx.lineWidth = 1.2 / scale;
        ctx.strokeStyle = palette.foreground;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 2.5 / scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (labelIds?.has(n.id) || (!n.external && screenRadius >= LOGO_ZOOM_RADIUS)) {
        const text = n.name.length > 18 ? `${n.name.slice(0, 17)}\u2026` : n.name;
        ctx.font = `500 ${10 / scale}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.lineJoin = "round";
        ctx.lineWidth = 3 / scale;
        ctx.strokeStyle = palette.background;
        ctx.strokeText(text, n.x, n.y + r + 3 / scale);
        ctx.fillStyle = palette.foreground;
        ctx.fillText(text, n.x, n.y + r + 3 / scale);
      }

      ctx.restore();
    },
    [alphaById, focusId, labelIds, palette],
  );

  const paintPointerArea = useCallback((raw: NodeObject, color: string, ctx: CanvasRenderingContext2D) => {
    const n = raw as GraphNode;
    if (n.x === undefined || n.y === undefined) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.radius + 2, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const paintLink = useCallback(
    (link: LinkObject, ctx: CanvasRenderingContext2D, scale: number) => {
      const { source, target } = link;
      if (typeof source !== "object" || typeof target !== "object") return;
      const a = source as GraphNode;
      const b = target as GraphNode;
      if (a.x === undefined || a.y === undefined || b.x === undefined || b.y === undefined) return;

      const type = (link as unknown as GraphLinkData).type;
      const touchesFocus = focusId !== null && (a.id === focusId || b.id === focusId);
      const alpha =
        focusId !== null
          ? touchesFocus
            ? 0.9
            : 0.05
          : Math.min(alphaById.get(a.id) ?? 1, alphaById.get(b.id) ?? 1) * 0.55;
      const color = palette.relation[type];

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = (touchesFocus ? 2 : 1.2) / scale;
      ctx.setLineDash(DASHES[LINE_STYLE[type]].map((d) => d / scale));
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);

      if (DIRECTED.has(type) && scale > 0.5) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const length = Math.hypot(dx, dy) || 1;
        const ux = dx / length;
        const uy = dy / length;
        const tipX = b.x - ux * (b.radius + 1 / scale);
        const tipY = b.y - uy * (b.radius + 1 / scale);
        const size = 5 / scale;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - ux * size - uy * size * 0.45, tipY - uy * size + ux * size * 0.45);
        ctx.lineTo(tipX - ux * size + uy * size * 0.45, tipY - uy * size - ux * size * 0.45);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    },
    [alphaById, focusId, palette],
  );

  // Every hovered node shows its name and phase, because stage colour alone cannot name it.
  const paintHoverLabel = useCallback(
    (ctx: CanvasRenderingContext2D, scale: number) => {
      const node = hoveredRef.current;
      if (!node || node.x === undefined || node.y === undefined) return;

      const lines = [node.name, describe(node)];
      if (node.moved) lines.push("Acquired or shut down");

      const size = 12 / scale;
      const pad = 6 / scale;
      const lineHeight = size * 1.4;
      const fonts = lines.map((_, i) => `${i === 0 ? 600 : 400} ${size}px system-ui, sans-serif`);

      ctx.save();
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const widths = lines.map((line, i) => {
        ctx.font = fonts[i];
        return ctx.measureText(line).width;
      });
      const boxWidth = Math.max(...widths) + pad * 2;
      const boxHeight = lines.length * lineHeight + pad * 2 - (lineHeight - size);
      const boxX = node.x - boxWidth / 2;
      const boxY = node.y - node.radius - 6 / scale - boxHeight;

      ctx.globalAlpha = 1;
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 4 / scale);
      else ctx.rect(boxX, boxY, boxWidth, boxHeight);
      ctx.fillStyle = palette.background;
      ctx.fill();
      ctx.lineWidth = 1 / scale;
      ctx.strokeStyle = palette.muted;
      ctx.stroke();

      lines.forEach((line, i) => {
        ctx.font = fonts[i];
        ctx.fillStyle = i === 0 ? palette.foreground : palette.muted;
        ctx.fillText(line, boxX + pad, boxY + pad + i * lineHeight);
      });
      ctx.restore();
    },
    [describe, palette],
  );

  return (
    <ForceGraph2D
      ref={fgRef}
      width={width}
      height={height}
      graphData={graphData}
      nodeLabel={() => ""}
      nodeCanvasObject={paintNode}
      nodeCanvasObjectMode={() => "replace"}
      nodePointerAreaPaint={paintPointerArea}
      linkCanvasObject={paintLink}
      linkCanvasObjectMode={() => "replace"}
      onNodeClick={(node) => onNodeClick((node as GraphNode).id)}
      onBackgroundClick={onBackgroundClick}
      onNodeHover={(node) => {
        hoveredRef.current = node ? (node as GraphNode) : null;
        refresh();
      }}
      onRenderFramePost={paintHoverLabel}
      onEngineStop={() => {
        if (fittedKey.current === fitKey) return;
        fittedKey.current = fitKey;
        fit(reducedMotion ? 0 : 600);
      }}
      warmupTicks={reducedMotion ? 300 : 80}
      cooldownTicks={reducedMotion ? 0 : Infinity}
      cooldownTime={6000}
      d3VelocityDecay={0.35}
      minZoom={0.15}
      maxZoom={12}
    />
  );
}
