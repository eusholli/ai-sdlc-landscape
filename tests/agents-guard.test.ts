import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { agentsGuard, checkSkill } from "@/scripts/agents-guard";

const skill = (name: string, description = "Does a thing. Use when asked.") =>
  `---\nname: ${name}\ndescription: ${description}\n---\n\n# Body\n`;

let root: string;
const write = (p: string, s: string) => {
  mkdirSync(join(root, p, ".."), { recursive: true });
  writeFileSync(join(root, p), s);
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "agents-guard-"));
  write("AGENTS.md", "# Rules\n");
  write("CLAUDE.md", "<!-- a note -->\n@AGENTS.md\n");
  write(".agents/skills/fix-it/SKILL.md", skill("fix-it"));
  mkdirSync(join(root, ".claude"));
  symlinkSync("../.agents/skills", join(root, ".claude/skills"));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("agentsGuard", () => {
  it("passes the standard layout", () => {
    expect(agentsGuard(root)).toEqual([]);
  });

  it("passes without CLAUDE.md, and allows the local Claude settings file", () => {
    rmSync(join(root, "CLAUDE.md"));
    write(".claude/settings.local.json", "{}");
    expect(agentsGuard(root)).toEqual([]);
  });

  it("fails when AGENTS.md is missing", () => {
    rmSync(join(root, "AGENTS.md"));
    expect(agentsGuard(root)).toEqual([expect.stringContaining("AGENTS.md is missing")]);
  });

  it("fails when CLAUDE.md holds rules beside the import", () => {
    write("CLAUDE.md", "@AGENTS.md\n\n- Always use tabs.\n");
    expect(agentsGuard(root)).toEqual([expect.stringContaining("CLAUDE.md may only hold")]);
  });

  it("fails on a tool-specific instruction file", () => {
    write(".github/copilot-instructions.md", "rules\n");
    expect(agentsGuard(root)).toEqual([expect.stringContaining(".github/copilot-instructions.md")]);
  });

  it("fails when .claude/skills is a real folder, not the symlink", () => {
    rmSync(join(root, ".claude/skills"));
    write(".claude/skills/fix-it/SKILL.md", skill("fix-it"));
    expect(agentsGuard(root)).toEqual([expect.stringContaining("must be a symlink")]);
  });

  it("fails on anything else in .claude/", () => {
    write(".claude/agents/helper.md", "x\n");
    expect(agentsGuard(root)).toEqual([expect.stringContaining(".claude/agents")]);
  });

  it("fails on a skill folder with no SKILL.md", () => {
    mkdirSync(join(root, ".agents/skills/empty"));
    expect(agentsGuard(root)).toEqual([expect.stringContaining("empty: no SKILL.md")]);
  });
});

describe("checkSkill", () => {
  it("accepts a skill that meets the spec", () => {
    expect(checkSkill("fix-it", skill("fix-it"))).toEqual([]);
  });

  it("needs frontmatter", () => {
    expect(checkSkill("fix-it", "# No frontmatter\n")).toEqual([expect.stringContaining("missing frontmatter")]);
  });

  it("needs the name to match the folder", () => {
    expect(checkSkill("fix-it", skill("mend-it"))).toEqual([expect.stringContaining("must match the folder")]);
  });

  it.each(["Fix-It", "-fix", "fix-", "fix--it", "a".repeat(65)])("refuses the name %s", (name) => {
    expect(checkSkill(name, skill(name))).toEqual([expect.stringContaining("name must be")]);
  });

  it("needs a description of 1 to 1024 characters", () => {
    expect(checkSkill("fix-it", skill("fix-it", '""'))).toEqual([expect.stringContaining("description")]);
    expect(checkSkill("fix-it", skill("fix-it", "x".repeat(1025)))).toEqual([expect.stringContaining("description")]);
  });
});
