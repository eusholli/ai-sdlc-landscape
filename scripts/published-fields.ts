// The figures a data post quotes: for each field, how many tool records carry a published value,
// overall and for each phase. A post names the data date it read, so anyone can rerun this at
// that commit and get the same table.
//
//   pnpm blog:fields             # every field, overall, and how many records hold all or none of
//                                 # an entry price, named customers and a compliance claim
//   pnpm blog:fields entry_price # one field, by primary phase
import raw from "@/data/landscape.json";

type Node = Record<string, unknown> & { kind: string; primary_phase: string | null };
const tools = (raw.nodes as unknown as Node[]).filter((n) => n.kind === "tool");
const published = (v: unknown) => v != null && v !== "unknown" && v !== "" && !(Array.isArray(v) && !v.length);
const pct = (n: number, of: number) => `${Math.round((100 * n) / of)}%`;

const FIELDS = [
  "summary", "pricing_model", "entry_price", "customers", "traction", "last_round", "deployment",
  "compliance", "models", "open_source", "repo", "founded", "funding_total",
];

console.log(`Data as of ${raw.generated}, ${tools.length} tool records.\n`);
const field = process.argv[2];
if (field) {
  console.log(`| Primary phase | Records | With ${field} |\n|---|---|---|`);
  const phases = [...raw.phases.map((p) => p.id), null];
  for (const p of phases) {
    const rows = tools.filter((t) => (t.primary_phase ?? null) === p);
    if (!rows.length) continue;
    const n = rows.filter((t) => published(t[field])).length;
    console.log(`| ${p ?? "no single phase"} | ${rows.length} | ${n} (${pct(n, rows.length)}) |`);
  }
} else {
  console.log("| Field | Records with a published value |\n|---|---|");
  for (const f of FIELDS) {
    const n = tools.filter((t) => published(t[f])).length;
    console.log(`| ${f} | ${n} of ${tools.length} (${pct(n, tools.length)}) |`);
  }
  const buyer = ["entry_price", "customers", "compliance"];
  const held = tools.map((t) => buyer.filter((f) => published(t[f])).length);
  console.log(`\nOf ${buyer.join(", ")}: all three in ${held.filter((n) => n === 3).length} records, none in ${held.filter((n) => n === 0).length}.`);
}
