import { describe, expect, it } from "vitest";
import {
  choiceCoverage, connectionsFor, gapFillers, phaseState, stackCoverage, stackGaps, unlinkedChoices, unlinkedNote, type ConnNode,
} from "@/lib/connections";
import type { Relation } from "@/lib/types";

// A fixture of our own: tests never depend on a real record.
const node = (id: string, primaryPhase: ConnNode["primaryPhase"], extra: Partial<ConnNode> = {}): ConnNode =>
  ({ id, kind: "tool", primaryPhase, phases: [], layer: null, ...extra });
const NODES: ConnNode[] = [
  node("builder", "design"),
  node("editor", "code", { phases: ["review"] }),
  node("ci", "cicd"),
  node("scanner", "security"),
  node("rival", "design"),
  node("infra", null, { layer: "agent-infra" }),
  node("model", null, { kind: "model", layer: "model" }),
  node("lonely", "plan"),
];
const rel = (from: string, type: Relation["type"], to: string, sources = ["https://example.com/" + from]): Relation =>
  ({ from, type, to, sources });
const RELS: Relation[] = [
  rel("builder", "integrates_with", "editor"),
  rel("editor", "integrates_with", "ci", ["https://a.example", "https://b.example"]),
  rel("scanner", "partners_with", "editor"),
  rel("builder", "competes_with", "rival"),
  rel("builder", "built_on_model", "model"),
  rel("builder", "integrates_with", "github"), // an external: never a step
  rel("ci", "integrates_with", "github"),
  rel("editor", "ships_inside", "infra"),
];
const ORDER = ["plan", "design", "code", "review", "security", "cicd", "agent-infra"] as const;

describe("connectionsFor", () => {
  const groups = connectionsFor("builder", NODES, RELS, [...ORDER]);
  const byGroup = Object.fromEntries(groups.map((g) => [g.group, g]));

  it("lists a direct link under the linked tool's primary phase, with its relation", () => {
    expect(byGroup.code.direct.map((c) => c.tool)).toEqual(["editor"]);
    expect(byGroup.code.direct[0].paths[0]).toEqual({ via: null, steps: [RELS[0]] });
  });

  it("finds two-step paths through another tool, each step as recorded", () => {
    expect(byGroup.cicd.twoStep.map((c) => c.tool)).toEqual(["ci"]);
    expect(byGroup.cicd.twoStep[0].paths[0]).toEqual({ via: "editor", steps: [RELS[0], RELS[1]] });
    // The relation runs scanner -> editor, so it is read in both directions.
    expect(byGroup.security.twoStep[0].paths[0].via).toBe("editor");
  });

  it("puts agent infrastructure in its own group", () => {
    expect(byGroup["agent-infra"].twoStep.map((c) => c.tool)).toEqual(["infra"]);
  });

  it("never links through an external, a model or a competitor", () => {
    const all = groups.flatMap((g) => [...g.direct, ...g.twoStep]).map((c) => c.tool);
    expect(all).not.toContain("rival");
    expect(all).not.toContain("model");
    expect(all).not.toContain("github");
    // builder and ci both integrate with github, which is no path between them.
    expect(byGroup.cicd.direct).toEqual([]);
  });

  it("leaves out groups with nothing and the tool itself", () => {
    expect(groups.map((g) => g.group)).toEqual(["code", "security", "cicd", "agent-infra"]);
  });

  it("returns nothing for a tool with no relations", () => {
    expect(connectionsFor("lonely", NODES, RELS, [...ORDER])).toEqual([]);
  });
});

describe("stackCoverage and stackGaps", () => {
  const phases = ["plan", "design", "code", "review"] as const;

  it("lists each phase with the stack tools that cover it, primary or not", () => {
    expect(stackCoverage(["editor", "builder"], NODES, [...phases])).toEqual([
      { phase: "plan", tools: [] },
      { phase: "design", tools: ["builder"] },
      { phase: "code", tools: ["editor"] },
      { phase: "review", tools: ["editor"] },
    ]);
  });

  it("ignores unknown ids and names the empty phases", () => {
    expect(stackGaps(["builder", "no-such-tool"], NODES, [...phases])).toEqual(["plan", "code", "review"]);
    expect(stackGaps([], NODES, [...phases])).toEqual([...phases]);
  });
});

describe("gapFillers", () => {
  it("names tools covering an empty phase that link straight to the stack", () => {
    const out = gapFillers(["builder"], ["code", "cicd", "plan"], NODES, RELS);
    expect(out).toEqual([
      { phase: "code", tools: [{ tool: "editor", linkedTo: ["builder"] }] },
      { phase: "cicd", tools: [] },
      { phase: "plan", tools: [] },
    ]);
  });
  it("matches any phase a tool covers, not only its primary one", () => {
    expect(gapFillers(["builder"], ["review"], NODES, RELS)[0].tools.map((t) => t.tool)).toEqual(["editor"]);
  });
});

