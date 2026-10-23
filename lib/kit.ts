// The evaluation kit: questions a buyer puts to an AI SDLC vendor. Client-safe: no data import.
import type { Tool } from "@/lib/types";

export type KitGroup = "data" | "continuity" | "pricing" | "integration" | "security";
/** The record field that may answer a question. Relations live beside the tools, not on one. */
export type KitField = keyof Tool | "relations";
export interface KitQuestion {
  id: string;
  group: KitGroup;
  text: string;
  /** The record field that answers the question outright, or null when none does. A related field is not an answer. */
  field: KitField | null;
  /** Why a buyer asks, in a sentence. */
  why: string;
  /** The published page behind the reason, or null when the reason is ours. */
  ref: { label: string; url: string } | null;
}

export const KIT_GROUPS: { id: KitGroup; title: string; blurb: string }[] = [
  { id: "data", title: "Data", blurb: "Where code and prompts go, who processes them and what is kept." },
  { id: "continuity", title: "Continuity", blurb: "What happens if the vendor, its owner or its model supplier changes." },
  { id: "pricing", title: "Pricing", blurb: "What it costs at your scale, beyond the seat." },
  { id: "integration", title: "Integration", blurb: "How it fits the tools you already run." },
  { id: "security", title: "Security", blurb: "Controls, assurance and what you can show an auditor." },
];

/** The field name a source row uses, for each field a question can name. */
export const SOURCE_FIELD: Partial<Record<KitField, string>> = {
  deployment: "deployment",
  models: "models",
  pricingModel: "pricing_model",
  status: "status",
  compliance: "compliance",
  openSource: "open_source",
  relations: "relations",
  customers: "customers",
};

const CURSOR = { label: "Cursor, privacy and data governance", url: "https://cursor.com/docs/enterprise/privacy-and-data-governance" };
const GITHUB = { label: "GitHub Docs, model hosting", url: "https://docs.github.com/en/copilot/reference/ai-models/model-hosting" };
const DX = { label: "DX, AI coding assistant pricing", url: "https://getdx.com/blog/ai-coding-assistant-pricing/" };
const SNYK = { label: "Snyk, GenAI coding security RFP template", url: "https://snyk.io/lp/genai-coding-security-rfp/" };
const TRUST = { label: "Stack Overflow Blog, closing the developer AI trust gap", url: "https://stackoverflow.blog/2026/02/18/closing-the-developer-ai-trust-gap/" };
const NEWSTACK = { label: "The New Stack, AI coding assistants: 12 dos and don'ts", url: "https://thenewstack.io/ai-coding-assistants-12-dos-and-donts/" };

