// Draws a post's share image: public/blog/<slug>/cover.svg rendered to cover.png beside it, at
// 1200 x 630. The page shows the SVG; share crawlers do not take SVG, so Open Graph names the PNG.
// Run it whenever the SVG changes, and commit both files.
//
//   pnpm cover software-ownership-maths
//
// It needs a browser, as `pnpm shots` does. First run on a new machine:
// `pnpm exec playwright install chromium`.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const WIDTH = 1200;
const HEIGHT = 630;

const slug = process.argv[2];
if (!slug) {
  console.error("usage: pnpm cover <slug>");
  process.exit(1);
}
const dir = join(process.cwd(), "public/blog", slug);
const svgPath = join(dir, "cover.svg");
if (!existsSync(svgPath)) {
  console.error(`no cover at ${svgPath}`);
  process.exit(1);
}

async function main() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
    const svg = readFileSync(svgPath, "utf8");
    await page.setContent(`<!doctype html><style>html,body{margin:0}svg{display:block}</style>${svg}`);
    writeFileSync(join(dir, "cover.png"), await page.screenshot({ clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } }));
    console.log(`wrote public/blog/${slug}/cover.png`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
