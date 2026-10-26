// The canonical origin that the sitemap, share tags, llms text and JSON-LD all build on.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const origin = async (env: Record<string, string | undefined>) => {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return (await import("@/lib/site")).SITE_URL;
};

describe("SITE_URL", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is the production domain on Vercel, previews included", async () => {
    const { SITE_DOMAIN } = await import("@/lib/site");
    expect(await origin({ NEXT_PUBLIC_SITE_URL: undefined, VERCEL: "1" })).toBe(`https://${SITE_DOMAIN}`);
  });

  it("takes NEXT_PUBLIC_SITE_URL first, without a trailing slash", async () => {
    expect(await origin({ NEXT_PUBLIC_SITE_URL: "https://fork.example/", VERCEL: "1" })).toBe("https://fork.example");
  });

  it("is localhost off Vercel", async () => {
    expect(await origin({ NEXT_PUBLIC_SITE_URL: undefined, VERCEL: undefined })).toBe("http://localhost:3000");
  });
});

describe("canonical links", () => {
  // Set per page, never in a layout: a layout's canonical is inherited, so every page would claim
  // to be the home page.
  const pages = (readdirSync("app", { recursive: true }) as string[]).filter((f) => f.endsWith("page.tsx"));

  it.each(pages)("%s sets its own", (page) => {
    expect(readFileSync(join("app", page), "utf8")).toMatch(/alternates: \{\s*canonical: /);
  });

  it("is never set in a layout", () => {
    const layouts = (readdirSync("app", { recursive: true }) as string[]).filter((f) => f.endsWith("layout.tsx"));
    for (const l of layouts) expect(readFileSync(join("app", l), "utf8")).not.toMatch(/canonical/);
  });
});
