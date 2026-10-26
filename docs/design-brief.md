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
  `/data/tools/<id>.json`, which returns `{ tool: Tool, relations: [...], changes: Change[] }`.
- **Never import `data/landscape.json` or `@/lib/data` from a `"use client"` file.**
- A component that needs new data gets a selector in `lib/data.ts` or a pure function in `lib/`,
  with a fixture test. Components do not compute over the dataset themselves.
- `null` means the vendor has not published that fact. Render it with `notPublished()` or
  `joinOrNotPublished()`; never an empty cell, never a dash.
- Logos: always `<Logo name src phase size />` from `@/components/logo`. It handles SVG, ICO and
  PNG and draws a monogram when there is no file.
- URL state: `useQueryStates(filterParsers)` from `nuqs` with `filterParsers` from
  `@/lib/filters`. Every view, filter and open drawer lives in the URL so any screen can be shared.
  The chosen tools are the exception: they are saved in the browser (`lib/choices.ts`, read with
  `useCompare`), so only an explicit add, remove or clear changes them, whatever link is followed.

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

**The title.** The header already names the site, so the home page's one `<h1>`, "AI SDLC
Landscape: AI tools across the software development lifecycle", is for screen readers only. The stats strip comes first and opens with one phrase
that says what the site is, then the counts, the dates and a link to About, which holds the longer
statement, the GitHub link and how to request a change. Then the filter bar, which hides on the
market moves view, which it does not act on. Under the filters, just above the view, a row carries
the Map, Network, List and Market moves switcher. On phones the map and list views show the list,
whose own search and Filters row carries the switcher beside the count, so the separate row shows
there only for network and market moves. Every other page has its own `<h1>`.

**Analyze choices.** `/analyze` shows one selection of chosen tools, fed from the map tiles, the
drawer and the search, and saved in the browser across pages, tabs and visits. On `/analyze` the
selection is also written to the `compare` URL key, so the address is the share link. A link that
carries `compare` is taken as is when nothing is saved; when it would change a saved selection, a
bar under the header asks: add to mine, replace mine or keep mine (`ChoicesUrlSync`). Tools added from a linked suggestion are also
listed in `via`: they do not count as the stack, so the phase they fill stays open and several can
be ticked and weighed. The top of the page lists the choices, each removable, with Clear all, and
then one card per phase of the lifecycle, in order, so the layout stays put as tools are added. A
card is in one of four states, named in its corner: covered (solid, listing the choices that cover
it), filled via a link (solid, the added tools ticked above the other suggestions), not covered
(dashed, the tools linked to a choice that cover it, each added with +) or nothing linked (dashed
and muted). A suggestion shows a green tick once added; a tick takes it out again. Any card with
two or more choices in its phase, whatever its state, shows a "Compare tools" link. It opens Compare
tools on just those choices (`focus=<phase>`) and scrolls to the table, where "Show all choices"
widens it again. Two tabs in the same switcher style follow: Choose tools (the panel alone) and
Compare tools (the choices side by side). An old `tab=stack` link opens Compare tools. A suggestion is a sourced link, never a judgement of fit. Green
(`text-success`) is a status mark for an added tool, never a data colour.

**Phase pages.** `/phases/<id>` gives each phase a page of its own that search engines and
agents can find: an `<h1>` from `phaseTitle()`, the phase description, a count line from
`phaseCountLine()`, then the tools whose main phase it is and the tools that also cover it, each
with logo, company and quoted claim, linking to its tool page. A thin top border in the phase's
stage colour is the only colour. `lib/phase-page.ts` builds the data; layer records are left out,
as on the map's columns. Tool pages link each phase in Phase coverage here, and the footer lists
every phase.

**Tool links.** `ToolLink` points at `/tools/<id>` everywhere, so crawlers can follow it. On `/` a
plain click opens the drawer instead; elsewhere it navigates. Its links set `prefetch={false}`.

**The header.** The site name, then Landscape, Analyze choices, Update tool data (`/contribute`) and
Latest updates as direct links
and an About menu, then Search and the theme. Below 1024 px the links fold into one Menu sheet. The menus, the sheet and the
footer all read `components/site-nav.ts`.

**Requests for change.** Anyone, person or agent, asks for a change by opening a GitHub issue in
plain words. Links to it use `REQUEST_URL` or `requestUrl(name)` from `lib/site.ts`, and the advice
on what to include is `REQUEST_ADVICE` in `lib/request-advice.ts`; never retype either.

**Changes, freshness and the badge.** The site shows that it changes. All of it comes from
`@/lib/data` and is computed, never typed in:

- `timeline(limit?)` returns `TimelineEntry[]`, newest first: either the changes one commit made
  (`kind: "changes"`, with `text`, `author`, `requestedBy`, `commit` and `changes: Change[]`) or a
  dated market move (`kind: "move"`, with `text` and `move`). Every entry has a plain `text`
  sentence; show it as given. A move's date may be `YYYY-MM` only. `launch()` is the first import.
  Link a commit to `${REPO_URL}/commit/<sha>` and an issue to `${REPO_URL}/issues/<n>`.
- `changesFor(id)` gives one tool's changes; `ToolLite.isNew` marks a tool added in the last 30
  days.
- `Tool.freshness` is `{ checked, share90, band }` or null, and `ToolLite.freshness` is the band.
  `FRESHNESS_LABELS` names each band and `freshnessSummary()` counts them. Freshness says how
  recently we checked the sources, not how good the tool is; the copy must never suggest otherwise.
- `/changes.xml` is the Atom feed. `/badge/<id>.svg` is a "Listed on" badge for each tool.
- `@/lib/digest` gives the monthly digest: `digestMonths()`, `digest(month)`, `digestFacts(d)`.

Fresh, aging and stale use neutral tokens with an icon and a word, not the stage colours, which
mean lifecycle stages only. The "New" badge is small and quiet; it never animates while idle.

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

`data/landscape.json` is generated from the records. Design for the edge cases it carries: an acquired tool, the
full-lifecycle platforms, agent-infrastructure and model-layer nodes, a mostly unknown node and a
node with no logo. Design for all of them, not only the clean case.
