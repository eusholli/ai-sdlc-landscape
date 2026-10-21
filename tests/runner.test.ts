import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { pull } from "../scripts/v0-run";

describe("v0 runner pull", () => {
  const home = process.cwd();
  beforeEach(() => {
    process.chdir(mkdtempSync(join(tmpdir(), "pull-")));
    mkdirSync("app", { recursive: true });
    mkdirSync("lib", { recursive: true });
    writeFileSync("app/page.tsx", "old page");
    writeFileSync("lib/data.ts", "ours");
  });
  afterEach(() => process.chdir(home));

  it("writes new files, deletes files v0 dropped, and never touches locked ones", () => {
    const changed = pull(
      [
        { name: "app/(site)/page.tsx", content: "new page" },
        { name: "/lib/data.ts", content: "v0 rewrite" },
      ],
      ["app/page.tsx", "lib/data.ts", "lib/types.ts"],
    );
    expect(readFileSync("app/(site)/page.tsx", "utf8")).toBe("new page");
    expect(existsSync("app/page.tsx")).toBe(false);
    expect(readFileSync("lib/data.ts", "utf8")).toBe("ours");
    expect(changed.sort()).toEqual(["-app/page.tsx", "app/(site)/page.tsx"]);
  });
});
