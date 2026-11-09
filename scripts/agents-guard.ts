// The agent-setup guard, run by `pnpm check` through scripts/guard.ts.
// Keeps the repo on the cross-agent standards: rules in AGENTS.md, skills in .agents/skills/.
// CLAUDE.md may only import AGENTS.md, and .claude/ may only hold the skills symlink, since
// Claude Code and Cline read .claude/skills but not .agents/skills.
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

/** The whole of CLAUDE.md, apart from blank lines and Markdown comments. */
export const CLAUDE_SHIM = "@AGENTS.md";

/** Tool-specific instruction files that would split the rules away from AGENTS.md. */
const FOREIGN = [
  "GEMINI.md",
  ".cursorrules",
  ".cursor/rules",
  ".clinerules",
  ".windsurfrules",
  ".github/copilot-instructions.md",
  ".claude/CLAUDE.md",
];

/** Untracked local files Claude Code may write into .claude/. */
const CLAUDE_LOCAL = new Set(["skills", "settings.local.json"]);

const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Checks one SKILL.md against the Agent Skills spec (agentskills.io/specification). */
export function checkSkill(dir: string, src: string): string[] {
  const where = `.agents/skills/${dir}/SKILL.md`;
  const m = src.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return [`${where}: missing frontmatter`];
  let fm: Record<string, unknown>;
  try {
    fm = (parse(m[1]) ?? {}) as Record<string, unknown>;
  } catch {
    return [`${where}: frontmatter is not valid YAML`];
  }
  const problems: string[] = [];
  const { name, description } = fm;
  if (typeof name !== "string" || name.length < 1 || name.length > 64 || !NAME.test(name)) {
    problems.push(`${where}: name must be 1-64 lowercase letters, digits and single hyphens`);
  } else if (name !== dir) {
    problems.push(`${where}: name "${name}" must match the folder "${dir}"`);
  }
  if (typeof description !== "string" || description.trim().length < 1 || description.length > 1024) {
    problems.push(`${where}: description must be 1-1024 characters`);
  }
  return problems;
}

export function agentsGuard(root: string): string[] {
  const problems: string[] = [];
  const at = (p: string) => join(root, p);

  if (!existsSync(at("AGENTS.md"))) problems.push("AGENTS.md is missing: it holds every rule");

  if (existsSync(at("CLAUDE.md"))) {
    const body = readFileSync(at("CLAUDE.md"), "utf8")
      .replace(/<!--[\s\S]*?-->/g, "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (body.length !== 1 || body[0] !== CLAUDE_SHIM) {
      problems.push(`CLAUDE.md may only hold "${CLAUDE_SHIM}" (and comments): put rules in AGENTS.md`);
    }
  }

  for (const f of FOREIGN) {
    if (existsSync(at(f))) problems.push(`${f}: put agent rules in AGENTS.md instead`);
  }

  const link = at(".claude/skills");
  let isLink = false;
  try {
    isLink = lstatSync(link).isSymbolicLink();
  } catch {}
  if (!isLink || readlinkSync(link).replace(/\/$/, "") !== "../.agents/skills") {
    problems.push(".claude/skills must be a symlink to ../.agents/skills");
  }
  if (existsSync(at(".claude"))) {
    for (const name of readdirSync(at(".claude"))) {
      if (!CLAUDE_LOCAL.has(name)) problems.push(`.claude/${name}: .claude/ holds only the skills symlink`);
    }
  }

  const skills = at(".agents/skills");
  if (!existsSync(skills)) {
    problems.push(".agents/skills is missing");
  } else {
    for (const dir of readdirSync(skills)) {
      if (!lstatSync(join(skills, dir)).isDirectory()) continue;
      const file = join(skills, dir, "SKILL.md");
      if (!existsSync(file)) problems.push(`.agents/skills/${dir}: no SKILL.md`);
      else problems.push(...checkSkill(dir, readFileSync(file, "utf8")));
    }
  }
  return problems;
}
