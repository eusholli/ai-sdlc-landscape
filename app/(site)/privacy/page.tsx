import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONTAINER } from "@/components/site-name";
import { REPO_URL } from "@/lib/site";

// Says exactly what runs: the analytics in app/layout.tsx and what lib/choices.ts and the theme
// keep in the browser. Change this page in the same commit as any of them.

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What the AI SDLC Landscape measures, what it keeps in your browser, and what it never collects. No cookies, no ads.",
  alternates: { canonical: "/privacy" },
};

const linkClass =
  "rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-lg font-semibold tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}

function External({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className={linkClass}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export default function PrivacyPage() {
  return (
    <main id="main" className={`${SITE_CONTAINER} py-10`}>
      <div className="mx-auto flex max-w-3xl flex-col gap-10 text-[15px] leading-relaxed">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">Privacy</h1>
          <p className="text-pretty text-muted-foreground">
            This site sets no cookies and shows no ads. Two services measure how it is used, and neither can tell who
            you are. Your browser keeps two settings for you, on your device only.
          </p>
        </header>

        <Section id="visits" title="Visits: Plausible Analytics">
          <p>
            Plausible counts page views: the page, the site that sent you, your browser, operating system and device
            type, and your country and city, which it works out from your IP address.
          </p>
          <p>
            It also records whether a visit went on to a second page or stayed a minute on a page, so we can tell which
            pages people read rather than glance at. Your browser works that out in memory, and it is gone when you
            close the tab.
          </p>
          <p>
            Plausible sets no cookies and stores nothing on your device. It does not keep your IP address. It counts
            visitors with a code made from your IP address, your browser and a random value it deletes every 24 hours,
            so it cannot recognise you on a later day or on another site. The data stays in the EU. Plausible
            describes all of this in its <External href="https://plausible.io/data-policy">data policy</External>.
          </p>
        </Section>

        <Section id="speed" title="Page speed: Vercel Speed Insights">
          <p>
            Vercel, which hosts the site, measures how fast each page loads in your browser. It records the load
            timings with the page, your browser, device type, operating system, network speed and country. Vercel
            states that it does not tie these to a person or an IP address, or follow a visit from page to page, in
            its <External href="https://vercel.com/docs/speed-insights/privacy-policy">Speed Insights privacy notes</External>.
          </p>
        </Section>

        <Section id="browser" title="What your browser keeps">
          <p>
            Two settings, saved in your browser&apos;s local storage on this device and never sent to the site: your
            light or dark theme, if you pick one, and the tools you choose in{" "}
            <Link href="/analyze" className={linkClass}>
              Analyze choices
            </Link>
            , so they are still there when you come back. Clear this site&apos;s data in your browser to remove them.
          </p>
        </Section>

        <Section id="hosting" title="Hosting and requests">
          <p>
            Vercel serves the pages under its own <External href="https://vercel.com/legal/privacy-policy">privacy notice</External>.
            Change requests are GitHub issues, which fall under GitHub&apos;s{" "}
            <External href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement">
              privacy statement
            </External>
            .
          </p>
        </Section>

        <Section id="questions" title="Questions">
          <p>
            Ask by <External href={`${REPO_URL}/issues`}>opening an issue on GitHub</External>.
          </p>
        </Section>
      </div>
    </main>
  );
}
