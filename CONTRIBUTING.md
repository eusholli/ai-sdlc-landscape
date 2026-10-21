# Contributing to the data

The landscape is only as good as its sources, so every fact needs one.

## The rules

- **Every value has a public source.** Add a `sources` entry naming the field, the URL of a public
  page that states the fact, and the date you read it (`retrieved: YYYY-MM-DD`). `pnpm check` fails
  a value without one.
- **Leave out what is not published.** Do not guess a price, a customer or a founding year. A
  missing field shows as "Not published", which is a fact in its own right.
- **Quote the vendor's own words for `summary`.** It is their one-line claim, not ours.
- **Sources are tiered by who published them.** The build works the tier out, so you do not set it:
  - A: the vendor's own site, or its GitHub.
  - B: established trade press. The list is `TRADE_PRESS` in `scripts/build-data.ts`.
  - C: anything else.

  An acquisition needs an A or B source. Market-research listicles and "top 10 tools" pages are not
  accepted.
- **Relations** go under `relations` on the tool they start from, as `{type, to, sources}`. The type
  is one of `integrates_with`, `built_on_model`, `acquired_by`, `partners_with`, `competes_with` or
  `ships_inside`. A target that is not a tool here needs a display name in `data/externals.yaml`.

## Making a change

Edit or add `data/tools/<id>.yaml`, where `<id>` matches the file name. Then run `pnpm check` and
`pnpm data:links --changed`, and open a pull request. If you would rather not edit files,
[open a correction](../../issues/new?template=correction.yml) with a link to the public page.

## Licence

The dataset is published under CC BY 4.0 ([LICENSE-DATA](LICENSE-DATA)). By contributing data you
agree to publish it under that licence.
