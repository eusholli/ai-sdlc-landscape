# Contributing to the data

The landscape is only as good as its sources, so every fact needs one.

## What belongs here

A tool is in the landscape when all three hold:

1. **AI is the core of the product**, not a feature added to an older one, and it works on some
   part of building, shipping or running software.
2. **Anyone can use it today**: generally available or in public beta. A waitlist or early access
   programme is not enough yet.
3. **Someone stands behind it**: a named company, or an open-source project in wide use.

A site that writes about tools (a blog, an analyst, an agency, a listicle) is not a tool.

A candidate that fails the bar goes in `data/screened.yaml` with the reason, so the next person
does not judge it again. `rejected` keeps it out of every future scan; `deferred` lists it at the
end of each scan for another look, for a tool in early access or a site that refused to be read.

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

## History

Each tool's page shows when it was added and last edited, and by whom. Both come from git, not
from the record, so nobody sets them by hand. The site shows the commit author's name and links
the date to the commit. It never shows an email address, so commit under the name you want shown.

A commit that only moves `retrieved:` dates is not counted as an edit. Neither is a commit listed
in `.git-blame-ignore-revs`, which is where a bulk reformat goes.

## Licence

The dataset is published under CC BY 4.0 ([LICENSE-DATA](LICENSE-DATA)). By contributing data you
agree to publish it under that licence.