export const KIT: KitQuestion[] = [
  { id: "data-providers", group: "data", field: "models", ref: CURSOR,
    text: "Which model providers and hosting providers process our code and prompts, model by model?",
    why: "One vendor documents that prompts and code context go to several outside model providers, and that its own models may add inference providers." },
  { id: "data-retention", group: "data", field: null, ref: GITHUB,
    text: "Does zero data retention apply to every model and every preview feature, or only some?",
    why: "One product's models run on several hosts, and retention terms and exceptions differ between them." },
  { id: "data-training", group: "data", field: null, ref: TRUST,
    text: "Is our code used to train any model, yours or a provider's, and where is that written down?",
    why: "Buyers name uncertainty about what models learn as a reason not to buy." },
  { id: "data-change", group: "data", field: null, ref: GITHUB,
    text: "What happens to our terms when a provider changes its own?",
    why: "A contract that spans several providers can change under the buyer without the vendor changing anything." },
  { id: "data-deploy", group: "data", field: "deployment", ref: TRUST,
    text: "Can the tool run in our cloud account, on premises or in a single tenant?",
    why: "Where code goes decides what a security team will sign." },

  { id: "cont-owner", group: "continuity", field: "status", ref: null,
    text: "Who owns the vendor today, and has it been acquired or announced a sale?",
    why: "A change of owner changes terms, roadmap and support. The market moves page lists the recorded ones." },
  { id: "cont-model-dep", group: "continuity", field: "models", ref: CURSOR,
    text: "Does the product depend on one model provider, and what happens if that supplier cuts access?",
    why: "Some tools route to several providers and some to one. Many vendors do not publish which." },
  { id: "cont-exit", group: "continuity", field: null, ref: null,
    text: "What can we export on exit: repository context, prompts, policy configuration, audit logs and usage history?",
    why: "We found no public standard for exit and portability terms of AI coding tools, so the answer has to come from the vendor." },
  { id: "cont-oss", group: "continuity", field: "openSource", ref: null,
    text: "Is any part open source, so we can keep running it if the vendor stops?",
    why: "Published source is a hedge against the vendor failing or being bought." },
  { id: "cont-customers", group: "continuity", field: "customers", ref: TRUST,
    text: "Which companies of our size use it in production, and will they talk to us?",
    why: "Teams revert to manual process when they do not trust a tool, so references from peers carry weight." },

  { id: "price-model", group: "pricing", field: "pricingModel", ref: DX,
    text: "Is pricing per seat, per usage, a subscription or a mix?",
    why: "Seat price alone understates cost: total cost can include token overages, premium model tiers, agentic compute and governance infrastructure." },
  { id: "price-overage", group: "pricing", field: null, ref: DX,
    text: "What triggers overage charges, and is there a cap we can set?",
    why: "The same analysis says overages can multiply the headline price for heavy agentic use." },
  { id: "price-tiers", group: "pricing", field: null, ref: DX,
    text: "Which models sit in premium tiers, and who decides which one a developer uses?",
    why: "Premium model tiering is a named cost driver." },
  { id: "price-baseline", group: "pricing", field: null, ref: DX,
    text: "What does it cost us per accepted change at today's usage, before we expand?",
    why: "The analysis recommends a measured baseline before rollout. We found no public benchmark for companies of 50 to 2,000 engineers that separates productivity gain from added review and governance cost." },

  { id: "integ-repo", group: "integration", field: "relations", ref: NEWSTACK,
    text: "Which source control, CI/CD and issue tracker does it connect to, and how?",
    why: "Evaluation advice is to prefer assistants that integrate with the repository and the other development tools." },
  { id: "integ-map", group: "integration", field: "relations", ref: null,
    text: "Which other tools on this map does it pair with, and which does it replace?",
    why: "The records name which tools integrate, ship inside one another or compete." },
  { id: "integ-policy", group: "integration", field: null, ref: NEWSTACK,
    text: "Can our policies decide who may use which feature, per team and repository?",
    why: "Policy permission is on the list of things to test in a trial." },
  { id: "integ-sla", group: "integration", field: null, ref: null,
    text: "What integration commitments do you publish, and where?",
    why: "We found no comparable published integration commitments across IDEs, source control, CI/CD, identity and scanners." },

  { id: "sec-compliance", group: "security", field: "compliance", ref: TRUST,
    text: "Which compliance attestations does the vendor hold, and for which products?",
    why: "Buyers cite the inability to prove output reliability to auditors as a reason not to buy." },
  { id: "sec-audit", group: "security", field: null, ref: TRUST,
    text: "Do you keep audit logs of prompts, outputs and accepted changes, and for how long?",
    why: "Governance built for traditional software often does not map to AI workflows." },
  { id: "sec-rfp", group: "security", field: null, ref: SNYK,
    text: "Do you answer a standard security questionnaire for AI-generated code?",
    why: "One security vendor publishes a template covering scanning, fix accuracy, policy alignment and scale. It is a vendor's own, so treat it as a starting point." },
  { id: "sec-copyright", group: "security", field: null, ref: NEWSTACK,
    text: "What copyright protection do you give us for generated code?",
    why: "Copyright protection is on the list of things to evaluate." },
  { id: "sec-rollout", group: "security", field: null, ref: TRUST,
    text: "Can we start on low-stakes work and widen the scope as we build trust?",
    why: "The published rollout pattern starts with boilerplate, tests and documentation, keeps people accountable for generated code, then widens." },
];
