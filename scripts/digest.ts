// Write the monthly digest: a short post to share and a longer Markdown version, from the data.
//
//   pnpm digest            # last month
//   pnpm digest 2026-10    # a given month
//
// Writes .digest/<YYYY-MM>.md (gitignored). Nothing is posted anywhere: edit it, then share it.
import { mkdirSync, writeFileSync } from "node:fs";
import { digest, digestMarkdown, digestPost } from "@/lib/digest";

const arg = process.argv[2];
if (arg && !/^\d{4}-\d{2}$/.test(arg)) {
  console.error("usage: pnpm digest [YYYY-MM]");
  process.exit(1);
}
const now = new Date();
const month = arg ?? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
const d = digest(month);
mkdirSync(".digest", { recursive: true });
const path = `.digest/${month}.md`;
writeFileSync(path, ["<!-- The short post -->", "", digestPost(d), "<!-- The long version -->", "", digestMarkdown(d)].join("\n"));
console.log(`wrote ${path}`);
