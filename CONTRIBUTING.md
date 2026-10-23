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
  - A: the vendor's own site, or a page under the vendor's own GitHub account (see `repo` below).
  - B: established trade press. The list is `TRADE_PRESS` in `scripts/build-data.ts`.
  - C: anything else, including GitHub pages under any other account.

  An acquisition needs an A or B source. Market-research listicles and "top 10 tools" pages are not
  accepted.
- **An open-source tool names its repo.** `repo` is the vendor's main GitHub repository, for
  example `https://github.com/<owner>/<name>`, and `open_source: true` needs one. Anyone can open a
  GitHub account under any name, so the vendor has to point at it: the `repo` source is a page on
  the vendor's own site that links to that account, or the repo itself when the tool's `url` is on
  GitHub. `pnpm data:links` checks the link is there. That account is then the vendor's, and its
  pages count as Tier A. A closed-source tool has no `repo`, so GitHub pages about it are Tier C.
- **Relations** go under `relations` on the tool they start from, as `{type, to, sources}`. The type
  is one of `integrates_with`, `built_on_model`, `acquired_by`, `partners_with`, `competes_with` or
  `ships_inside`. A target that is not a tool here needs a display name in `data/externals.yaml`.

## Making a change

Open an issue in plain words: [request a change](../../issues/new?template=request.yml). People
and agents ask the same way. An agent can file plain text with
`gh issue create --repo eusholli/ai-sdlc-landscape --title "<tool>: <what changes>" --body "..."`;
no template or label is needed. The site's [/llms.txt](https://aisdlclandscape.org/llms.txt)
says the same for agents.

Write it in your own words. A good request says:

1. **Which tool.** Its name, or its page on this site. For a new tool, its website.
2. **What should change.** What is wrong, missing or new: a price, a customer, an acquisition, a link to another tool, or a removal.
3. **Where it is published.** A public link that shows it, ideally the vendor's own site or trade press. Listicles and "top 10" pages are not accepted, and a fact that is not published is left out.
4. **Whether you work for the vendor.** Vendors are welcome; just say so.
5. **If you are an agent,** say so, and who you act for.

One issue can hold several changes. Each is checked, then accepted, or the issue is closed with the reason.

A maintainer checks each request against the rules above, using the triage skill in
`.claude/skills/triage/`. An accepted change is committed to `main`, which deploys the site, with
`Closes #<issue>` in the body and a `Requested-by: <name> (#<issue>)` trailer at the end. A
rejected one is closed with the reason and the rule it fails; a new tool that fails the bar also
goes in `data/screened.yaml`.

Pull requests that edit `data/tools/<id>.yaml` directly are welcome too. Run `pnpm check` and
`pnpm data:links --changed` first.

## History

Each tool's page shows when it was added and last edited, and by whom. Both come from git, not
from the record, so nobody sets them by hand. The site shows the commit author's name and links
the date to the commit. It never shows an email address, so commit under the name you want shown.

The person who asked for a change is credited too, from the commit's `Requested-by:` trailer: on
the tool's page, and in the list of contributors on the site. Only the name before `(#<issue>)`
is shown; anything that looks like an email is dropped. Git reads trailers only from the last
paragraph of a commit message, so keep `Closes #<issue>` in the body above it.

A commit that only moves `retrieved:` dates is not counted as an edit. Neither is a commit listed
in `.git-blame-ignore-revs`, which is where a bulk reformat goes.

The change log on the site (`/changes`, and the Atom feed at `/changes.xml`) comes from the same
git history. Each counted commit becomes one entry, naming the records it added, removed or
renamed, the fields it changed or published for the first time, and the relations it added. A
commit that adds more than 20 records at once, such as the first import, is one entry. A commit
that changes no fact, such as a new comment, is left out.

## Freshness

Each record shows how recently its sources were checked: the date of its oldest `retrieved`, and
a band. Fresh means every source was read in the last 30 days, aging in the last 90, and stale
means longer ago. The build works it out from the `retrieved` dates; it is never stored. It
measures our checking, not the tool. `pnpm data:links --refresh` stamps today on every source that
still answers.

## Licence

The dataset is published under CC BY 4.0 ([LICENSE-DATA](LICENSE-DATA)). By contributing data you
agree to publish it under that licence.
