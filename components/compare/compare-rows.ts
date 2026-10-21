import { FACTS } from "@/components/tool/facts";
import type { Tool } from "@/lib/types";

export interface CompareRow {
  key: string;
  label: string;
  kind: "coverage" | "fact";
  /** One value per column. null while that column's record is not loaded. */
  values: (string | null)[];
  /** True only when every record is loaded and at least two values disagree. */
  differs: boolean;
}

const normalize = (value: string) => value.trim().toLowerCase();

function build(key: string, label: string, kind: CompareRow["kind"], values: (string | null)[]): CompareRow {
  const loaded = values.filter((v): v is string => v !== null);
  const complete = loaded.length === values.length && values.length >= 2;
  return {
    key,
    label,
    kind,
    values,
    differs: complete && new Set(loaded.map(normalize)).size > 1,
  };
}

const coverageSignature = (tool: Tool) => `${[...tool.phases].sort().join(",")}|${tool.primaryPhase ?? ""}`;

/**
 * The phase coverage row first, then one row per fact in the same order as the tool detail.
 * "Not published" is an ordinary value here, so a known value against it counts as a difference.
 */
export function buildRows(tools: (Tool | null)[]): CompareRow[] {
  return [
    build("coverage", "Phase coverage", "coverage", tools.map((t) => (t ? coverageSignature(t) : null))),
    ...FACTS.map((fact) => build(fact.field, fact.label, "fact", tools.map((t) => (t ? fact.value(t) : null)))),
  ];
}
