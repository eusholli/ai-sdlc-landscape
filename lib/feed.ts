// Two Atom feeds, built at build time. /changes.xml is the timeline: every change to the records,
// grouped by commit, and the dated market moves. /blog/rss.xml is the posts, newest first.
import "server-only";

import { buildDate, posts, timeline } from "@/lib/data";
import { REPO_URL, SITE_URL } from "@/lib/site";
import type { TimelineEntry } from "@/lib/types";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A move dated to the month only is placed on its first day. */
const stamp = (date: string) => `${date.length === 7 ? `${date}-01` : date}T00:00:00Z`;

function entryId(e: TimelineEntry): string {
  return e.kind === "changes" ? `${REPO_URL}/commit/${e.commit}` : `${SITE_URL}/?view=moves#${e.move.tool}`;
}

function entryLink(e: TimelineEntry): string {
  if (e.kind === "move") return `${SITE_URL}/tools/${e.move.tool}`;
  const ids = [...new Set(e.changes.map((c) => c.tool).filter((t): t is string => !!t))];
  return ids.length === 1 && e.changes[0].kind !== "removed" ? `${SITE_URL}/tools/${ids[0]}` : `${SITE_URL}/changes`;
}

function entryBody(e: TimelineEntry): string {
  if (e.kind === "move") return [e.move.status, ...e.move.sources].join("\n");
  const lines = e.changes.length > 1 ? e.changes.map((c) => `- ${c.text}`) : [];
  if (e.requestedBy.length) lines.push(`Requested by ${e.requestedBy.map((r) => `${r.name} (#${r.issue})`).join(", ")}`);
  lines.push(`Commit: ${REPO_URL}/commit/${e.commit}`);
  return lines.join("\n");
}

export function atomFeed(limit = 50): string {
  const entries = timeline(limit);
  const updated = entries.find((e) => e.kind === "changes")?.date ?? buildDate();
  return [
    `<?xml version="1.0" encoding="utf-8"?>`,
    `<feed xmlns="http://www.w3.org/2005/Atom">`,
    `  <title>AI SDLC Landscape: changes</title>`,
    `  <subtitle>Tools added, facts published and market moves, newest first.</subtitle>`,
    `  <id>${SITE_URL}/changes.xml</id>`,
    `  <link rel="self" href="${SITE_URL}/changes.xml"/>`,
    `  <link rel="alternate" href="${SITE_URL}/changes"/>`,
    `  <updated>${stamp(updated)}</updated>`,
    `  <author><name>AI SDLC Landscape</name></author>`,
    ...entries.map((e) => [
      `  <entry>`,
      `    <title>${esc(e.text)}</title>`,
      `    <id>${esc(entryId(e))}</id>`,
      `    <link href="${esc(entryLink(e))}"/>`,
      `    <updated>${stamp(e.date)}</updated>`,
      ...(e.kind === "changes" ? [`    <author><name>${esc(e.author)}</name></author>`] : []),
      `    <content type="text">${esc(entryBody(e))}</content>`,
      `  </entry>`,
    ].join("\n")),
    `</feed>`,
    "",
  ].join("\n");
}

/** The blog feed, RSS 2.0. An item's guid is the post's URL, so editing a post never makes it a new item. */
export function blogFeed(): string {
  const all = posts();
  const rfc822 = (date: string) => new Date(stamp(date)).toUTCString();
  return [
    `<?xml version="1.0" encoding="utf-8"?>`,
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">`,
    `  <channel>`,
    `    <title>AI SDLC Landscape: blog</title>`,
    `    <link>${SITE_URL}/blog</link>`,
    `    <description>What the records show, dated to the data each post read, and signed opinions kept apart from the data.</description>`,
    `    <language>en</language>`,
    `    <atom:link rel="self" type="application/rss+xml" href="${SITE_URL}/blog/rss.xml"/>`,
    `    <lastBuildDate>${rfc822(all[0]?.date ?? buildDate())}</lastBuildDate>`,
    ...all.map((n) => [
      `    <item>`,
      `      <title>${esc(n.title)}</title>`,
      `      <link>${SITE_URL}/blog/${n.slug}</link>`,
      `      <guid isPermaLink="true">${SITE_URL}/blog/${n.slug}</guid>`,
      `      <pubDate>${rfc822(n.date)}</pubDate>`,
      ...(n.author ? [`      <dc:creator>${esc(n.author)}</dc:creator>`] : []),
      `      <category>${n.kind}</category>`,
      `      <description>${esc(n.description)}</description>`,
      `    </item>`,
    ].join("\n")),
    `  </channel>`,
    `</rss>`,
    "",
  ].join("\n");
}
