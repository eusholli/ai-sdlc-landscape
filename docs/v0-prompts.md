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
  7. "Last verified <date>" and a "Suggest a change" link to `requestUrl(tool.name)` from
     `lib/site.ts`, which opens the request form with the title filled in.

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

## Step 10: Title, requests for change and the contribute page

Read `docs/design-brief.md` first, "The title" and "Requests for change" under "Layout and the map"
in particular.

Anyone, person or agent, can now ask for a change by opening a GitHub issue in plain words. This
step makes that visible, and gives the home page a real title. Links and copy come from
`lib/site.ts` (`REPO_URL`, `REQUEST_URL`, `requestUrl(name)`) and `lib/request-advice.ts`
(`REQUEST_INTRO`, `REQUEST_ADVICE`, `REQUEST_OUTRO`). Use them; never retype a URL or the advice.

- **Home intro.** In `app/(site)/page.tsx`, above the map and inside `SITE_CONTAINER`, add a short
  intro: `<h1>` "AI SDLC Landscape" (the page's only h1), then this copy:
  "A neutral, public map of the AI tools that work across the software development lifecycle.
  Every fact has a public source. The data and code are open on GitHub, and anyone, person or
  agent, can request a change."
  "on GitHub" links to `REPO_URL`; "request a change" links to `/contribute`. Keep it compact: one
  line of title and at most two lines of text on desktop. A small button collapses it to the title
  alone and expands it again; remember the choice in `localStorage` (wrapped in try/catch, expanded
  by default) in a small client component. Keep the existing `<script type="application/ld+json">`
  in the page as it is. Make sure the map's height still fits the viewport with the intro open.
- **Tool drawer and tool page.** In `components/tool/tool-detail.tsx`, the footer link already
  reads "Suggest a change" and uses `requestUrl(tool.name)`; keep it. In the history line, when
  `tool.history.requestedBy` is not empty, add "Requested by" and each name with its issue as a
  link, e.g. "Requested by Ada (#12), Grace (#30)", where "#12" links to `${REPO_URL}/issues/12`.
- **`/contribute` page**, `app/(site)/contribute/page.tsx`, a server component in the style of the
  About page:
  - `<h1>` "Request a change", and a sentence: anyone, person or agent, can ask in plain words by
    opening a GitHub issue; a maintainer checks each one against the rules and accepts it or
    closes it with the reason.
  - The advice: `REQUEST_INTRO`, then `REQUEST_ADVICE` as a numbered list (title in bold, then
    body), then `REQUEST_OUTRO`. A primary button "Open a request on GitHub" to `REQUEST_URL`.
  - "For agents": the same request filed as plain text, with a copyable code block:
    `gh issue create --repo eusholli/ai-sdlc-landscape --title "<tool>: <what changes>" --body "<the request, with its public source>"`
    and one line saying no template or label is needed.
  - "Read the data": a list of the machine-readable files, each a link with one line on what it
    holds: `/llms.txt` (a map of the site for agents), `/llms-full.txt` (every tool as Markdown,
    with sources), `/landscape.json` (the full dataset; `null` means not published),
    `/data/tools/<id>.json` (one tool and its relations), `/schema/tool.json` (the JSON Schema for
    one record), and the source records on GitHub (`${REPO_URL}/tree/main/data/tools`). Say the
    data is CC BY 4.0 and the code MIT.
  - "People who improved this map": from `contributors()` in `@/lib/data`, each name with the
    issues they raised as links. With none yet, say "No requests accepted yet."
  - `generateMetadata` or `metadata` with title "Request a change".
- **About page.** Rename the "Suggest a correction" section to "Request a change", say requests
  are plain words from people or agents, and link to `/contribute` as well as `REQUEST_URL`.
- **Navigation.** Add "Contribute" (`/contribute`, an icon such as `MessageSquarePlus`) to the
  header links next to About, and a "Request a change" link to `/contribute` in the footer.

Rules: server components read `@/lib/data`; client components never import `@/lib/data` or
`data/landscape.json`. Do not edit `data/`, `lib/data.ts`, `lib/types.ts`, `lib/filters.ts`,
`lib/format.ts`, `components/logo.tsx`, `lib/site.ts` or `lib/request-advice.ts`. Do not remove
the JSON-LD scripts, `app/llms.txt`, `app/llms-full.txt` or `app/schema`. No em dashes in any UI
text. Check both themes and a 375 px width.

## Step 11: The changes page

Read `docs/design-brief.md` first, "Changes, freshness and the badge" in particular.

The site now records every change to its data. This step gives that a page.

- **`/changes`**, `app/(site)/changes/page.tsx`, a server component reading `timeline()` and
  `launch()` from `@/lib/data`.
  - `<h1>` "What changed", then one line: "Every change to the data, from the public git
    history, and the market moves the data records. Newest first." Next to it, a small "Feed" link
    with an RSS icon to `/changes.xml`.
  - Entries grouped under month headings ("October 2026"). The headings are plain text for now;
    step 13 links them to the month's digest page.
  - A `kind: "changes"` entry: the date, then `text`. When it touched one tool, show the tool's
    `<Logo>` and make the text open the drawer for it (the same way map tiles open it). When it
    touched several, show up to five logos in a small overlapping row and a "Show all" disclosure
    listing each `change.text`. Under the text, in muted small type: "by <author>", "Requested by
    <name> (#<issue>)" for each credit with the issue linked, and a "commit" link to
    `${REPO_URL}/commit/<sha>`.
  - A `kind: "move"` entry: the tool's logo, `text`, the date, and its source links, in the same
    design as the /moves page entries, with a small "Market move" label.
  - The launch entry (`launch()`, shown by the text "The landscape launched with ...") is a card
    with a subtle border, not a list row.
  - Entries fade and rise in as they scroll into view (once, springs, 40 ms stagger, reduced
    motion: opacity only).
  - `metadata` title "What changed".
- **Navigation.** Add "Changes" (`/changes`, an icon such as `History`) to the header links,
  before Market moves, and to the footer.
- **Tool drawer and tool page.** In `components/tool/tool-detail.tsx`, under the history line, add
  a "Changes" disclosure listing that tool's changes newest first: date and text, each linking to
  its commit. The drawer's `/data/tools/<id>.json` now carries `changes: Change[]` (newest first);
  the tool page can call `changesFor(id)` on the server.

Rules: server components read `@/lib/data` (and `@/lib/digest`); client components never import
`@/lib/data`, `@/lib/digest` or `data/landscape.json`, and get what they need as props. Do not edit
`data/`, `lib/data.ts`, `lib/types.ts`, `lib/filters.ts`, `lib/format.ts`, `lib/site.ts`,
`lib/feed.ts`, `lib/badge.ts`, `lib/digest.ts`, `components/logo.tsx`, `app/changes.xml` or
`app/badge`; if you need a new selector, say so in the reply. Never hard-code how many tools,
changes or relations there are. No em dashes in any UI text. Check both themes and a 375 px width.

## Step 12: What's new on the home page, and New badges

Read `docs/design-brief.md` first, "Changes, freshness and the badge" in particular.

- **What's new strip.** On the home page, between the intro and the map, a single compact row:
  "What's new" then the three latest `timeline(3)` entries as short items (date, logo when one
  tool, `text` truncated to one line with the full text in a title attribute), then "All changes"
  linking to `/changes`. It scrolls sideways on narrow screens rather than wrapping. It collapses
  with the intro: when the intro is collapsed, the strip shows only "What's new" and the newest
  item. Keep the map's height fitting the viewport.
- **New badges.** A tool with `isNew` true gets a small "New" pill: on its map tile at the logo and
  card zoom levels (a dot at the overview level is too much; skip it there), on its row in the
  mobile list, and next to its name in the drawer header. Use the accent or primary token, not a
  stage colour.
- **Filter.** `filterParsers` in `lib/filters.ts` now has `recent` (a boolean), and `applyFilters`
  keeps only tools with `isNew` when it is set. In `components/filters/filter-bar.tsx`, add a "New"
  toggle next to the "Acquired or shut down" one, built the same way (URL state through
  `patchUrl`, a removable chip "Added in the last 30 days"). Hide the toggle when no tool in the
  props is new.

Rules: server components read `@/lib/data` (and `@/lib/digest`); client components never import
`@/lib/data`, `@/lib/digest` or `data/landscape.json`, and get what they need as props. Do not edit
`data/`, `lib/data.ts`, `lib/types.ts`, `lib/filters.ts`, `lib/format.ts`, `lib/site.ts`,
`lib/feed.ts`, `lib/badge.ts`, `lib/digest.ts`, `components/logo.tsx`, `app/changes.xml` or
`app/badge`; if you need a new selector, say so in the reply. Never hard-code how many tools,
changes or relations there are. No em dashes in any UI text. Check both themes and a 375 px width.

## Step 13: Freshness and the monthly digest page

Read `docs/design-brief.md` first, "Changes, freshness and the badge" in particular.

Freshness is measured when the site is built, so every freshness label says so: "as of
<buildDate()>" from `@/lib/data` (pass it as a prop to client components), or the date in the
tool's own `checked`. Never write "today" or "this week".

- **Freshness on a tool.** In `components/tool/tool-detail.tsx`, next to "Last verified", show a
  small chip: an icon and the band's word ("Fresh", "Aging", "Stale"), then "sources checked since
  <date>" from `tool.freshness.checked`. The drawer has no build date; the chip there reads from
  `checked` only. Its tooltip is `FRESHNESS_LABELS[band]` and one line:
  "How recently we checked this record's sources. It says nothing about the tool." When
  `tool.freshness` is null, show `notPublished()`. Neutral tokens, never stage colours.
- **Freshness on /insights.** A new section "How fresh the data is": `freshnessSummary()` as a
  single stacked bar of the three bands with counts and labels, then the ten records checked least
  recently (`leastRecentlyChecked(10)`), each with its logo, name (opening the drawer) and checked
  date, and a line: "Know a newer source for one of these? Request a change." linking to
  `/contribute`.
- **Month links.** On `/changes`, each month heading now links to `/changes/<YYYY-MM>` when that
  month is in `digestMonths()`; earlier months stay plain text.
- **The digest page**, `app/(site)/changes/[month]/page.tsx`, a server component.
  `generateStaticParams` from `digestMonths()`; a month not in the list is a 404.
  - `<h1>` "The landscape in <d.title>", then `digestFacts(d)` as a list of large, plain
    sentences: this is the page people share.
  - Sections, each only when it has content: "Tools added" (logo grid, each opening the drawer),
    "Facts published for the first time" (tool and fields), "Where tools were added" (`d.phases`
    as bars in stage colour), "Market moves", "Thanks" (contributors with issue links),
    "Freshness" (only on the newest month's page, the stacked bar from /insights, headed "As of
    <buildDate()>"), and "Every change" (the month's entries, as on
    /changes).
  - Previous and next month links. A "Copy summary" button that copies `digestFacts(d)` as plain
    lines plus the page URL (reuse `components/copy-button.tsx`).
  - `generateMetadata` with the title "The landscape in <month>" and a share image in the style
    of the site's existing `opengraph-image.tsx`, showing the month and the first three facts.

Rules: server components read `@/lib/data` (and `@/lib/digest`); client components never import
`@/lib/data`, `@/lib/digest` or `data/landscape.json`, and get what they need as props. Do not edit
`data/`, `lib/data.ts`, `lib/types.ts`, `lib/filters.ts`, `lib/format.ts`, `lib/site.ts`,
`lib/feed.ts`, `lib/badge.ts`, `lib/digest.ts`, `components/logo.tsx`, `app/changes.xml` or
`app/badge`; if you need a new selector, say so in the reply. Never hard-code how many tools,
changes or relations there are. No em dashes in any UI text. Check both themes and a 375 px width.

## Step 14: The vendor badge

Read `docs/design-brief.md` first, "Changes, freshness and the badge" in particular.

Each tool has a static badge at `/badge/<id>.svg`. This step lets vendors find and use it.

- **Tool page.** In `app/(site)/tools/[id]/page.tsx`, near the end, a section "Listed here?":
  one line ("If this is your tool, you can show it is listed. Keep the record current by
  requesting a change when a fact moves."), the badge itself as an `<img>` from
  `/badge/<id>.svg`, and two copyable snippets (reuse `components/copy-button.tsx`): HTML,
  `<a href="<SITE_URL>/tools/<id>"><img src="<SITE_URL>/badge/<id>.svg" alt="<name> is listed on AI SDLC Landscape"></a>`,
  and Markdown, `[![<name> is listed on AI SDLC Landscape](<SITE_URL>/badge/<id>.svg)](<SITE_URL>/tools/<id>)`.
  `SITE_URL` comes from `@/lib/site`. "requesting a change" links to `requestUrl(name)`.
- **Contribute page.** A short section "For vendors": what the badge is, that it links back to the
  tool's page, and that the record changes only by public request with a source. Link to an
  example tool page.
- Not in the drawer: it is for vendors, not readers.

Rules: server components read `@/lib/data` (and `@/lib/digest`); client components never import
`@/lib/data`, `@/lib/digest` or `data/landscape.json`, and get what they need as props. Do not edit
`data/`, `lib/data.ts`, `lib/types.ts`, `lib/filters.ts`, `lib/format.ts`, `lib/site.ts`,
`lib/feed.ts`, `lib/badge.ts`, `lib/digest.ts`, `components/logo.tsx`, `app/changes.xml` or
`app/badge`; if you need a new selector, say so in the reply. Never hard-code how many tools,
changes or relations there are. No em dashes in any UI text. Check both themes and a 375 px width.

## Step 15: First impression and a mobile pass

Read `docs/design-brief.md` first.

- **Home first impression.** Make the first screen say, at a glance, that this map is current and
  open. Keep the `<h1>` and the intro copy. Fold the stats strip and the What's new strip into one
  calm band if that reads better; show the date of the newest change from `timeline(1)` as
  "Updated <date>" next to the counts. No new claims and no marketing words.
- **Mobile pass at 375 px.** Go through the home page, /changes, a digest page, a tool page with
  the badge section, /insights and /moves. Fix overflow, tap targets under 44 px, truncated
  headings and anything that scrolls sideways that should not. List what you changed in the
  reply.

Rules: server components read `@/lib/data` (and `@/lib/digest`); client components never import
`@/lib/data`, `@/lib/digest` or `data/landscape.json`, and get what they need as props. Do not edit
`data/`, `lib/data.ts`, `lib/types.ts`, `lib/filters.ts`, `lib/format.ts`, `lib/site.ts`,
`lib/feed.ts`, `lib/badge.ts`, `lib/digest.ts`, `components/logo.tsx`, `app/changes.xml` or
`app/badge`; if you need a new selector, say so in the reply. Never hard-code how many tools,
changes or relations there are. No em dashes in any UI text. Check both themes and a 375 px width.
