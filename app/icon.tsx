import { markSvg } from "@/lib/og";

// The browser tab icon: the site mark as SVG. app/favicon.ico is the same mark for clients that
// only ask for /favicon.ico; `pnpm favicon` redraws it when the mark changes.
export const size = { width: 32, height: 32 };
export const contentType = "image/svg+xml";

export default function Icon() {
  return new Response(markSvg(size.width), { headers: { "Content-Type": contentType } });
}
