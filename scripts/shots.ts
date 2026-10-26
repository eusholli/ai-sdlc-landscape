// Look at the site the way a visitor does: every main route at phone and desktop width, in light
// and dark. Run it against `pnpm dev` (or `pnpm start`) before pushing anything visible.
//
//   pnpm shots                               every route, at http://localhost:3000
//   pnpm shots --base http://localhost:3123  another server
//   pnpm shots --routes /changes,/about      only these routes
//   pnpm shots --widths 390,1024,1440        other widths
//
// Writes one PNG per route, width and theme to .shots/ (gitignored) and fails when a page scrolls
// sideways, logs a console error or does not answer 200. It needs a browser, so it is not part of
// `pnpm check`; CI has none. First run on a new machine: `pnpm exec playwright install chromium`.
import { mkdirSync, rmSync } from "node:fs";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const BASE = (opt("--base") ?? "http://localhost:3000").replace(/\/$/, "");
const WIDTHS = (opt("--widths") ?? "390,1280").split(",").map(Number);
const THEMES = ["light", "dark"] as const;
const OUT = ".shots";

export const ROUTES = [
  "/",
  "/?view=network",
  "/?view=list",
  "/?view=moves",
  "/analyze?compare=cursor,claude-code,snyk",
  "/analyze?tab=compare&compare=cursor,claude-code,snyk",
  "/analyze?tab=stack&compare=cursor,claude-code,snyk",
  "/analyze?compare=cursor,claude-code,snyk,tessl,traycer,chatprd&via=tessl,traycer,chatprd",
  "/analyze?tab=stack&compare=cursor,claude-code,snyk,tessl,traycer,chatprd&via=tessl,traycer,chatprd",
  "/analyze?compare=builder-io",
  "/analyze?tab=stack&compare=builder-io",
  "/changes",
  "/tools/cursor",
  "/tools/github",
  "/phases/review",
  "/about",
  "/contribute",
  "/ownership",
];

const slug = (route: string) => route.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/-$/, "") || "home";

async function main() {
  const routes = opt("--routes")?.split(",") ?? ROUTES;
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const problems: string[] = [];
  try {
    for (const theme of THEMES) {
      for (const width of WIDTHS) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme });
        for (const route of routes) {
          const page = await context.newPage();
          const errors: string[] = [];
          page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
          page.on("pageerror", (e) => errors.push(e.message));
          const where = `${route} at ${width}px, ${theme}`;
          const res = await page.goto(BASE + route, { waitUntil: "networkidle" }).catch((e: Error) => {
            problems.push(`${where}: ${e.message}`);
            return null;
          });
          if (res && res.status() !== 200) problems.push(`${where}: status ${res.status()}`);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
          if (overflow > 0) problems.push(`${where}: scrolls sideways by ${overflow}px`);
          for (const e of errors.slice(0, 3)) problems.push(`${where}: console error: ${e.slice(0, 200)}`);
          await page.screenshot({ path: `${OUT}/${width}-${theme}-${slug(route)}.png`, fullPage: false });
          await page.close();
        }
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  const total = routes.length * WIDTHS.length * THEMES.length;
  if (problems.length) {
    console.error(problems.join("\n"));
    console.error(`shots: ${problems.length} problems in ${total} views. Screenshots in ${OUT}/.`);
    process.exit(1);
  }
  console.log(`shots: ${total} views, no problems. Screenshots in ${OUT}/.`);
}

if (process.argv[1]?.endsWith("shots.ts")) void main();
