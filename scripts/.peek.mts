import { config } from "dotenv"; import { createClient } from "v0-sdk";
config({ path: ".env.local", quiet: true } as any);
const c = createClient({ apiKey: process.env.V0_API_KEY });
(async () => {
const chatId = "EKXETuWnLzG"; let last = "", stable = 0;
for (let i = 0; i < 180 && stable < 6; i++) {
  const chat = await c.chats.getById({ chatId }); const v = chat.latestVersion!;
  const key = [v.id, v.status, v.updatedAt, v.files.length].join("|");
  stable = v.status !== "pending" && key === last ? stable + 1 : 0; last = key;
  await new Promise((r) => setTimeout(r, 10_000));
}
const chat = await c.chats.getById({ chatId }); const v = chat.latestVersion!;
const names = v.files.map((f) => f.name);
console.log(v.id, v.status, names.length);
for (const s of ["compare/page", "components/compare/", "about/page", "opengraph", "sitemap", "robots", "moves/page", "insights/page", "network", "mobile", "list"]) console.log(s, names.filter((n) => n.includes(s)).length);
const m: any = await c.chats.findMessages({ chatId, limit: 1 });
console.log(String(m.data[0].content).slice(-1500));
})();
