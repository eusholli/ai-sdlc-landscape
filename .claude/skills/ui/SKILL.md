---
name: ui
description: Change the visible UI of the AI SDLC Landscape by hand, from design to verified build. Use for any change to a page, a component, the header, the map or the copy on screen.
---

# Change the UI

The UI is written by hand in this repo. Each change goes through the same loop, and nothing is
pushed until every step has passed.

## Before you start

1. Read `docs/design-brief.md`: tone, colour, layout, motion and the data contract.
2. Find what the page needs. Data comes from a selector in `lib/data.ts` (server only) or a pure
   function in `lib/` that the component calls with props. If none fits, write one in `lib/` with
   a fixture test in `tests/` first. Components do not compute over the dataset.
3. Client components get `ToolLite[]` and `RelationLite[]` as props, or fetch
   `/data/tools/<id>.json` with `useToolDetails`. They never import `@/lib/data` or the JSON.
4. A new page goes into `components/site-nav.ts` under its job, into `app/sitemap.ts`, and into
   `lib/llms.ts` if an agent would want it.

## The loop

```bash
pnpm exec playwright install chromium   # once per machine, before the first pnpm shots
pnpm dev                 # terminal 1: make the change, look at it in light and dark
pnpm shots               # terminal 2: screenshots in .shots/, phone and desktop, both themes
pnpm shots --routes /changes,/about --widths 390,1024,1440   # narrow it while iterating
pnpm check               # data, types, lint, guard, tests
pnpm build               # the production build; catches a missing Suspense boundary
```

`--routes` splits on commas, so a route whose query holds a comma (`?compare=a,b`) belongs in `ROUTES` in
`scripts/shots.ts`, not on the command line.

Open the PNGs in `.shots/` and look at each one. `pnpm shots` fails on sideways scroll, a console
error or a non-200 response, but it cannot judge spacing, contrast or copy: you do that.

## Rules that are easy to miss

- `null` is rendered with `notPublished()`, never an empty cell or a dash.
- A component that reads URL state through `nuqs` needs a `<Suspense>` boundary on a static page.
- Touch targets are at least 44 px under 640 px (`max-sm:h-11`).
- No counts in copy: derive them from the data.
- Copy follows the writing rules in `AGENTS.md`: no em dashes joining clauses, no marketing words,
  sentence case.
- Nothing on the site rates a tool. Links between tools are sourced records, never "best fit".

## Done

Report what you ran and what it showed: `pnpm check`, `pnpm build`, the routes and widths in
`pnpm shots`, and anything you looked at by eye. A skipped step is reported as skipped. Do not
push to `main` unless the maintainer asks: pushing deploys.
