// Drive v0 from the terminal, one prompt per step, with a build gate between steps.
//
//   npx tsx scripts/v0-run.ts --dry-run          print what would be sent, spend nothing
//   npx tsx scripts/v0-run.ts --step 1           run one step
//   npx tsx scripts/v0-run.ts --from 3           run steps 3..9 (no pause)
//   npx tsx scripts/v0-run.ts                    run from the next step, pausing after step 2
//   npx tsx scripts/v0-run.ts --pull            re-pull v0's latest version and gate it, spend nothing
//   npx tsx scripts/v0-run.ts --whoami          check the key and the credit balance, spend nothing
//   flags: --no-push (commit only), --new-chat (forget the saved chat and seed a new one from the tree)
//   V0_WAIT_MINUTES caps the wait for each version (default 30)
//
// Needs V0_API_KEY in .env.local. State (the chat id and the last finished step) is kept in
// docs/v0-state.json, and every step is logged to docs/v0-log.md.
//
// v0 only sees the files it was seeded with plus its own edits. A file it holds that was since
// changed by hand would be overwritten by the next pull, so a step refuses to run until that drift
// is gone; --new-chat seeds a chat from the current tree.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { config } from "dotenv";
import { createClient } from "v0-sdk";
import { guard, isLocked } from "./guard";

config({ path: ".env.local", override: false });

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const num = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? Number(args[i + 1]) : undefined;
};
const DRY = flag("--dry-run");
const PUSH = !flag("--no-push");
const PAUSE_AFTER = 2;
const MAX_FIX_ROUNDS = 2;
const STATE = "docs/v0-state.json";
const LOG = "docs/v0-log.md";

// ---------- Prompts ----------

type Step = { n: number; title: string; body: string };

function loadSteps(): Step[] {
  const md = readFileSync("docs/v0-prompts.md", "utf8");
  return md.split(/^## Step /m).slice(1).map((chunk) => {
    const [head, ...rest] = chunk.split("\n");
    const m = head.match(/^(\d+):\s*(.+)$/);
    if (!m) throw new Error(`bad step heading: ${head}`);
    return { n: Number(m[1]), title: m[2].trim(), body: `## Step ${head}\n${rest.join("\n").trim()}` };
  });
}

const SYSTEM = [
  "You are building a public, neutral Next.js 15 App Router site with Tailwind v4 and shadcn/ui.",
  "docs/design-brief.md is the design contract. Follow it.",
  "Locked files are the data layer: never edit or recreate data/, lib/data.ts, lib/types.ts, lib/filters.ts, lib/format.ts, components/logo.tsx, lib/site.ts, lib/request-advice.ts, lib/llms.ts, lib/jsonld.ts, app/llms.txt/, app/llms-full.txt/ or app/schema/.",
  "Client components never import @/lib/data or data/landscape.json; they receive lite data as props.",
  "Use pnpm. Do not remove dependencies. Write no em dashes in UI text.",
].join(" ");

// ---------- Seed files ----------

/** A trimmed copy of the dataset for v0: same shape, edge cases on purpose, a fraction of the size. */
function sampleLandscape(): string {
  const d = JSON.parse(readFileSync("data/landscape.json", "utf8"));
  const acquired = new Set(d.relations.filter((r: { type: string }) => r.type === "acquired_by").map((r: { from: string }) => r.from));
  const known = (v: unknown) => v != null && v !== "unknown";
  // Up to `cap` nodes per bucket; edge cases get their own buckets so each one is represented.
  const caps: Record<string, number> = { full: 5, nologo: 6, moved: 4, layer: 3, phase: 3 };
  const keep = new Set<string>();
  const seen = new Map<string, number>();
  const take = (id: string, bucket: string, cap: number) => {
    const c = seen.get(bucket) ?? 0;
    if (c >= cap) return false;
    seen.set(bucket, c + 1);
    keep.add(id);
    return true;
  };
  for (const n of d.nodes) {
    if (n.segment === "full-lifecycle" && take(n.id, "full", caps.full)) continue;
    if (!known(n.logo_url) && take(n.id, "nologo", caps.nologo)) continue;
    if ((acquired.has(n.id) || known(n.status)) && take(n.id, "moved", caps.moved)) continue;
    if (n.layer) { take(n.id, `layer:${n.layer}`, caps.layer); continue; }
    take(n.id, `phase:${n.primary_phase}`, caps.phase);
  }
  const nodes = d.nodes.filter((n: { id: string }) => keep.has(n.id));
  const relations = d.relations.filter((r: { from: string; to: string }) =>
    keep.has(r.from) && (keep.has(r.to) || d.externals.some((e: { id: string }) => e.id === r.to)));
  return JSON.stringify({ ...d, nodes, relations });
}

function listFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listFiles(join(dir, e.name)) : [join(dir, e.name)]);
}

function seedFiles() {
  const paths = [
    "package.json", "tsconfig.json", "next.config.ts", "components.json", "postcss.config.mjs",
    "docs/design-brief.md", "data/phases.json",
    ...listFiles("lib"), ...listFiles("app"), ...listFiles("components"),
  ].filter((p) => /\.(tsx?|json|css|mjs|md)$/.test(p) && existsSync(p));
  const files = paths.map((name) => ({ name, content: readFileSync(name, "utf8"), locked: isLocked(name) }));
  files.push({ name: "data/landscape.json", content: sampleLandscape(), locked: true });
  return files;
}

// ---------- Shell helpers ----------

const sh = (cmd: string, a: string[]) => execFileSync(cmd, a, { encoding: "utf8" }).trim();

function run(cmd: string, a: string[]): { ok: boolean; out: string } {
  const r = spawnSync(cmd, a, { encoding: "utf8", env: { ...process.env, CI: "1" } });
  return { ok: r.status === 0, out: `${r.stdout ?? ""}\n${r.stderr ?? ""}` };
}

const tail = (s: string, lines = 80) => s.trim().split("\n").slice(-lines).join("\n");

function gate(): { ok: boolean; report: string } {
  const problems = guard("HEAD");
  if (problems.length) return { ok: false, report: problems.join("\n") };
  const install = run("pnpm", ["install", "--no-frozen-lockfile"]);
  if (!install.ok) return { ok: false, report: tail(install.out) };
  const build = run("pnpm", ["build"]);
  if (!build.ok) return { ok: false, report: tail(build.out) };
  const check = run("pnpm", ["check"]);
  if (!check.ok) return { ok: false, report: tail(check.out) };
  return { ok: true, report: "" };
}

// ---------- v0 ----------

/** `files` is every path in v0's latest version, so a file v0 drops can be deleted here too. */
type State = { chatId?: string; webUrl?: string; lastStep: number; files?: string[] };
const loadState = (): State => (existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : { lastStep: 0 });
const saveState = (s: State) => writeFileSync(STATE, JSON.stringify(s, null, 2) + "\n");

const v0 = () => {
  if (!process.env.V0_API_KEY) throw new Error("V0_API_KEY is not set. Put it in .env.local.");
  return createClient({ apiKey: process.env.V0_API_KEY });
};
type Client = ReturnType<typeof createClient>;

async function balance(client: Client): Promise<string> {
  try {
    const b = (await client.user.getBilling()) as { data?: { balance?: { remaining?: number; total?: number } } };
    const bal = b.data?.balance;
    return bal ? `${bal.remaining} of ${bal.total}` : "unknown";
  } catch {
    return "unknown";
  }
}

/** A fingerprint of everything v0 might still be changing: latest version and latest message. */
async function snapshot(client: Client, chatId: string) {
  const chat = await client.chats.getById({ chatId });
  const msgs = (await client.chats.findMessages({ chatId, limit: 1 })) as {
    data: { id: string; role: string; content: string; updatedAt?: string }[];
  };
  const m = msgs.data[0];
  const v = chat.latestVersion;
  return {
    chat,
    version: v,
    key: [v?.id, v?.status, v?.updatedAt, v?.files.length, m?.id, m?.role, m?.content.length, m?.updatedAt].join("|"),
    idle: !!v && v.status !== "pending" && m?.role === "assistant",
  };
}

