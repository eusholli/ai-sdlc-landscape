// The JSON Schema for one record in data/tools/<id>.yaml, served at /schema/tool.json. Built from
// the same field lists and relation types that scripts/build-data.ts checks, so the two cannot
// drift. The schema covers shape only; the rules it cannot say (a value needs a source, an
// acquisition needs a Tier A or B source) stay in the build.
import { FIELDS_JUDGED, FIELDS_PLACEMENT, FIELDS_SOURCED, REL_TYPES } from "./build-data";

interface PhaseFile { phases: { id: string }[]; layers: { id: string }[]; segments: { id: string }[] }

const text = { type: "string" };
const textOrList = { oneOf: [text, { type: "array", items: text }] };

export function toolSchema(phases: PhaseFile, id: string) {
  const phaseIds = phases.phases.map((p) => p.id);
  const props: Record<string, unknown> = {
    id: { type: "string", pattern: "^[\\w.-]+$", description: "Matches the file name, without .yaml." },
    name: text,
    company: text,
    url: { type: "string", format: "uri", description: "The tool's own website." },
    layer: { enum: phases.layers.map((l) => l.id), description: "Set for cross-cutting nodes instead of a primary phase. `model` is a model provider, `systems` a platform tools integrate with." },
    primary_phase: { enum: phaseIds },
    phases: { type: "array", items: { enum: phaseIds } },
    segment: { enum: phases.segments.map((s) => s.id), description: "Worked out from phases when left out." },
  };
  for (const k of FIELDS_JUDGED) props[k] = { ...textOrList, description: "A judgement from the published facts; needs no source." };
  for (const k of FIELDS_SOURCED) props[k] = { description: "Needs a sources entry for this field." };
  props.summary = { type: "string", description: "The vendor's own one-line claim, quoted." };
  props.founded = { type: "integer" };
  props.open_source = { type: "boolean" };
  props.repo = {
    type: "string", pattern: "^https://github\\.com/[\\w.-]+/[\\w.-]+/?$",
    description: "The vendor's main GitHub repository, sourced to a vendor page that links to it. Required when open_source is true.",
  };
  props.relations = {
    type: "array",
    items: {
      type: "object",
      required: ["type", "to"],
      additionalProperties: false,
      properties: {
        type: { enum: [...REL_TYPES] },
        to: { type: "string", pattern: "^[\\w.-]+$", description: "A record id (a tool, model provider or platform), or a key in data/externals.yaml." },
        sources: { type: "array", items: { type: "string", format: "uri" } },
      },
    },
  };
  props.sources = {
    type: "array",
    items: {
      type: "object",
      required: ["field", "url", "retrieved"],
      additionalProperties: false,
      properties: {
        field: { enum: [...FIELDS_SOURCED, "relations", "phases"] },
        url: { type: "string", format: "uri", pattern: "^https?://" },
        retrieved: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
      },
    },
  };
  const order = [...FIELDS_PLACEMENT, ...FIELDS_JUDGED, ...FIELDS_SOURCED, "relations", "sources"];
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: id,
    title: "AI SDLC Landscape tool record",
    description: "One file in data/tools/. Every value with a fact in it needs a public source. See CONTRIBUTING.md.",
    type: "object",
    required: ["id", "name", "company", "url"],
    additionalProperties: false,
    properties: Object.fromEntries(order.map((k) => [k, props[k]])),
  };
}
