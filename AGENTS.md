# AGENTS.md

Every coding agent reads this file: Codex and Cline natively, Claude Code through `CLAUDE.md`,
which imports it. It is the whole set of standing rules for this repo. Keep it short; detail
belongs in the documents it points to.

## What this repo is

The AI SDLC Landscape: a neutral, public map of the AI tools that work across the software
development lifecycle, live at https://aisdlclandscape.org. Two things live here, and
both are public:

- **The dataset.** One YAML record per tool in `data/tools/<id>.yaml`, plus `data/phases.json`
  and `data/externals.yaml`. Model providers (`layer: model`) and the platforms tools integrate with
  (`layer: systems`, such as code hosts and trackers) have records too, but are never counted as tools. Every fact carries a public source. Anyone, person or agent, asks for
  a change by opening a GitHub issue in plain words; the maintainer triages each one locally with
  the `triage` skill. Pull requests that edit records are welcome too. Licence CC BY 4.0 (`LICENSE-DATA`).
- **The site.** Next.js 15 (App Router), React 19, Tailwind 4, TypeScript. It reads only
  `data/landscape.json`, which `scripts/build-data.ts` generates from the records. Licence MIT.

How a record reaches the page: `scripts/build-data.ts` validates the YAML, computes tiers, adds
git history from `scripts/history.ts` and writes `data/landscape.json`. `lib/data.ts` is the only
reader of that file. It is server only and folds unpublished values to `null`. Server components
in `app/(site)/` pass the slim `toolsLite()` and `relationsLite()` to client components, and
`app/data/tools/[id]/route.ts` turns each tool, its relations and its changes into a static JSON
file for the drawer, and into Markdown. Each phase has a page at `/phases/<id>` (`lib/phase-page.ts`),
with JSON and Markdown from `app/data/phases/[id]/route.ts`. For agents,
`/llms.txt`, `/llms-full.txt`, `/landscape.json`, `/schema/tool.json` and a Markdown copy of every
tool and phase page (`/tools/<id>.md`, `/phases/<id>.md`, rewritten in `next.config.ts`) are built
from the same data (`lib/llms.ts`, `scripts/schema.ts`). Pages carry schema.org JSON-LD
(`lib/jsonld.ts`), and titles, descriptions and Open Graph fields come from `lib/seo.ts`. A route
that is removed gets a permanent redirect in `REDIRECTS` in `next.config.ts`, in the same commit.
The change log comes from git too (`changeLog` in `scripts/history.ts`). `lib/data.ts` turns it
into `timeline()`, which feeds `/changes.xml` (`lib/feed.ts`) and the monthly digest
(`lib/digest.ts`, `pnpm digest`). Each tool has a "Listed on" badge at `/badge/<id>.svg`
(`lib/badge.ts`).

The repo stands alone. It depends on no other repository, and no other repository writes into it.
Nobody is selling anything on this site, so no company's view of the market belongs in the data
or the copy. `/ownership` is the maintainer's signed thesis. It is not data, and no record may cite it.

## Commands

```bash
pnpm dev              # build the data, then run the site locally
pnpm check            # THE GATE: build the data, typecheck, lint, test. Run it before every commit
pnpm build            # production build, as Vercel runs it
pnpm data             # records -> data/landscape.json (gitignored; every script above runs it first)
pnpm data:check       # validate the records only, write nothing
pnpm vitest run tests/scan.test.ts -t "name"   # one file or one test; run `pnpm data` first,
                      # since tests/data.test.ts imports the generated landscape.json
pnpm data:links       # fetch every source URL; --changed for records changed against origin/main,
                      # --refresh to stamp `retrieved` on each source that answered
pnpm logos            # fetch missing logos into public/logos/ from each vendor's own site
pnpm scan             # search for tools the landscape lacks; writes .scan/<date>.md (docs/scan.md)
pnpm digest [YYYY-MM] # last month's changes as a short post and a long version, in .digest/
pnpm shots            # with `pnpm dev` running: screenshots of the main pages in both themes, in .shots/
```

`pnpm check` exits non-zero on any failure and is never routed around. CI runs it on every push
and pull request, and runs `data:links --changed` on pull requests that touch records.

## The data rules

`CONTRIBUTING.md` is the source of truth. The short form:

1. Every value has a source: `{field, url, retrieved}`. The build fails a value without one.
2. A fact that is not published is left out, never guessed. The site shows it as "Not published".
3. `summary` is the vendor's own one-line claim, quoted, not rewritten.
4. Tiers are computed, never stored: A is the vendor's own site or its own GitHub account (the
   one in `repo`, which an open-source tool must name), B is the `TRADE_PRESS` list in
   `scripts/build-data.ts`, C is the rest. Listicles and "top 10" pages are refused. An acquisition
   needs an A or B source.
5. Relations sit on the tool they start from, as `{type, to, sources}`, with a type from
   `REL_TYPES`.
6. A candidate judged and turned down goes in `data/screened.yaml` with its reason, so no scan
   offers it again. The inclusion bar is in `CONTRIBUTING.md`.
