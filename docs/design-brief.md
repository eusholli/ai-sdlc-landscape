# Design brief

The AI SDLC Landscape is a neutral, public map of the AI tools that work across the software
development lifecycle: the tools in 13 phases, two cross-cutting layers and the typed relations between them. Every
fact on a tool links to the page it came from. Nobody is selling anything on this site.

## Who it is for

Engineering leaders choosing tools, investors and analysts mapping the market, and the vendors
themselves checking how they are shown. They arrive from a shared link, poke around for two
minutes, and leave with one answer: who does this phase, who competes with whom, who got bought.

## Tone

Calm, exact, generous with detail on demand. A good atlas, not a trade-show booth. The data is the
hero; chrome stays quiet. No marketing adjectives in UI copy. Unknown facts say "Not published",
plainly, because a gap is information too.

Copy rules for every label, tooltip, empty state and heading:

- No em dashes. Use a comma, a colon or two sentences.
- No "unlock", "elevate", "supercharge", "seamless", "delve", "cutting-edge", "game-changing",
  "revolutionize", "harness the power".
- Short words. Sentence case. Name the actor ("Vendors list 3 customers", not "3 customers listed").
- Tool claims are quoted from the vendor and shown as quotes, never rewritten.

## Data contract (read this before writing any component)

- Import types from `@/lib/types`, helpers from `@/lib/format` and `@/lib/filters`.
- Server components read data from `@/lib/data` (it is `server-only`). Client components receive
  `ToolLite[]` and `RelationLite[]` as props, and the tool drawer fetches
  `/data/tools/<id>.json`, which returns `{ tool: Tool, relations: [...] }`.
- **Never import `data/landscape.json` or `@/lib/data` from a `"use client"` file.**
- **Never edit `data/`, `lib/data.ts`, `lib/types.ts`, `lib/filters.ts`, `lib/format.ts` or
  `components/logo.tsx`.** They are locked. If a component needs a new selector, say so in the
  reply and we will add it.
- `null` means the vendor has not published that fact. Render it with `notPublished()` or
  `joinOrNotPublished()`; never an empty cell, never a dash.
- Logos: always `<Logo name src phase size />` from `@/components/logo`. It handles SVG, ICO and
  PNG and draws a monogram when there is no file.
- URL state: `useQueryStates(filterParsers)` from `nuqs` with `filterParsers` from
  `@/lib/filters`. Every view, filter, open drawer and compare set lives in the URL so any screen
  can be shared.

## Colour

Thirteen phases are too many hues to tell apart, so colour encodes **six lifecycle stages** and
position plus label name the phase. Use `phaseColor(phaseId)` and `layerColor(layer)` from
`@/lib/format`, or the Tailwind tokens `bg-stage-1` .. `bg-stage-6`, `bg-layer-infra`,
`bg-layer-model`. Never introduce another hue for data.

| Stage | Phases | Light | Dark |
|---|---|---|---|
| 1 Plan and design | plan, design | `#2a78d6` | `#3987e5` |
| 2 Build | code, review | `#eb6834` | `#d95926` |
| 3 Verify | test, security | `#1baf7a` | `#199e70` |
| 4 Ship | cicd, deploy | `#eda100` | `#c98500` |
| 5 Run | operate, maintain | `#e87ba4` | `#d55181` |
| 6 Understand and govern | understand, measure, platform | `#008300` | `#008300` |
| Agent infrastructure layer | | `#6250d6` | `#9085e9` |
| Model providers layer | | `#6b6a65` | `#a3a29b` |

This order passes colour-vision-deficiency separation for adjacent stages in both modes (worst
CVD Delta E 9.1, normal-vision 19.6). Three light-mode stage colours sit under 3:1 contrast on the
surface, so stage colour never carries meaning alone: phase columns always show their label, the
network view has a legend that filters on click, and text always uses foreground tokens, never a
stage colour. Status (acquired, shut down) uses an icon plus a label, not a colour.

Use stage colour for: column header rules, the phase coverage strip, spanning bars, network
nodes, heatmap cells (as a single-hue ramp, not mixed hues). Use neutral tokens for everything
else. Dark mode is a first-class design, not an inversion: test both.

## Typography

Inter for UI, Geist Mono for numbers in tables and the data date. Tabular figures in tables and
counts. Tool names semibold, claims regular in muted foreground. Large numbers (phase totals at
the far zoom level) are the one place for display size.

## Layout and the map

- 13 phase columns left to right in lifecycle order (`PHASE_ORDER`), grouped under six stage
  headers.
- Under the columns, two full-width bands: agent infrastructure and model providers.
- Above the columns, the full-lifecycle platforms draw as horizontal bars spanning every phase
  they cover (gaps where they skip a phase).
- A tool tile sits under its `primaryPhase` once. Its other phases show in the drawer's coverage
  strip and as faint ticks on hover, not as duplicate tiles.

**The title.** The home page opens with the site's one `<h1>`, "AI SDLC Landscape", and one or two
sentences under it that say what the map is and link to the GitHub repo and to requesting a
change. The intro can be collapsed so the map keeps the screen; the choice is remembered per
browser. The slim header stays as it is. Every other page has its own `<h1>`.

**Requests for change.** Anyone, person or agent, asks for a change by opening a GitHub issue in
plain words. Links to it use `REQUEST_URL` or `requestUrl(name)` from `lib/site.ts`, and the advice
on what to include is `REQUEST_ADVICE` in `lib/request-advice.ts`; never retype either.

**Three semantic zoom levels**, crossfading and re-laying out with `motion` layout animations:

1. **Overview** (zoom < 0.6): each column is a heat block with its tool count in large type and
   stage colour intensity by count. The lifecycle reads at a glance.
2. **Logos** (0.6 to 1.4): a grid of logo tiles per column, name on hover.
3. **Cards** (> 1.4): cards with logo, name, company and the one-line claim, plus badges for open
   source and acquired.

Hovering a tile dims everything else and draws its relations as curves to the related tiles,
coloured by relation type with a small legend. Click opens the drawer.

## Motion

Motion does real work here: it shows the lifecycle flowing and keeps people oriented as the map
re-lays out. Use `motion` (`motion/react`).

- On load, phase columns enter left to right along the lifecycle, staggered 40 ms.
- Zoom level changes use shared layout animation so tiles grow out of the phase totals.
- Relation curves draw in with `pathLength` from 0 to 1 over 250 ms.
- Logo in a tile and logo in the drawer header share a `layoutId`, so it flies across.
- The market-moves timeline scrubs with scroll.
- Springs, not linear easing. Nothing loops, nothing moves while idle.

**Reduced motion:** when `useReducedMotion()` is true, replace movement with a 150 ms opacity
crossfade and draw relation lines at full length immediately. This is an accessibility
requirement (WCAG 2.3.3), not a style choice.

## Quality bar

- Light and dark themes via `next-themes` (already wired in `app/providers.tsx`), toggle in the
  header.
- Every interactive element reachable by keyboard, with a visible focus ring. Arrow keys move
  between tiles on the map; Enter opens; Escape closes.
- Under 768 px the canvas becomes a searchable list grouped by phase.
- Lighthouse 90+ on mobile. Keep client components small; the map receives lite data only.
- Logos belong to their owners. Say so in the footer.

## What the data looks like

In v0, `data/landscape.json` is a trimmed copy of the real 435 KB file (the full one ships in the
repo). It keeps the same shape and carries the edge cases on purpose: an acquired tool, the
full-lifecycle platforms, agent-infrastructure and model-layer nodes, a mostly unknown node and a
node with no logo. Design for all of them, not only the clean case.