/**
 * Wait until the chat has been idle and unchanged for SETTLE_POLLS polls in a row. v0 marks
 * versions completed several times within one turn, so a single completed version is not the
 * end of a turn, and sending the next prompt before the turn ends cuts it short.
 */
async function settle(client: Client, chatId: string, after?: string) {
  const SETTLE_POLLS = 6;
  const polls = Number(process.env.V0_WAIT_MINUTES ?? 30) * 6;
  let last = "";
  let stable = 0;
  for (let i = 0; i < polls; i++) {
    const s = await snapshot(client, chatId);
    const fresh = after === undefined || s.version?.id !== after;
    stable = s.idle && fresh && s.key === last ? stable + 1 : 0;
    last = s.key;
    if (stable >= SETTLE_POLLS) return { chat: s.chat, version: s.version! };
    await new Promise((r) => setTimeout(r, 10_000));
  }
  throw new Error("v0 did not settle in time (it may have answered in text; check the chat)");
}

async function send(client: Client, chatId: string, message: string) {
  const before = (await settle(client, chatId)).version.id;
  await client.chats.sendMessage({ chatId, message, system: SYSTEM, responseMode: "async" });
  const { chat, version } = await settle(client, chatId, before);
  if (version.status === "failed") throw new Error(`v0 version ${version.id} failed`);
  const full = await client.chats.getVersion({ chatId, versionId: version.id });
  return { chat, version: full };
}

const clean = (name: string) => name.replace(/^\/+/, "");

/**
 * Write v0's files into the tree, skipping locked paths, and delete files v0 dropped since its
 * previous version (`previous`). Deletion only touches source paths v0 has held, never locked ones.
 * Returns the paths written or deleted.
 */
