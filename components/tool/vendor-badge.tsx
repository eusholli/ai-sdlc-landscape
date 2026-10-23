import { CopyButton } from "@/components/copy-button";
import { requestUrl, SITE_URL } from "@/lib/site";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const escapeMarkdown = (s: string) => s.replace(/([\\[\]])/g, "\\$1");

function Snippet({ title, text, label }: { title: string; text: string; label: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-lg border bg-muted/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <CopyButton text={text} label={label} />
      </div>
      <pre className="overflow-x-auto" tabIndex={0} aria-label={`${title} snippet`}>
        <code className="font-mono text-[13px] leading-relaxed whitespace-pre">{text}</code>
      </pre>
    </div>
  );
}

export function VendorBadge({ id, name }: { id: string; name: string }) {
  const alt = `${name} is listed on AI SDLC Landscape`;
  const badgeUrl = `${SITE_URL}/badge/${id}.svg`;
  const pageUrl = `${SITE_URL}/tools/${id}`;
  const html = `<a href="${pageUrl}"><img src="${badgeUrl}" alt="${escapeHtml(alt)}"></a>`;
  const markdown = `[![${escapeMarkdown(alt)}](${badgeUrl})](${pageUrl})`;

  return (
    <section aria-labelledby="listed-here" className="mt-10 flex flex-col gap-4 border-t pt-8 text-[15px]">
      <h2 id="listed-here" className="text-lg font-semibold tracking-tight">
        Listed here?
      </h2>
      <p className="text-pretty text-muted-foreground">
        If this is your tool, you can show it is listed. Keep the record current by{" "}
        <a
          href={requestUrl(name)}
          target="_blank"
          rel="noreferrer noopener"
          className="rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          requesting a change
          <span className="sr-only"> (opens in a new tab)</span>
        </a>{" "}
        when a fact moves.
      </p>
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG badge served by the site */}
        <img src={`/badge/${id}.svg`} alt={alt} className="h-6 w-auto max-w-full" />
      </div>
      <div className="flex flex-col gap-3">
        <Snippet title="HTML" text={html} label="HTML snippet" />
        <Snippet title="Markdown" text={markdown} label="Markdown snippet" />
      </div>
    </section>
  );
}
