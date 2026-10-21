"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCallback, useLayoutEffect, useState, type RefObject } from "react";
import type { RelationEdge } from "./relation-index";
import { RELATION_STYLE } from "./relation-style";
import type { ZoomLevel } from "./zoom-level";

interface Point {
  x: number;
  y: number;
}

interface Curve {
  key: string;
  d: string;
  color: string;
  end: Point;
}

interface Geometry {
  width: number;
  height: number;
  curves: Curve[];
}

function curvePath(a: Point, b: Point, nth: number): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  const bend = Math.min(180, length * 0.25) * (1 + nth * 0.6) * (nth % 2 ? -1 : 1);
  const cx = (a.x + b.x) / 2 - (dy / length) * bend;
  const cy = (a.y + b.y) / 2 + (dx / length) * bend;
  return `M${a.x} ${a.y}Q${cx} ${cy} ${b.x} ${b.y}`;
}

interface RelationCurvesProps {
  activeId: string;
  edges: RelationEdge[];
  worldRef: RefObject<HTMLDivElement | null>;
  zoomLevel: ZoomLevel;
}

/**
 * Draws the active tile's relations over the world. Positions are read from the DOM in world
 * coordinates (screen position divided by the current scale), so panning and zooming never
 * invalidate them. A second measurement runs after a zoom level change, once layout settles.
 */
export function RelationCurves({ activeId, edges, worldRef, zoomLevel }: RelationCurvesProps) {
  const reduceMotion = useReducedMotion();
  const [geometry, setGeometry] = useState<Geometry | null>(null);

  const measure = useCallback((): Geometry | null => {
    const world = worldRef.current;
    if (!world) return null;
    const box = world.getBoundingClientRect();
    const k = world.offsetWidth ? box.width / world.offsetWidth : 1;

    const anchors = (id: string): Point[] =>
      Array.from(world.querySelectorAll<HTMLElement>(`[data-tool="${CSS.escape(id)}"]`)).map((el) => {
        const r = el.getBoundingClientRect();
        return { x: (r.left + r.width / 2 - box.left) / k, y: (r.top + r.height / 2 - box.top) / k };
      });

    const from = anchors(activeId);
    if (!from.length) return null;

    const perOther = new Map<string, number>();
    const curves: Curve[] = [];
    for (const edge of edges) {
      if (!edge.onMap) continue;
      const to = anchors(edge.other);
      if (!to.length) continue;

      let best: [Point, Point] = [from[0], to[0]];
      let bestDistance = Infinity;
      for (const a of from) {
        for (const b of to) {
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance < bestDistance) {
            bestDistance = distance;
            best = [a, b];
          }
        }
      }

      const nth = perOther.get(edge.other) ?? 0;
      perOther.set(edge.other, nth + 1);
      curves.push({
        key: `${edge.type}|${edge.direction}|${edge.other}`,
        d: curvePath(best[0], best[1], nth),
        color: RELATION_STYLE[edge.type].color,
        end: best[1],
      });
    }
    return { width: world.offsetWidth, height: world.offsetHeight, curves };
  }, [activeId, edges, worldRef]);

  useLayoutEffect(() => {
    setGeometry(measure());
    const settle = window.setTimeout(() => setGeometry(measure()), 450);
    return () => window.clearTimeout(settle);
  }, [measure, zoomLevel]);

  if (!geometry || geometry.curves.length === 0) return null;

  return (
    <svg
      aria-hidden
      width={geometry.width}
      height={geometry.height}
      className="pointer-events-none absolute top-0 left-0 overflow-visible"
    >
      {geometry.curves.map((curve) => (
        <g key={curve.key}>
          <motion.path
            d={curve.d}
            fill="none"
            stroke={curve.color}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            initial={reduceMotion ? { opacity: 0 } : { pathLength: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { pathLength: 1 }}
            transition={reduceMotion ? { duration: 0.15 } : { duration: 0.25, ease: "easeOut" }}
          />
          <motion.circle
            cx={curve.end.x}
            cy={curve.end.y}
            r={4}
            fill={curve.color}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1, delay: reduceMotion ? 0.05 : 0.2 }}
          />
        </g>
      ))}
    </svg>
  );
}
