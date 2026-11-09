// The repo guard, run by `pnpm check`: `pnpm exec tsx scripts/guard.ts`.
// Fails when a "use client" file imports the full dataset, which would ship every record and
// source to the browser; client components get the lite projections as props instead. Also
// fails when the agent setup drifts from AGENTS.md and .agents/skills (scripts/agents-guard.ts).
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { agentsGuard } from "./agents-guard";

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(name)) out.push(p);
  }
  return out;
}

export function guard(): string[] {
  const problems: string[] = [];
  for (const f of ["app", "components", "lib", "hooks"].flatMap((d) => { try { return walk(d); } catch { return []; } })) {
    const src = readFileSync(f, "utf8");
    if (!/^\s*["']use client["']/.test(src)) continue;
    if (/from\s+["'](@\/data\/landscape\.json|.*\/data\/landscape\.json|@\/lib\/data)["']/.test(src)) {
      problems.push(`client component imports the full dataset: ${f}`);
    }
  }
  return problems;
}

if (process.argv[1]?.endsWith("/guard.ts")) {
  const problems = [...guard(), ...agentsGuard(process.cwd())];
  if (problems.length) {
    console.error(problems.map((p) => `GUARD: ${p}`).join("\n"));
    process.exit(1);
  }
  console.log("guard: ok");
}
