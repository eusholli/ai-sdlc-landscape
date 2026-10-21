# v0 prompts

One feature per prompt, sent in order by `scripts/v0-run.ts` to a single v0 chat. Each prompt
starts with `## Step N: <name>` and runs to the next heading. The runner prepends nothing; each
prompt carries its own rules so a step can be re-run alone.

Every prompt ends with the same contract: read `docs/design-brief.md`, import from the data
layer, do not edit locked files.

## Step 1: Shell, navigation, theme and tokens

Read `docs/design-brief.md` first and follow it exactly.

Build the app shell for the AI SDLC Landscape.

- A slim sticky header: the site name "AI SDLC Landscape" on the left; in the middle, a segmented
  control for the three views, Map, Network and List, bound to the `view` URL key via
  `useQueryStates(filterParsers)`; on the right, a search button showing the ⌘K hint, a Compare
  button with a count badge bound to the `compare` key, a theme toggle (light, dark, system) using
  `next-themes`, and a link to `/about`.
- Below the header, a thin stats strip computed in a server component from `@/lib/data`: tool
  count, phases, relations, acquisitions and the data date from `dataDate()`, in Geist Mono with
  tabular figures.
- A footer: "Data as of <date>. Every fact links to its source. Logos belong to their owners."
  with links to About and to the JSON download at `/landscape.json`.
- Create `app/(site)/layout.tsx` for the header and footer and move `app/page.tsx` under it,
  keeping its placeholder content for now.
- Add a `components/stage-legend.tsx` that renders the six stages from `STAGES` in
  `@/lib/format` with their colours and labels, plus the two layers.
- Respect `useReducedMotion()` for any motion you add.

Rules: import types from `@/lib/types`; server components read `@/lib/data`; client components
never import `@/lib/data` or `data/landscape.json`. Do not edit `data/`, `lib/data.ts`,
`lib/types.ts`, `lib/filters.ts`, `lib/format.ts` or `components/logo.tsx`. No em dashes in any
UI text.

## Step 2: Landscape map with pan and zoom

Read `docs/design-brief.md` first, the "Layout and the map" section in particular.

Replace the home page placeholder with the landscape map.

- `app/(site)/page.tsx` is a server component. It passes `toolsLite()`, `relationsLite()`,
  `phases()`, `layers()` and the full-lifecycle ids from `fullLifecycle()` to a client component
  `components/map/landscape-map.tsx`.
- The map is a pannable, zoomable canvas built with DOM elements and CSS transforms (not a
  `<canvas>`), so tiles stay accessible and crisp. Wheel or pinch zooms around the pointer; drag
  pans; double-click zooms in one step. Add zoom in, zoom out and "fit" buttons in the bottom
  right, and keyboard: `+`, `-`, `0` to fit, arrow keys to pan.
- Layout: 13 phase columns in `PHASE_ORDER`, grouped under six stage headers coloured with
  `phaseColor`. Each column header shows the phase label and its tool count. Tiles sit under their
  `primaryPhase`. Below, two full-width bands for the agent infrastructure layer and the model
  providers layer, labelled. Above the columns, the full-lifecycle platforms as horizontal bars
  spanning the phases they cover, with gaps where they skip one.
- For this step render tiles as logo tiles (`<Logo>` at 40 px with the name below in small
  text). Semantic zoom comes in step 3, but structure the code so a `zoomLevel` value can switch
  tile rendering.
- On first load, columns enter left to right with a 40 ms stagger using `motion`. With reduced
  motion, a plain fade.
- Apply the active filters from the URL (`applyFilters` from `@/lib/filters`): tools that do not
  match fade to 15% opacity rather than disappearing, so the map keeps its shape.
- Clicking a tile sets the `tool` URL key (the drawer comes in step 4).

Rules: client components receive lite data as props and never import `@/lib/data`. Do not edit
locked files. No em dashes in UI text.

## Step 3: Semantic zoom and relation highlighting

Read `docs/design-brief.md`, "Three semantic zoom levels" and "Motion".

- Add the three zoom levels to the map: Overview (zoom < 0.6) shows each column as a heat block
  with the tool count in large type, intensity by count using the column's stage colour; Logos
  (0.6 to 1.4) is the current grid; Cards (> 1.4) shows logo, name, company and the quoted
  one-line claim (`summary`, two lines, clamped), with small badges for open source and for
  `moved` (acquired or shut down, with an icon and the word).
