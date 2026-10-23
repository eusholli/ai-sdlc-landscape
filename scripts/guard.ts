// The data-layer guard. Run after every v0 step and in CI: `npx tsx scripts/guard.ts [base]`.
// Fails when generated code touched a locked file, pulled the full dataset into a client bundle,
// or dropped a dependency. `base` is the git ref to compare against (default HEAD).
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// The lock binds v0 only. People edit data/tools/ and scripts/ by hand as normal work; v0 must not.
export const LOCKED = [
  "data/",
  "lib/data.ts",
  "lib/types.ts",
  "lib/filters.ts",
  "lib/format.ts",
  "components/logo.tsx",
  "lib/site.ts",
  "lib/request-advice.ts",
  "lib/llms.ts",
  "lib/jsonld.ts",
  "lib/feed.ts",
  "lib/badge.ts",
  "lib/digest.ts",
  "app/llms.txt/",
  "app/llms-full.txt/",
  "app/schema/",
  "app/changes.xml/",
  "app/badge/",
  "scripts/",
  "tests/",
  "docs/design-brief.md",
  "docs/v0-prompts.md",
];

export const isLocked = (path: string) => LOCKED.some((p) => (p.endsWith("/") ? path.startsWith(p) : path === p));

const git = (...args: string[]) => execFileSync("git", args, { encoding: "utf8" });

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(name)) out.push(p);
  }
  return out;
}

export function guard(base = "HEAD"): string[] {
  const problems: string[] = [];

  // 1. Locked files unchanged against the base (tracked edits plus untracked additions).
  const changed = [
    ...git("diff", "--name-only", base).split("\n"),
    ...git("ls-files", "--others", "--exclude-standard").split("\n"),
  ].filter(Boolean);
  for (const f of changed) if (isLocked(f)) problems.push(`locked file changed: ${f}`);

  // 2. No client component reaches the full dataset.
  for (const f of ["app", "components", "lib", "hooks"].flatMap((d) => { try { return walk(d); } catch { return []; } })) {
    const src = readFileSync(f, "utf8");
    if (!/^\s*["']use client["']/.test(src)) continue;
    if (/from\s+["'](@\/data\/landscape\.json|.*\/data\/landscape\.json|@\/lib\/data)["']/.test(src)) {
      problems.push(`client component imports the full dataset: ${f}`);
    }
  }

  // 3. No dependency removed.
  try {
    const before = JSON.parse(git("show", `${base}:package.json`));
    const after = JSON.parse(readFileSync("package.json", "utf8"));
    for (const key of ["dependencies", "devDependencies"] as const) {
      for (const dep of Object.keys(before[key] ?? {})) {
        const now = { ...after.dependencies, ...after.devDependencies };
        if (!(dep in now)) problems.push(`dependency removed: ${dep}`);
      }
    }
  } catch {
    // no package.json at base (first commit): nothing to compare
  }

  return problems;
}

if (process.argv[1]?.endsWith("guard.ts")) {
  const problems = guard(process.argv[2]);
  if (problems.length) {
    console.error(problems.map((p) => `GUARD: ${p}`).join("\n"));
    process.exit(1);
  }
  console.log("guard: ok");
}