export function pull(files: { name: string; content: string }[], previous: string[]): string[] {
  const changed: string[] = [];
  const current = new Set(files.map((f) => clean(f.name)));
  for (const f of files) {
    const name = clean(f.name);
    if (isLocked(name) || name.includes("..")) continue;
    if (existsSync(name) && readFileSync(name, "utf8") === f.content) continue;
    mkdirSync(dirname(name) || ".", { recursive: true });
    writeFileSync(name, f.content);
    changed.push(name);
  }
  for (const name of previous) {
    // v0 leaves config files out of some versions, so only source folders are ever pruned.
    if (!/^(app|components|hooks|lib)\//.test(name)) continue;
    if (current.has(name) || isLocked(name) || name.includes("..") || !existsSync(name)) continue;
    rmSync(name);
    changed.push(`-${name}`);
  }
  return changed;
}

/** Paths v0 holds whose content here differs from v0's copy: hand edits a pull would undo. */
export function drift(files: { name: string; content: string }[]): string[] {
  return files
    .map((f) => ({ name: clean(f.name), content: f.content }))
    .filter((f) => !isLocked(f.name) && !f.name.includes("..") && /^(app|components|hooks|lib)\//.test(f.name))
    .filter((f) => !existsSync(f.name) || readFileSync(f.name, "utf8") !== f.content)
    .map((f) => f.name);
}

function log(entry: string) {
  if (!existsSync(LOG)) writeFileSync(LOG, "# v0 log\n\nOne entry per step, written by `scripts/v0-run.ts`.\n");
  appendFileSync(LOG, `\n${entry}\n`);
}

// ---------- Main ----------

async function main() {
  const steps = loadSteps();
  const state = flag("--new-chat") ? { lastStep: 0 } : loadState();
  const only = num("--step");
  const from = num("--from");
  const queue = only ? steps.filter((s) => s.n === only)
    : steps.filter((s) => s.n >= (from ?? state.lastStep + 1));
  const pause = !only && !from;

  if (DRY) {
    const seed = seedFiles();
    const kb = (s: string) => `${(Buffer.byteLength(s) / 1024).toFixed(1)} KB`;
    console.log(`chat: ${state.chatId ?? "(new)"}\nseed files (${seed.length}):`);
    for (const f of seed) console.log(`  ${f.locked ? "locked" : "open  "} ${kb(f.content).padStart(9)}  ${f.name}`);
    console.log(`\nsystem: ${SYSTEM}\n`);
    for (const s of queue) console.log(`--- step ${s.n}: ${s.title} (${kb(s.body)}) ---\n${s.body}\n`);
    return;
  }

  if (flag("--whoami")) {
    console.log(`credits: ${await balance(v0())}`);
    return;
  }
  if (flag("--pull")) {
    // Re-pull the chat's latest version and gate it, spending nothing. For recovering a step.
    const client = v0();
    const { chat } = await settle(client, state.chatId!);
    const version = await client.chats.getVersion({ chatId: chat.id, versionId: chat.latestVersion!.id });
    const changed = pull(version.files, state.files ?? []);
    state.files = version.files.map((f) => clean(f.name));
    saveState(state);
    console.log(`pulled ${version.id}: ${changed.length} changed\n${changed.join("\n")}`);
    const result = gate();
    console.log(result.ok ? "gate: passed" : `gate: FAILED\n${result.report}`);
    return;
  }
  if (sh("git", ["status", "--porcelain"])) throw new Error("working tree is not clean; commit or stash first");
  const client = v0();

  if (state.chatId) {
    const { chat } = await settle(client, state.chatId);
    const latest = await client.chats.getVersion({ chatId: chat.id, versionId: chat.latestVersion!.id });
    const drifted = drift(latest.files);
    if (drifted.length) {
      throw new Error(`these files changed here since v0's last version, so a pull would undo them:\n${drifted.join("\n")}\n` +
        "run with --new-chat to seed a chat from the current tree");
    }
  } else {
    const chat = await client.chats.init({ type: "files", files: seedFiles(), name: "AI SDLC Landscape", chatPrivacy: "private" });
    Object.assign(state, { chatId: chat.id, webUrl: chat.webUrl, files: seedFiles().map((f) => f.name) });
    saveState(state);
    console.log(`v0 chat: ${chat.webUrl}`);
  }
  const chatId = state.chatId!;

  for (const step of queue) {
    console.log(`\n== step ${step.n}: ${step.title}`);
    const credits = await balance(client);
    let { version } = await send(client, chatId, step.body);
    let written = pull(version.files, state.files ?? []);
    state.files = version.files.map((f) => clean(f.name));
    let result = gate();
    let rounds = 0;
    while (!result.ok && rounds < MAX_FIX_ROUNDS) {
      rounds++;
      console.log(`gate failed, sending the error back (round ${rounds})`);
      ({ version } = await send(client, chatId,
        `The build gate failed after your last change. Fix only what is needed, keep the locked files as they are.\n\n\`\`\`\n${result.report}\n\`\`\``));
      written = [...new Set([...written, ...pull(version.files, state.files)])];
      state.files = version.files.map((f) => clean(f.name));
      result = gate();
    }

    const entry = [
      `## Step ${step.n}: ${step.title}`,
      "",
      `- ${new Date().toISOString()}`,
      `- chat: ${state.webUrl ?? chatId}`,
      `- version: ${version.id}${version.demoUrl ? `, demo ${version.demoUrl}` : ""}`,
      `- credits before: ${credits}, after: ${await balance(client)}`,
      `- files written: ${written.length}; fix rounds: ${rounds}; gate: ${result.ok ? "passed" : "FAILED"}`,
    ].join("\n");
    log(entry);

    if (!result.ok) {
      console.error(`\nstep ${step.n} still fails after ${MAX_FIX_ROUNDS} fix rounds. Files are in the tree, uncommitted.\n${result.report}`);
      process.exit(1);
    }

    state.lastStep = step.n;
    saveState(state);
    sh("git", ["add", "-A"]);
    sh("git", ["commit", "-m", `v0: step ${step.n} ${step.title.toLowerCase()}`]);
    if (PUSH) {
      const push = run("git", ["push", "-u", "origin", "HEAD"]);
      if (!push.ok) throw new Error(`push failed:\n${tail(push.out, 20)}`);
    }
    console.log(`step ${step.n} committed${PUSH ? " and pushed" : ""}`);

    if (pause && step.n === PAUSE_AFTER) {
      console.log(`\nPaused after step ${PAUSE_AFTER}. Review the preview, then run with --from ${PAUSE_AFTER + 1}.`);
      return;
    }
  }
}

if (process.argv[1]?.endsWith("v0-run.ts")) main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
