// The machine-readable surfaces and the request advice. Run `pnpm data` first: lib/data reads
// the generated landscape.json.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import phases from "@/data/phases.json";
import { allTools, getLandscape } from "@/lib/data";
import { datasetJsonLd, jsonLdText, toolJsonLd } from "@/lib/jsonld";
import { llmsFullTxt, llmsTxt } from "@/lib/llms";
import { REQUEST_ADVICE, REQUEST_INTRO, REQUEST_OUTRO } from "@/lib/request-advice";
import { DATA_LICENCE, REQUEST_URL, requestUrl, SITE_URL } from "@/lib/site";
import { FIELDS_JUDGED, FIELDS_PLACEMENT, FIELDS_SOURCED, REL_TYPES } from "@/scripts/build-data";
import { toolSchema } from "@/scripts/schema";

const FIXTURE = parse(`id: fixture-tool
name: Fixture Tool
company: Fixture Co
url: https://fixture.example
primary_phase: plan
summary: A tool that exists only in tests.
relations:
  - {type: integrates_with, to: other-tool, sources: [https://fixture.example/integrations]}
sources:
  - {field: summary, url: https://fixture.example/, retrieved: 2026-01-02}
`) as Record<string, unknown>;

describe("record schema", () => {
  const schema = toolSchema(phases, "https://example.test/schema/tool.json");

  it("names exactly the fields the build accepts", () => {
    expect(Object.keys(schema.properties).sort()).toEqual(
      [...FIELDS_PLACEMENT, ...FIELDS_JUDGED, ...FIELDS_SOURCED, "relations", "sources"].sort());
    expect(schema.additionalProperties).toBe(false);
  });

  it("takes its enums from phases.json and REL_TYPES", () => {
    const p = schema.properties as Record<string, { enum?: string[]; items?: { properties: Record<string, { enum?: string[] }> } }>;
    expect(p.primary_phase.enum).toEqual(phases.phases.map((x) => x.id));
    expect(p.relations.items!.properties.type.enum).toEqual([...REL_TYPES]);
  });

  it("covers every key a fixture record uses", () => {
    for (const k of Object.keys(FIXTURE)) expect(schema.properties).toHaveProperty(k);
  });
});

describe("request advice", () => {
  const plain = (s: string) => s.replace(/\*\*/g, "").replace(/\s+/g, " ");

  it("is the same in the issue form, CONTRIBUTING.md and the site", () => {
    const form = parse(readFileSync(".github/ISSUE_TEMPLATE/request.yml", "utf8")) as { body: { attributes: { value?: string } }[] };
    const contributing = plain(readFileSync("CONTRIBUTING.md", "utf8"));
    const formText = plain(form.body.map((b) => b.attributes.value ?? "").join("\n"));
    for (const text of [formText, contributing]) {
      expect(text).toContain(REQUEST_INTRO);
      for (const a of REQUEST_ADVICE) expect(text).toContain(`${a.title} ${a.body}`);
      expect(text).toContain(REQUEST_OUTRO);
    }
  });

  it("prefills the form title for one tool", () => {
    expect(requestUrl()).toBe(REQUEST_URL);
    expect(requestUrl("A & B")).toBe(`${REQUEST_URL}&title=A%20%26%20B%3A%20`);
  });
});

describe("llms.txt", () => {
  it("points at every machine-readable surface and says how to ask for a change", () => {
    const txt = llmsTxt();
    for (const path of ["/llms-full.txt", "/landscape.json", "/schema/tool.json", "/data/tools/"]) {
      expect(txt).toContain(`${SITE_URL}${path}`);
    }
    expect(txt).toContain(REQUEST_URL);
    expect(txt).toContain("gh issue create --repo");
    expect(txt).toContain(REQUEST_ADVICE[0].body);
  });

  it("holds a section for every record in the full file", () => {
    const full = llmsFullTxt();
    for (const t of allTools()) expect(full).toContain(`- id: \`${t.id}\``);
    expect(full).not.toContain(": unknown\n");
  });
});

describe("dataset metadata", () => {
  it("states its licence, schema and source", () => {
    const l = getLandscape();
    expect(l.licence).toBe(DATA_LICENCE);
    expect(l.schema).toBe(`${SITE_URL}/schema/tool.json`);
    expect(Array.isArray(l.contributors)).toBe(true);
    expect(datasetJsonLd().license).toBe(l.licenceUrl);
  });

  it("escapes JSON-LD so a value cannot close its script tag", () => {
    const t = { ...allTools()[0], summary: "</script><script>alert(1)</script>" };
    const out = jsonLdText(toolJsonLd(t));
    expect(out).not.toContain("</script>");
    expect(JSON.parse(out).description).toBe(t.summary);
  });
});
