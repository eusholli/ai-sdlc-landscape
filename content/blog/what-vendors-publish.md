---
title: "AI SDLC tool pricing: what vendors publish"
description: "How many AI tools across the software lifecycle have a public price, named customers or a compliance claim, overall and by phase, as the records stood on 28 October 2026."
date: 2026-10-29
kind: data
as_of: 2026-10-28
phases: [measure, maintain, review, cicd]
---

Every tool on this map has a record, and every fact in a record links to a public source. When no
public source states a fact, the record leaves it out and the page says "Not published". So the
gaps are data too: they show what a buyer will not find on a public page, as far as the records
reach.

These figures cover the 183 tool records in the data on 28 October 2026. They leave out model
providers and platforms, which are listed because tools connect to them. The records change every
week, so the tool pages are the current view and this post is a snapshot.

## Price, customers and compliance

| What the record holds | Tool records |
|---|---|
| A one-line claim from the vendor | 183 of 183 (100%) |
| A pricing model, such as per seat or by quote | 113 of 183 (62%) |
| An entry price | 84 of 183 (46%) |
| Named customers | 78 of 183 (43%) |
| A compliance claim, such as SOC 2 | 66 of 183 (36%) |

Nineteen records hold all three of an entry price, named customers and a compliance claim. Forty-four
hold none of them.

## By phase

The share with an entry price differs by where a tool sits in the lifecycle. Each tool is counted
once, under its primary phase.

| Primary phase | Tool records | With an entry price |
|---|---|---|
| Plan and specify | 12 | 6 |
| Design and architecture | 8 | 4 |
| Write code | 45 | 20 |
| Code review | 13 | 9 |
| Test and QA | 17 | 9 |
| Security | 18 | 7 |
| CI/CD and release | 5 | 4 |
| Deploy and infrastructure | 6 | 2 |
| Operate | 14 | 6 |
| Maintain and modernize | 7 | 1 |
| Code understanding and knowledge | 13 | 5 |
| Engineering intelligence | 8 | 0 |
| Developer portals and platform | 4 | 1 |
| Not tied to one phase | 13 | 10 |

None of the eight engineering intelligence tools has a public entry price. Four of them state a
pricing model (by quote, per seat or per contributor), and the other four state none. In code
review and in CI/CD and release, most tools publish a price.

## How to read this

A missing value means the maintainers found no public source for it, not that the vendor refuses
to say. A vendor can publish a price tomorrow, or a contributor can find one we missed. Either way,
[Update tool data](/contribute) says how to send it with its source, and the record changes once
the source checks out.

## Check the figures

The figures come from `data/landscape.json`, built from the records as they stood on 28 October
2026. The script that counts them arrived with this post, so check out the commit that added this
post and run `pnpm blog:fields` for the first table and the two counts under it, and
`pnpm blog:fields entry_price` and `pnpm blog:fields pricing_model` for the phase figures.
