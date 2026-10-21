import type { KeyboardEvent } from "react";

const DIRECTIONS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

const CROSS_AXIS_WEIGHT = 2;

/**
 * Arrow keys move focus to the nearest tile in that direction. Runs before the viewport's own
 * key handler, which pans, so it stops propagation when focus is on a tile.
 */
export function handleTileArrowKeys(event: KeyboardEvent<HTMLElement>) {
  const target = event.target as HTMLElement;
  const direction = DIRECTIONS[event.key];
  if (!direction || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
  if (!(target instanceof HTMLButtonElement) || !target.dataset.tool) return;

  event.preventDefault();
  event.stopPropagation();

  const from = target.getBoundingClientRect();
  const originX = from.left + from.width / 2;
  const originY = from.top + from.height / 2;

  let best: HTMLButtonElement | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const tile of event.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-tool]")) {
    if (tile === target) continue;
    const rect = tile.getBoundingClientRect();
    const dx = rect.left + rect.width / 2 - originX;
    const dy = rect.top + rect.height / 2 - originY;
    const along = dx * direction[0] + dy * direction[1];
    if (along <= 1) continue;
    const across = Math.abs(dx * direction[1]) + Math.abs(dy * direction[0]);
    const score = along + across * CROSS_AXIS_WEIGHT;
    if (score < bestScore) {
      best = tile;
      bestScore = score;
    }
  }
  best?.focus();
}