describe("choiceCoverage", () => {
  const phases = ["design", "code", "review", "cicd"] as const;

  it("keeps a phase open while tools are added to it from a suggestion", () => {
    const out = choiceCoverage(["builder"], ["editor"], NODES, RELS, [...phases]);
    expect(out.find((c) => c.phase === "code")).toEqual({
      phase: "code",
      tools: ["editor"],
      gap: true,
      suggested: [{ tool: "editor", linkedTo: ["builder"] }],
      added: ["editor"],
    });
    expect(out.find((c) => c.phase === "design")).toMatchObject({ tools: ["builder"], gap: false, suggested: [], added: [] });
  });

  it("closes the phase when the same tool is part of the stack", () => {
    const code = choiceCoverage(["builder", "editor"], [], NODES, RELS, [...phases]).find((c) => c.phase === "code");
    expect(code).toMatchObject({ tools: ["editor"], gap: false, added: [] });
  });

  it("works out suggestions from the stack only, not from the added tools", () => {
    const cicd = choiceCoverage(["builder"], ["editor"], NODES, RELS, [...phases]).find((c) => c.phase === "cicd");
    expect(cicd).toMatchObject({ gap: true, suggested: [] });
  });
});

describe("phaseState", () => {
  const phases = ["design", "code", "review", "cicd"] as const;
  const states = (stack: string[], added: string[]) =>
    choiceCoverage(stack, added, NODES, RELS, [...phases]).map((c) => [c.phase, phaseState(c)]);

  it("marks each phase covered, open or empty from the stack", () => {
    expect(states(["builder"], [])).toEqual([["design", "covered"], ["code", "open"], ["review", "open"], ["cicd", "empty"]]);
  });

  it("marks a phase filled by an added suggestion as via, in every phase the tool covers", () => {
    expect(states(["builder"], ["editor"])).toEqual([["design", "covered"], ["code", "via"], ["review", "via"], ["cicd", "empty"]]);
  });

  it("keeps a phase the stack covers as covered when an added tool covers it too", () => {
    const nodes = [...NODES, node("coder", "code")];
    const out = choiceCoverage(["builder", "coder"], ["editor"], nodes, RELS, [...phases]);
    expect(out.map(phaseState)).toEqual(["covered", "covered", "via", "empty"]);
    expect(out[1].tools).toEqual(["coder", "editor"]);
  });
});

describe("platforms", () => {
  // A code host two tools integrate with, and a tool that links to nothing but the host.
  const NODES_P: ConnNode[] = [
    ...NODES,
    node("host", null, { kind: "platform", layer: "systems", phases: ["review", "cicd"] }),
    node("deployer", "cicd"),
  ];
  const RELS_P: Relation[] = [...RELS, rel("builder", "integrates_with", "host"), rel("deployer", "integrates_with", "host")];
  const ORDER_P = [...ORDER, "systems"] as const;

  it("suggests a platform that covers an empty phase and links straight to the stack", () => {
    const out = gapFillers(["builder"], ["cicd"], NODES_P, RELS_P);
    expect(out[0].tools).toEqual([{ tool: "host", linkedTo: ["builder"] }]);
  });

  it("never links two tools through a shared platform", () => {
    expect(gapFillers(["deployer"], ["design"], NODES_P, RELS_P)[0].tools).toEqual([]);
    const all = connectionsFor("builder", NODES_P, RELS_P, [...ORDER_P]).flatMap((g) => [...g.direct, ...g.twoStep]);
    expect(all.map((c) => c.tool)).not.toContain("deployer");
    expect(all.flatMap((c) => c.paths.map((p) => p.via))).not.toContain("host");
  });

  it("lists a platform only as a direct link, in its own group", () => {
    const groups = connectionsFor("builder", NODES_P, RELS_P, [...ORDER_P]);
    expect(groups.find((g) => g.group === "systems")).toMatchObject({ direct: [{ tool: "host" }], twoStep: [] });
    // editor reaches host only through builder: no two-step path ends at a platform.
    const fromEditor = connectionsFor("editor", NODES_P, RELS_P, [...ORDER_P]);
    expect(fromEditor.find((g) => g.group === "systems")).toBeUndefined();
  });

  it("covers a platform's phases once it is added from a suggestion", () => {
    const cicd = choiceCoverage(["builder"], ["host"], NODES_P, RELS_P, ["design", "cicd"]).find((c) => c.phase === "cicd");
    expect(cicd).toMatchObject({ tools: ["host"], gap: true, added: ["host"] });
  });
});

describe("unlinkedChoices and unlinkedNote", () => {
  it("names the choices with no link to a tool or platform, ignoring externals and unknown ids", () => {
    // builder links to github only as an external besides its tool links; lonely links to nothing.
    const rels = [...RELS, rel("lonely", "integrates_with", "github")];
    expect(unlinkedChoices(["builder", "lonely", "no-such-tool"], NODES, rels)).toEqual(["lonely"]);
  });

  it("writes one line for one or several names, and nothing for none", () => {
    expect(unlinkedNote([])).toBeNull();
    expect(unlinkedNote(["A"])).toBe("A has no recorded link to another tool or platform on the map.");
    expect(unlinkedNote(["A", "B", "C"])).toBe("A, B and C have no recorded link to another tool or platform on the map.");
  });
});