- Transitions between levels use `motion` shared layout animation so tiles grow out of the
  column totals and fold back. Each tile's logo has `layoutId={"logo-" + id}`.
- Show the current level as a small three-step indicator next to the zoom buttons; clicking a
  step zooms to it.
- Hover or keyboard focus on a tile dims every unrelated tile to 20% and draws its relations as
  SVG curves to the related tiles (externals are not on the map; list those in the hover card).
  Colour curves by relation type with a compact legend that appears while hovering. Curves draw
  in with `pathLength` over 250 ms; with reduced motion they appear at full length.
- A hover card (shadcn Tooltip or Popover) shows name, company, claim and "N relations".

Rules: lite data only on the client. Do not edit locked files. No em dashes in UI text.

## Step 4: Tool drawer and tool page

Read `docs/design-brief.md`, "Data contract".

- A right-side `Sheet` opens whenever the `tool` URL key is set, from any view. It fetches
  `/data/tools/<id>.json` (`{ tool: Tool, relations: Array<Relation & { other, otherName,
  direction }> }`) with a skeleton while loading.
- A static page `app/(site)/tools/[id]/page.tsx` with `generateStaticParams` over `allTools()`
  and `generateMetadata` (title is the tool name, description is its claim). It reads
  `toolById` and `relationsFor` from `@/lib/data` on the server.
- Share one presentational component, `components/tool/tool-detail.tsx`, between drawer and
  page. Sections, in order:
  1. Header: `<Logo>` at 56 px with `layoutId={"logo-" + id}`, name, company, a link to the
     vendor site, status badge if `status` is set, and buttons "Add to compare" and "Open page".
  2. The claim as a quote, attributed to the vendor.
  3. Phase coverage strip: all 13 phases as small segments, filled with stage colour where the
     tool covers that phase, primary phase marked.
  4. Facts grid: customers, traction, go-to-market partners, pricing model, entry price,
     deployment, models, open source, compliance, interface, target buyer, autonomy, founded,
     headquarters, headcount, funding total, last round. Every unknown value reads "Not
     published" in muted text via `notPublished()` / `joinOrNotPublished()`.
  5. Relations grouped by type using `RELATION_LABELS` and `direction`. Related tools link to
     their drawer; externals are plain text.
  6. Sources: each field's sources as links showing the host (`hostOf`), the tier as a small
     badge (A vendor page, B press or analyst, C secondary) and the retrieved date. Next to each
     fact in the grid, a small superscript link jumps to its source.
  7. "Last verified <date>" and a "Suggest a correction" link to
     `https://github.com/eusholli/ai-sdlc-landscape/issues/new?template=correction.yml&title=<name>`.

Rules: the drawer is a client component and fetches JSON; the page is a server component. Do not
edit locked files. No em dashes in UI text.

## Step 5: Command palette search and URL filters

- A ⌘K / Ctrl K command palette (shadcn `Command` in a `Dialog`) over the lite tools using
  `searchLite` from `@/lib/filters`. Results show logo, name, company and why it matched (for a
  customer match: "Customer: Autodesk"). Enter opens the drawer. Also list phases as results that
  filter the map to that phase.
- A filter bar under the header (a row of popover multi-selects with counts): Phase, Segment, Kind
  (`subKind`, labels from `SUB_KIND_LABELS`), Pricing (`PRICING_LABELS`), Deployment
  (`DEPLOYMENT_LABELS`), Autonomy (`AUTONOMY_LABELS`), Interface, Buyer. Options and counts come
  from `facetCounts(tools, filters, key)`. The `NOT_PUBLISHED_ID` bucket shows as "Not published
  (N)" last in every list.
- Two toggles: "Open source only" (`oss`) and "Acquired or shut down" (`moved`).
- Active filters show as removable chips with a "Clear all" link, and a live count "Showing N of
  179". All state is in the URL via `useQueryStates(filterParsers)`, so a copied URL reproduces
  the view.

Rules: lite data only on the client. Do not edit locked files. No em dashes in UI text.

## Step 6: Network view

