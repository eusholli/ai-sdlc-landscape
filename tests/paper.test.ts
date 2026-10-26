// The thesis loader: its glossary, the anchors on glossary rows, and the JSON-LD built from them.
// Uses a fixture paper, never content/ownership.md.
import { describe, expect, it } from "vitest";
import { paperJsonLd } from "@/lib/jsonld";
import { KEY_TERMS, keyTerms, renderPaper } from "@/lib/paper";
import { SITE_URL } from "@/lib/site";

const FIXTURE = `---
title: "A fixture paper"
author: Fixture Author
role: tester
version: "Draft 1"
date: 2026-01-02
---

## 1. Terms used early

| Term | Meaning |
| --- | --- |
| Software factory | A row outside the glossary, which gets no anchor |

## Appendix H. Glossary

| Term | Definition |
| --- | --- |
| Software ownership | The *capacity* to answer for software |
| Software factory | The organization that changes the product |
| Factory engineering | Work on the factory |
| Error rate | Written \\(\\varepsilon\\) in the model |

## References

| Not | Glossary |
| --- | --- |
| Software ownership | Another table |
`;

describe("paper glossary", () => {
  const paper = renderPaper(FIXTURE);

  it("reads every row of the glossary table as plain text", () => {
    expect(paper.glossary.map((g) => g.term)).toEqual([
      "Software ownership",
      "Software factory",
      "Factory engineering",
      "Error rate",
    ]);
    expect(paper.glossary[0].definition).toBe("The capacity to answer for software");
    expect(paper.glossary[3].definition).toBe("Written ε in the model");
    expect(paper.glossaryId).toBe("appendix-h-glossary");
  });

  it("anchors each glossary row once, and only inside the glossary", () => {
    for (const g of paper.glossary) {
      expect(paper.html.split(`id="${g.id}"`)).toHaveLength(2);
    }
    const early = paper.html.slice(0, paper.html.indexOf('id="appendix-h-glossary"'));
    expect(early).not.toContain("term-");
  });

  it("finds the key terms, and fails when the glossary drops one", () => {
    expect(keyTerms(paper).map((t) => t.term)).toEqual([...KEY_TERMS]);
    const without = renderPaper(FIXTURE.replace("| Factory engineering | Work on the factory |\n", ""));
    expect(() => keyTerms(without)).toThrow(/Factory engineering/);
  });

  it("publishes the glossary as a DefinedTermSet the article is about", () => {
    const ld = paperJsonLd(paper) as { "@graph": Record<string, unknown>[] };
    const [article, set] = ld["@graph"];
    const url = `${SITE_URL}/ownership`;
    expect(article["@type"]).toBe("ScholarlyArticle");
    expect(article.about).toEqual(keyTerms(paper).map((t) => ({ "@id": `${url}#${t.id}` })));
    expect(set["@type"]).toBe("DefinedTermSet");
    expect(set.url).toBe(`${url}#appendix-h-glossary`);
    const terms = set.hasDefinedTerm as { name: string; url: string }[];
    expect(terms.map((t) => t.name)).toEqual(paper.glossary.map((g) => g.term));
    expect(terms[0].url).toBe(`${url}#term-software-ownership`);
  });

  it("falls back to a plain article when the paper has no glossary", () => {
    const bare = renderPaper(FIXTURE.slice(0, FIXTURE.indexOf("## Appendix H")));
    expect(bare.glossary).toEqual([]);
    expect(paperJsonLd(bare)).toMatchObject({ "@type": "ScholarlyArticle" });
  });
});
