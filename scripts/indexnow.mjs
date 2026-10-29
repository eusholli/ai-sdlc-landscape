// IndexNow on deploy: submit only the URLs a production deploy changed.
//
// Copied into a site repo as scripts/indexnow.mjs by site-ops launch mode. Plain Node 20+,
// no dependencies. Run by .github/workflows/indexnow.yml when the host posts a successful
// commit status for a deploy, never on push: a push fires before the deploy lands.
//
// It finds the last earlier commit on the production branch whose status in the same
// context succeeded, diffs it against this one, maps each changed file to public URLs
// through indexnow.config.json, and POSTs the set once to api.indexnow.org, which shares
// it with every participating engine (Bing, Yandex, Seznam, Naver, Yep). A deploy that
// maps to no URL submits nothing.
//
// indexnow.config.json:
//   { "origin": "https://example.org", "key": "<hex key>", "branch": "main",
//     "rules": [ { "match": "^data/tools/([^/]+)\\.yaml$", "urls": ["/tools/$1"] },
//                { "match": "^data/", "urls": ["/", "/changes/{month}"] } ] }
// "$1".."$9" take regex groups; "{month}" is the current UTC YYYY-MM. "branch" defaults to main.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const cfg = JSON.parse(readFileSync("indexnow.config.json", "utf8"));
const branch = cfg.branch ?? "main";
const { GITHUB_TOKEN, GITHUB_REPOSITORY, DEPLOY_SHA, STATUS_CONTEXT } = process.env;
const git = (...args) => execFileSync("git", args, { encoding: "utf8" });

// The host posts the same status context for preview deploys, so only a commit on the
// production branch counts as a production deploy.
try {
  git("merge-base", "--is-ancestor", DEPLOY_SHA, `origin/${branch}`);
} catch {
  console.log(`indexnow: ${DEPLOY_SHA.slice(0, 7)} is not on ${branch}; a preview deploy, nothing submitted`);
  process.exit(0);
}

async function deployed(sha) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}/commits/${sha}/status`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" },
  });
  const body = await res.json();
  if (!res.ok || !Array.isArray(body.statuses)) {
    console.log(`indexnow: status lookup for ${sha.slice(0, 7)} failed: HTTP ${res.status} ${body.message ?? ""}`);
    return false;
  }
  return body.statuses.some((s) => s.context === STATUS_CONTEXT && s.state === "success");
}

async function previousDeploySha() {
  const earlier = git("rev-list", "--first-parent", "-n", "30", `${DEPLOY_SHA}~1`).split("\n").filter(Boolean);
  for (const sha of earlier) if (await deployed(sha)) return sha;
  return null;
}

const prev = await previousDeploySha();
if (!prev) {
  console.log("indexnow: no earlier successful deploy in the last 30 commits; nothing submitted");
  process.exit(0);
}
const files = git("diff", "--name-only", `${prev}..${DEPLOY_SHA}`).split("\n").filter(Boolean);
const month = new Date().toISOString().slice(0, 7);
const urls = new Set();
for (const f of files) {
  for (const rule of cfg.rules) {
    const m = f.match(new RegExp(rule.match));
    if (!m) continue;
    for (const u of rule.urls) {
      const path = u.replace(/\$(\d)/g, (_, i) => m[Number(i)] ?? "").replace("{month}", month);
      urls.add(new URL(path, cfg.origin).href);
    }
  }
}
console.log(`indexnow: ${files.length} changed file(s) ${prev.slice(0, 7)}..${DEPLOY_SHA.slice(0, 7)} -> ${urls.size} URL(s)`);
if (urls.size === 0) process.exit(0);

const host = new URL(cfg.origin).host;
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host,
    key: cfg.key,
    keyLocation: `${cfg.origin}/${cfg.key}.txt`,
    urlList: [...urls].slice(0, 10000),
  }),
});
console.log(`indexnow: HTTP ${res.status}`);
for (const u of urls) console.log(`  ${u}`);
process.exit(res.status === 200 || res.status === 202 ? 0 : 1);
