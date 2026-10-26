/** A map tile name breaks only between words, so a long word gets a smaller size instead of a cut. */
export const LONG_WORD = 11;

/** The font size class for a tool name on a map logo tile, from its longest word. */
export function tileNameClass(name: string): string {
  const longest = Math.max(0, ...name.split(/\s+/).map((w) => w.length));
  return longest >= LONG_WORD ? "text-[10px] tracking-tight" : "text-[11px]";
}
