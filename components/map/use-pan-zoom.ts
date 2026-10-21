"use client";

import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { FocusEvent, KeyboardEvent, MouseEvent, PointerEvent, UIEvent } from "react";
import { zoomLevelFor, type ZoomLevel } from "./zoom-level";

const MIN_SCALE = 0.2;
const MAX_SCALE = 3;
const FIT_MARGIN = 16;
const DRAG_THRESHOLD = 4;
const KEY_PAN = 80;
const BUTTON_STEP = 1.4;
const DOUBLE_CLICK_STEP = 1.8;
const SPRING = { type: "spring", stiffness: 260, damping: 32 } as const;

const clampScale = (k: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, k));

interface Point {
  x: number;
  y: number;
}

/**
 * Pan and zoom for a DOM canvas. The transform lives in motion values so a wheel event moves the
 * world without re-rendering its tiles; only the coarse `zoomLevel` is React state.
 */
export function usePanZoom() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const reduceMotion = useReducedMotion();

  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(() => zoomLevelFor(1));
  const [dragging, setDragging] = useState(false);

  const userMoved = useRef(false);
  const animations = useRef<{ stop: () => void }[]>([]);
  const pointers = useRef(new Map<number, Point>());
  const drag = useRef<{ startX: number; startY: number; active: boolean } | null>(null);
  const pinch = useRef<{ dist: number; cx: number; cy: number } | null>(null);

  useMotionValueEvent(scale, "change", (k) => setZoomLevel(zoomLevelFor(k)));

  const stopAnimations = useCallback(() => {
    animations.current.forEach((a) => a.stop());
    animations.current = [];
  }, []);

  const moveTo = useCallback(
    (nx: number, ny: number, nk: number, smooth: boolean) => {
      stopAnimations();
      if (smooth && !reduceMotion) {
        animations.current = [animate(x, nx, SPRING), animate(y, ny, SPRING), animate(scale, nk, SPRING)];
      } else {
        x.set(nx);
        y.set(ny);
        scale.set(nk);
      }
    },
    [reduceMotion, scale, stopAnimations, x, y],
  );

  /** Zoom by `factor`, keeping the world point under (px, py) fixed on screen. Coordinates are viewport-relative. */
  const zoomAt = useCallback(
    (px: number, py: number, factor: number, smooth = false) => {
      stopAnimations();
      userMoved.current = true;
      const k = scale.get();
      const nk = clampScale(k * factor);
      if (nk === k) return;
      const ratio = nk / k;
      moveTo(px - (px - x.get()) * ratio, py - (py - y.get()) * ratio, nk, smooth);
    },
    [moveTo, scale, stopAnimations, x, y],
  );

  const zoomFromCentre = useCallback(
    (factor: number) => {
      const vp = viewportRef.current;
      if (vp) zoomAt(vp.clientWidth / 2, vp.clientHeight / 2, factor, true);
    },
    [zoomAt],
  );

  const fit = useCallback(
    (smooth = false) => {
      const vp = viewportRef.current;
      const world = worldRef.current;
      if (!vp || !world || !vp.clientWidth || !world.offsetWidth) return;
      userMoved.current = false;
      const vw = vp.clientWidth;
      const vh = vp.clientHeight;
      const k = clampScale(
        Math.min((vw - FIT_MARGIN * 2) / world.offsetWidth, (vh - FIT_MARGIN * 2) / world.offsetHeight, 1),
      );
      const nx = (vw - world.offsetWidth * k) / 2;
      const ny = Math.max(FIT_MARGIN, (vh - world.offsetHeight * k) / 2);
      moveTo(nx, ny, k, smooth);
    },
    [moveTo],
  );

  const zoomIn = useCallback(() => zoomFromCentre(BUTTON_STEP), [zoomFromCentre]);
  const zoomOut = useCallback(() => zoomFromCentre(1 / BUTTON_STEP), [zoomFromCentre]);
  const fitSmooth = useCallback(() => fit(true), [fit]);

  useLayoutEffect(() => {
    fit(false);
  }, [fit]);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const observer = new ResizeObserver(() => {
      if (!userMoved.current) fit(false);
    });
    observer.observe(vp);
    return () => observer.disconnect();
  }, [fit]);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = vp.getBoundingClientRect();
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, Math.exp(-delta * (e.ctrlKey ? 0.01 : 0.0015)));
    };
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    stopAnimations();
    if (pointers.current.size === 1) {
      drag.current = { startX: e.clientX, startY: e.clientY, active: false };
    } else if (pointers.current.size === 2) {
      drag.current = null;
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
      pointers.current.forEach((_, id) => e.currentTarget.setPointerCapture(id));
      setDragging(true);
    }
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const rect = e.currentTarget.getBoundingClientRect();

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      const last = pinch.current;
      if (last && last.dist > 0 && dist > 0) {
        userMoved.current = true;
        x.set(x.get() + cx - last.cx);
        y.set(y.get() + cy - last.cy);
        zoomAt(cx - rect.left, cy - rect.top, dist / last.dist);
      }
      pinch.current = { dist, cx, cy };
      return;
    }

    const d = drag.current;
    if (!d) return;
    if (!d.active) {
      if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < DRAG_THRESHOLD) return;
      d.active = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(true);
    }
    userMoved.current = true;
    x.set(x.get() + e.clientX - prev.x);
    y.set(y.get() + e.clientY - prev.y);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.delete(e.pointerId)) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    pinch.current = null;
    if (pointers.current.size === 0) {
      drag.current = null;
      setDragging(false);
    } else if (pointers.current.size === 1) {
      const [rest] = [...pointers.current.values()];
      drag.current = { startX: rest.x, startY: rest.y, active: true };
    }
  };

  const onDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    zoomAt(e.clientX - rect.left, e.clientY - rect.top, DOUBLE_CLICK_STEP, true);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const pan = (dx: number, dy: number) => {
      userMoved.current = true;
      moveTo(x.get() + dx, y.get() + dy, scale.get(), true);
    };
    switch (e.key) {
      case "+":
      case "=":
        zoomFromCentre(BUTTON_STEP);
        break;
      case "-":
      case "_":
        zoomFromCentre(1 / BUTTON_STEP);
        break;
      case "0":
        fit(true);
        break;
      case "ArrowLeft":
        pan(KEY_PAN, 0);
        break;
      case "ArrowRight":
        pan(-KEY_PAN, 0);
        break;
      case "ArrowUp":
        pan(0, KEY_PAN);
        break;
      case "ArrowDown":
        pan(0, -KEY_PAN);
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  /** Keep a keyboard-focused tile on screen by moving the world, not the browser scroll position. */
  const onFocusCapture = (e: FocusEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target === e.currentTarget) return;
    const v = e.currentTarget.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    if (t.left >= v.left && t.right <= v.right && t.top >= v.top && t.bottom <= v.bottom) return;
    userMoved.current = true;
    moveTo(
      x.get() + (v.left + v.width / 2) - (t.left + t.width / 2),
      y.get() + (v.top + v.height / 2) - (t.top + t.height / 2),
      scale.get(),
      true,
    );
  };

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    e.currentTarget.scrollTo(0, 0);
  };

  return {
    viewportRef,
    worldRef,
    x,
    y,
    scale,
    zoomLevel,
    dragging,
    zoomIn,
    zoomOut,
    fit: fitSmooth,
    viewportProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onDoubleClick,
      onKeyDown,
      onFocusCapture,
      onScroll,
    },
  };
}
