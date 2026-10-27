// Draws the profile images for the landscape's LinkedIn page and X account from the site mark
// (`markBars` in lib/og.ts), into .social/. Run `pnpm social` when the mark or the line changes,
// then upload the files by hand.
//
// Both networks show the square image as a circle, so the mark is padded until every bar corner
// sits inside the inscribed circle. The banners keep their text in the middle: LinkedIn and X lay
// the profile image over the bottom left, X crops about 60 px off the top and bottom, and phones
// crop the sides.
import { mkdirSync, writeFileSync } from "node:fs";
import { ImageResponse } from "next/og";
import { createElement as h } from "react";
import { markBars, OG_COLORS, STAGE_HEX } from "@/lib/og";

export const SOCIAL_DIR = ".social";
export const LINE = "A neutral public map of AI in the software lifecycle";
export const HOST = "aisdlclandscape.org";

export interface SocialAsset {
  file: string;
  width: number;
  height: number;
  kind: "mark" | "banner";
}

/** LinkedIn displays the cover at 1128 x 191, so it is drawn at twice that for sharp screens. */
export const SOCIAL_ASSETS: SocialAsset[] = [
  { file: "linkedin-logo.png", width: 400, height: 400, kind: "mark" },
  { file: "linkedin-cover.png", width: 2256, height: 382, kind: "banner" },
  { file: "x-avatar.png", width: 400, height: 400, kind: "mark" },
  { file: "x-header.png", width: 1500, height: 500, kind: "banner" },
];

/** Padding that keeps every bar corner inside the circle a network cuts from the square. */
export const markPadding = (size: number): number => size / 7;

async function render(node: React.ReactElement, width: number, height: number): Promise<Buffer> {
  const image = new ImageResponse(node, { width, height });
  return Buffer.from(await image.arrayBuffer());
}

function mark(size: number) {
  const bars = markBars(size, markPadding(size)).map((b) =>
    h("div", {
      key: b.color,
      style: {
        position: "absolute",
        left: b.x,
        top: b.y,
        width: b.width,
        height: b.height,
        background: b.color,
        borderRadius: b.width / 3,
      },
    }),
  );
  return h(
    "div",
    { style: { display: "flex", position: "relative", width: "100%", height: "100%", background: OG_COLORS.background } },
    bars,
  );
}

/** Name, line and a rule in the six stage colours, centred, sized from the banner's height. */
function banner(width: number, height: number) {
  const scale = height / 500;
  const segment = Math.round(56 * scale);
  const rule = [1, 2, 3, 4, 5, 6].map((id) =>
    h("div", { key: id, style: { width: segment, height: Math.max(4, Math.round(10 * scale)), background: STAGE_HEX[id] } }),
  );
  const text = (content: string, size: number, color: string, weight = 400, marginTop = 0) =>
    h("div", { style: { display: "flex", fontSize: Math.round(size * scale), color, fontWeight: weight, marginTop } }, content);
  // Wide, short banners (LinkedIn) get proportionally larger text than the 3:1 X header.
  const wide = width / height > 4;
  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: OG_COLORS.background,
      },
    },
    text("AI SDLC Landscape", wide ? 130 : 96, OG_COLORS.ink, 700),
    text(LINE, wide ? 58 : 40, OG_COLORS.muted, 400, Math.round(12 * scale)),
    h("div", { style: { display: "flex", gap: Math.round(6 * scale), marginTop: Math.round(32 * scale) } }, rule),
    text(HOST, wide ? 40 : 28, OG_COLORS.muted, 400, Math.round(20 * scale)),
  );
}

async function main() {
  mkdirSync(SOCIAL_DIR, { recursive: true });
  for (const a of SOCIAL_ASSETS) {
    const node = a.kind === "mark" ? mark(a.width) : banner(a.width, a.height);
    writeFileSync(`${SOCIAL_DIR}/${a.file}`, await render(node, a.width, a.height));
    console.log(`social: wrote ${SOCIAL_DIR}/${a.file} (${a.width} x ${a.height})`);
  }
}

if (process.argv[1]?.endsWith("social.ts")) main();