- When `view=network`, show a force-directed graph with `react-force-graph-2d`, loaded with
  `next/dynamic` and `ssr: false`.
- Nodes: every tool and model (lite data). Size by relation count. Fill with stage colour via
  `getComputedStyle` on the CSS variables so dark mode stays correct; layer nodes use the layer
  colours. Draw the logo inside nodes when zoomed in.
- Edges: from `relationsLite()`, with a toggle per relation type (integrates, competes, ships
  inside, built on, acquired, partners) and colour by type. Externals appear as small grey nodes
  only when "Show companies outside the census" is on.
- The stage legend is interactive: clicking a stage isolates it. Because six stage colours are
  hard to tell apart on a scatter of nodes, hovering a node always shows its name and phase as a
  label.
- Click a node to focus its neighbourhood (others fade) and open the drawer. The simulation
  settles in on load; with reduced motion, run the simulation ahead of time and render the
  settled layout.
- Respects the same URL filters as the map.

Rules: lite data only. Do not edit locked files. No em dashes in UI text.

## Step 7: Compare

- `app/(site)/compare/page.tsx` reads `compare` ids from the URL (up to four) and shows the tools
  side by side, one column each, rows matching the facts grid from the tool detail, plus the
  phase coverage strip.
- Highlight rows where the values differ; a toggle hides rows where all values are equal or all
  are "Not published".
- Add and remove tools with a small search (reuse `searchLite`). From any tile, drawer or palette
  result, "Add to compare" appends to the URL key; a fifth replaces the oldest with a toast.
- Data: compare needs full records, so fetch `/data/tools/<id>.json` for each id.

Rules: do not edit locked files. No em dashes in UI text.

## Step 8: Market moves and insights

- `app/(site)/moves/page.tsx`, a server component reading `marketMoves()`. Dated moves sit on a
  vertical timeline that scrubs as you scroll (`useScroll` and `useTransform` from `motion`):
  the active entry grows, the rest recede. Each entry: tool logo, "<Tool> acquired by
  <acquirer>" or "<Tool> shut down", the date, the status text and source links. Undated moves
  follow in an ordered list titled "Undated in the source data" with the same entry design. Do
  not invent dates.
- `app/(site)/insights/page.tsx`, a server component:
  1. A heatmap of phases (columns, lifecycle order) against segments plus the layer row, from
     `coverageMatrix()`, as a single-hue sequential ramp; each cell shows its count and a hover
     tooltip; a table view toggle.
  2. "Most and least crowded phases": a sorted bar list of tools per phase (primary phase), bars
     in stage colour, labels in foreground text.
  3. "What vendors publish": `fieldCompleteness()` as horizontal bars, "known of 179" for each
     field, honest copy above: "Go-to-market partners are published for few tools. Treat thin
     fields as a floor, not a census."
- Add both pages to the header navigation.

Rules: server components read `@/lib/data`. Do not edit locked files. No em dashes in UI text.

## Step 9: About, share images, mobile list and accessibility

- `app/(site)/about/page.tsx`: what the landscape is; the inclusion bar (shipping products with AI
  in the software lifecycle, with a public page); method (every non-empty field traces to a
  fetched page, listed under Sources on each tool; tiers A, B, C explained; "Not published" means
  the vendor does not say); what is excluded and why, in one paragraph; the data date; a download
  link to `/landscape.json`; how to suggest a correction (GitHub issue template); "Logos and
  product names belong to their owners."
- `app/landscape.json/route.ts` serving the full dataset as a static download.
- Share images with `next/og`: `app/opengraph-image.tsx` for the site (the 13 phases as a coloured
  lifecycle band with the tool count) and `app/(site)/tools/[id]/opengraph-image.tsx` per tool
  (name, company, claim, coverage strip). Use `generateStaticParams` so they render at build.
- Mobile: under 768 px, the home view is a list grouped by phase with sticky phase headers,
  filters in a bottom sheet, search on top. `view=list` shows the same list on desktop.
- Accessibility pass: landmarks, skip link, focus rings, `aria-live` count of filtered results,
  arrow-key navigation between map tiles, Escape closes drawer and palette, all icons labelled.
- `app/sitemap.ts` and `app/robots.ts` covering home, every tool page, compare, moves, insights
  and about.

Rules: do not edit locked files. No em dashes in UI text.
