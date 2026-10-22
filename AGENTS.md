# AGENTS.md

Every coding agent reads this file: Codex and Cline natively, Claude Code through `CLAUDE.md`,
which imports it. It is the whole set of standing rules for this repo. Keep it short; detail
belongs in the documents it points to.

## What this repo is

The AI SDLC Landscape: a neutral, public map of the AI tools that work across the software
development lifecycle, live at https://ai-sdlc-landscape.vercel.app. Two things live here, and
both are public:

- **The dataset.** One YAML record per tool in `data/tools/<id>.yaml`, plus `data/phases.json`
  and `data/externals.yaml`. Every fact carries a public source. Anyone, person or agent, asks for
  a change by opening a GitHub issue in plain words; the maintainer triages each one locally with
  the `triage` skill. Pull requests that edit records are welcome too. Licence CC BY 4.0 (`LICENSE-DATA`).
- **The site.** Next.js 15 (App Router), React 19, Tailwind 4, TypeScript. It reads only
  `data/landscape.json`, which `scripts/build-data.ts` generates from the records. Licence MIT.

How a record reaches the page: `scripts/build-data.ts` validates the YAML, computes tiers, adds
git history from `scripts/history.ts` and writes `data/landscape.json`. `lib/data.ts` is the only
reader of that file. It is server only and folds unpublished values to `null`. Server components
in `app/(site)/` pass the slim `toolsLite()` and `relationsLite()` to client components, and
`app/data/tools/[id]/route.ts` turns each tool into a static JSON file for the drawer. For agents,
`/llms.txt`, `/llms-full.txt`, `/landscape.json` and `/schema/tool.json` are built from the same
data (`lib/llms.ts`, `scripts/schema.ts`), and pages carry schema.org JSON-LD (`lib/jsonld.ts`).

The repo stands alone. It depends on no other repository, and no other repository writes into it.
Nobody is selling anything on this site, so no company's view of the market belongs in the data
or the copy.

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
```

`pnpm check` exits non-zero on any failure and is never routed around. CI runs it on every push
and pull request, and runs `data:links --changed` on pull requests that touch records.

## The data rules

`CONTRIBUTING.md` is the source of truth. The short form:

1. Every value has a source: `{field, url, retrieved}`. The build fails a value without one.
2. A fact that is not published is left out, never guessed. The site shows it as "Not published".
3. `summary` is the vendor's own one-line claim, quoted, not rewritten.
4. Tiers are computed, never stored: A is the vendor's own site, B is the `TRADE_PRESS` list in
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
- The files `LOCKED` in `scripts/guard.ts` names (`data/`, `scripts/`, `tests/`, `lib/data.ts`,
  `lib/types.ts`, `lib/filters.ts`, `lib/format.ts`, `lib/site.ts`, `lib/request-advice.ts`,
  `lib/llms.ts`, `lib/jsonld.ts`, `components/logo.tsx`, the `llms` and `schema` routes) are locked
  against v0 runs, which the guard enforces. A session working here by hand may change them, with
  tests. v0 does the visible UI only, as a new step in `docs/v0-prompts.md`. After hand edits to
  files v0 holds, run that step with `--new-chat`; the runner refuses otherwise.
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
| `data/screened.yaml` | candidates judged and rejected or deferred, with reasons |
| `data/scan.yaml` | the scan's queries and the hosts it never lists |
| `scripts/build-data.ts` | validation, tiering and the build into `data/landscape.json` |
| `scripts/history.ts` | added and last-edited dates, authors and `Requested-by` credits, from git |
| `scripts/schema.ts` | the JSON Schema for a record, served at `/schema/tool.json` |
| `scripts/scan.ts` | the repeatable search for new tools |
| `scripts/check-links.ts` | source URL checker |
| `scripts/fetch-logos.ts` | logo fetcher |
| `scripts/guard.ts` | the lock that keeps v0 runs out of data and logic |
| `scripts/v0-run.ts` | drives v0 step by step with a build gate; state in `docs/v0-state.json`, log in `docs/v0-log.md` |
| `lib/` | data access (`data.ts`, server only), types, filters, formatting, site URLs, request advice, llms text, JSON-LD |
| `app/` | routes; `app/data/` serves per-tool JSON to the drawer; `app/llms.txt`, `app/llms-full.txt`, `app/schema` for agents |
| `components/` | UI components |
| `tests/` | vitest suites |
| `docs/design-brief.md` | the design and data contract |
| `docs/scan.md` | how to run a scan and judge what it finds |
| `CONTRIBUTING.md` | the data rules for contributors |
| `.github/` | CI and monthly scan workflows, the plain-language request form |
| `.claude/skills/triage/` | the local skill for working through request issues |
