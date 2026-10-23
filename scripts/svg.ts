// The site draws every logo on a white tile in both themes, so an SVG that switches to a light
// fill under `prefers-color-scheme: dark` vanishes in dark mode. This drops those rules.

/** Remove each `@media` block whose condition names `prefers-color-scheme: dark`. */
export function lightOnly(svg: string): string {
  let out = "";
  let i = 0;
  for (const m of svg.matchAll(/@media[^{]*prefers-color-scheme\s*:\s*dark[^{]*\{/g)) {
    if (m.index < i) continue;
    // Walk to the brace that closes this block; nested rules open and close their own.
    let depth = 1;
    let j = m.index + m[0].length;
    while (j < svg.length && depth > 0) {
      if (svg[j] === "{") depth++;
      else if (svg[j] === "}") depth--;
      j++;
    }
    out += svg.slice(i, m.index);
    i = j;
  }
  return out + svg.slice(i);
}
