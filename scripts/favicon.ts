// Draws app/favicon.ico from the site mark (`markBars` in lib/og.ts), for clients that ask for
// /favicon.ico instead of reading the icon link. Run `pnpm favicon` when the mark changes.
//
// An ICO file may hold PNG images, so each size is rendered with next/og and packed as is.
import { writeFileSync } from "node:fs";
import { ImageResponse } from "next/og";
import { createElement as h } from "react";
import { markBars } from "@/lib/og";

const SIZES = [16, 32, 48];

async function png(size: number): Promise<Buffer> {
  const bars = markBars(size, size / 32).map((b) =>
    h("div", {
      key: b.color,
      style: { position: "absolute", left: b.x, top: b.y, width: b.width, height: b.height, background: b.color },
    }),
  );
  const image = new ImageResponse(h("div", { style: { display: "flex", position: "relative", width: "100%", height: "100%" } }, bars), {
    width: size,
    height: size,
  });
  return Buffer.from(await image.arrayBuffer());
}

/** Packs PNG images into an ICO file: a 6-byte header, a 16-byte entry per image, then the images. */
export function ico(images: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

async function main() {
  const images = await Promise.all(SIZES.map(async (size) => ({ size, data: await png(size) })));
  writeFileSync("app/favicon.ico", ico(images));
  console.log(`favicon: wrote app/favicon.ico (${SIZES.join(", ")} px)`);
}

if (process.argv[1]?.endsWith("favicon.ts")) main();
