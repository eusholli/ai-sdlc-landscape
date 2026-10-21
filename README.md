# AI SDLC Landscape

An interactive map of the AI tools that work across the software development lifecycle: 179
tools across 13 phases, two cross-cutting layers (agent infrastructure and model providers) and
268 typed relations between them. Every fact on a tool links to the public page it came from.
Where a vendor does not publish a fact, the site says "Not published".

The site is static Next.js on Vercel. The data is a single JSON file you can download from the
site or read in `data/landscape.json`.

## Run it

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm check      # type check and tests
pnpm build      # static build: every tool page and per-tool JSON
```

## How the code is laid out

| Path | What is there |
|---|---|
| `data/` | the dataset (`landscape.json`, `phases.json`) |
| `lib/types.ts`, `lib/data.ts` | typed records and the server-side selectors over the dataset |
| `lib/filters.ts`, `lib/format.ts` | facets, search, URL state and display helpers, safe on the client |
| `components/logo.tsx` | vendor logo with a monogram fallback |
| `app/data/tools/[id]` | one static JSON file per tool, fetched by the tool drawer |
| `docs/design-brief.md` | the design contract |
| `scripts/guard.ts` | fails when generated code edits the data layer or ships the dataset to the client |
| `scripts/v0-run.ts` | drives v0 one prompt at a time from `docs/v0-prompts.md`, with a build gate |

Client components never import `lib/data.ts` or the JSON. Server components pass a slim
projection (`toolsLite()`), and the drawer fetches `/data/tools/<id>.json`. `scripts/guard.ts`
enforces this.

## Building the UI with v0

The UI was built with [v0](https://v0.app) through its Platform API. The runner seeds one v0 chat
with the design brief, the data layer (locked, so v0 cannot change it) and a trimmed sample of the
data, then sends each prompt in `docs/v0-prompts.md` in turn. After each step it pulls the files,
runs the guard, the build and the tests, sends any failure back to v0 at most twice, then commits
and pushes so Vercel posts a preview.

```bash
cp .env.example .env.local          # add V0_API_KEY
npx tsx scripts/v0-run.ts --dry-run # show what would be sent, spend nothing
npx tsx scripts/v0-run.ts           # run from the next step; pauses after step 2
npx tsx scripts/v0-run.ts --from 3  # carry on
npx tsx scripts/v0-run.ts --step 5  # re-run one step
```

Each step is logged in `docs/v0-log.md` with the v0 version, its demo URL and credits used.

## Updating the data

The dataset is maintained outside this repo and exported here whole. A refresh is:

1. Update the source records and rebuild the dataset.
2. Run the public export into this repo's `data/`, and fetch logos for any new tools into
   `public/logos/`.
3. `pnpm check && pnpm build`, then commit. Vercel redeploys on push.

## Corrections

Spotted a wrong or stale fact? [Open a correction](../../issues/new?template=correction.yml) with
a link to a public page that states the right one.

## Licence and logos

Code is MIT. The dataset is published under CC BY 4.0. Logos and product names belong to their
owners and are shown only to identify each product.