7. Who added and last edited a record comes from git (`scripts/history.ts`), never from the
   record. The site shows author names, never emails. A bulk reformat goes in
   `.git-blame-ignore-revs` so it is not counted as an edit. A change made from an issue ends its
   commit message with `Requested-by: <name> (#<issue>)`, which credits the person who asked;
   `Closes #<issue>` goes in the body above it, since git reads trailers from the last paragraph only.

A new rule about the data is enforced in `scripts/build-data.ts` with a test in
`tests/build-data.test.ts`, then written into `CONTRIBUTING.md`. A rule that only lives in prose
is a rule nobody follows.

## The code rules

- `docs/design-brief.md` is the design contract: tone, colour, layout, motion and the data
  contract. Read it before touching a component.
- Never import `data/landscape.json` or `@/lib/data` from a `"use client"` file. Client components
  get `ToolLite[]` and `RelationLite[]` as props; the drawer fetches `/data/tools/<id>.json`.
- `null` means not published: render it with `notPublished()`, never an empty cell or a dash.
- UI work is done by hand in this repo, following the `ui` skill in `.claude/skills/ui/`: edit,
  look at it in `pnpm dev`, run `pnpm shots` (both themes, phone and desktop widths, fails on
  sideways scroll, console errors or a bad response), then `pnpm check` and `pnpm build`.
- Logic that a page needs goes in `lib/` with a fixture test, not in a component. A change to the
  data layer (`data/`, `scripts/`, `lib/data.ts`, `lib/types.ts`) comes with a test in the same change.
- `scripts/guard.ts`, part of `pnpm check`, fails when a `"use client"` file imports the dataset.
- Navigation lives in `components/site-nav.ts`: Landscape (map, network, list and market moves
  views), Analyze choices (choose and compare tools), Update tool data (`/contribute`),
  Latest updates and an About menu.
  The header, the phone menu and the footer read it; a new page is added there once. The footer
  also lists every phase page.
- Tool links use `ToolLink` (`components/tool/tool-actions.tsx`), which points at `/tools/<id>`
  so crawlers can follow it; on `/` a plain click opens the drawer instead.
- Repo URLs and the request advice come from `lib/site.ts` and `lib/request-advice.ts`; never
  retype them.
- Nothing in code, tests or copy hard-codes how many tools, relations or sources there are. The
  dataset grows by issue and pull request; derive counts from the data.
- Tests never depend on the content of a real record. A test that needs a record uses a fixture
  it owns, as `tests/build-data.test.ts` does.

## Writing rules

For UI copy, docs, commit messages and pull request text:

- No em dashes joining clauses. Use a comma, a colon or two sentences.
- No marketing words: unlock, elevate, supercharge, seamless, delve, cutting-edge, game-changing,
  revolutionize, harness the power. No "not just X, but Y".
- Short words, sentence case, active voice, and name the actor ("Vendors list 3 customers").

## Working discipline

- Work on `main`. Pushing to `main` deploys to production on Vercel, so push only what has passed
  `pnpm check` and, for anything visible, been looked at in `pnpm dev` in both themes.
- Done means verified. Say what was run and what it showed. A skipped step is reported as skipped.
- Fix what you find out of date (a stale count, a dead link, a doc that disagrees with the code)
  in the session that finds it, or raise it then.
- When a change moves or renames something this file names, update this file in the same commit.

## Where things live

| Path | What is there |
|---|---|
| `data/tools/` | one record per tool, the source of truth |
| `data/externals.yaml` | display names for relation targets with no record |
| `data/screened.yaml` | candidates judged and rejected or deferred, with reasons |
| `data/scan.yaml` | the scan's queries and the hosts it never lists |
| `scripts/build-data.ts` | validation, tiering and the build into `data/landscape.json` |
| `scripts/history.ts` | added and last-edited dates, authors and `Requested-by` credits, from git |
| `scripts/schema.ts` | the JSON Schema for a record, served at `/schema/tool.json` |
| `scripts/scan.ts` | the repeatable search for new tools |
| `scripts/check-links.ts` | source URL checker |
| `scripts/fetch-logos.ts` | logo fetcher |
| `scripts/guard.ts` | fails when a client component imports the dataset |
| `scripts/shots.ts` | screenshots of the main pages in both themes and two widths, with checks |
| `components/site-nav.ts` | the navigation; header, phone menu and footer read it |
| `lib/` | data access (`data.ts`, server only), types, filters, formatting, site URLs, request advice, llms text, JSON-LD, titles and Open Graph (`seo.ts`), phase pages (`phase-page.ts`), feed, badge, digest, connections across the lifecycle and stack coverage (`connections.ts`), the choices selection (`compare.ts`) and how it is saved in the browser (`choices.ts`) |
| `app/` | routes; `app/data/` serves per-tool and per-phase JSON and Markdown; `app/llms.txt`, `app/llms-full.txt`, `app/schema` for agents |
| `components/` | UI components; `components/analyze/` is the Analyze choices page |
| `tests/` | vitest suites |
| `docs/design-brief.md` | the design and data contract |
| `docs/scan.md` | how to run a scan and judge what it finds |
| `CONTRIBUTING.md` | the data rules for contributors |
| `.github/` | CI and weekly scan workflows, the plain-language request form |
| `.claude/skills/triage/` | the local skill for working through request issues |
| `.claude/skills/ui/` | the local skill for changing the visible UI |
