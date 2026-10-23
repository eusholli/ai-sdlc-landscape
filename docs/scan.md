# Finding new tools

The landscape was first built from one wide search. `pnpm scan` repeats that search whenever you
want it, and lists the sites that look like tools the landscape does not hold yet. It never edits
the data. A person judges each candidate.

## Running it

```bash
pnpm scan                 # search, read the results, write .scan/<date>.md
pnpm scan --max-pages 80  # read fewer result pages (default 250)
pnpm scan --fresh         # search again even if today's results are already saved
```

It needs `SERPER_API_KEY` in `.env.local`. Without one it prints the queries so you can run them by
hand. A full run makes 21 searches and takes a few minutes. The searches are saved in
`.scan/<date>.search.json`, so a second run the same day, to try a changed filter, costs nothing.

GitHub runs it every Monday (`.github/workflows/scan.yml`) and opens an issue labelled
`scan` with the list. Run it by hand from the Actions tab at any time.

## How it decides what to list

`data/scan.yaml` holds the queries and the hosts never worth listing (social sites, app stores,
analysts, consumer chat apps). For each query the scan takes the search results, reads each result
page and notes every site it links to. A site scores two points each time it is itself a search
result, and one point for each other site whose pages link to it.

It drops a site when a record already names it (as its `url` or in its `sources`), when
`data/screened.yaml` rejects it, when `scan.yaml` ignores it, or when it is on the trade press list.
The rest, best first, are the candidates. A candidate whose title or link text carries a record's
name is flagged in the last column: it may be a known tool on a second domain.

## Judging the list

Most rows are not tools: blogs, agencies and listicles rank well because they write about tools.
Work down from the top and stop when the rows stop being plausible. For each one:

1. Open the site and test it against "What belongs here" in `CONTRIBUTING.md`.
2. If it is a tool that passes, add `data/tools/<id>.yaml` as `CONTRIBUTING.md` describes, with a
   source for every value.
3. If it is a tool that fails, or a candidate you will see again, add it to `data/screened.yaml`:

   ```yaml
   - name: Example
     url: https://example.com
     decision: rejected   # or deferred
     reason: a code review add-on for one IDE, not an AI-native product
     date: 2026-10-22
   ```

4. If it is not a tool at all (a blog, an agency, a directory) and keeps coming back, add its host
   to `ignore_hosts` in `data/scan.yaml`.
5. If it is a known tool on another domain (the flagged rows), add that domain as a source on the
   existing record, or ignore it.

Deferred entries are listed at the end of every scan, marked when the scan saw them again. Look at
those first: early access may have opened since.

Open one pull request for the scan's additions and run `pnpm check` before you push.
