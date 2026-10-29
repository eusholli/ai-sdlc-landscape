import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Providers } from "@/app/providers";
import { Engaged } from "@/components/engaged";
import { cn } from "@/lib/utils";
import { allTools } from "@/lib/data";
import { OPEN_GRAPH } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

// Set in the production environment only, so local and preview builds send nothing. /privacy says
// what runs; change the two together.
const PLAUSIBLE_SRC = process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "AI SDLC Landscape", template: "%s | AI SDLC Landscape" },
  applicationName: "AI SDLC Landscape",
  openGraph: OPEN_GRAPH,
  description:
    `${allTools().filter((t) => t.kind === "tool").length} AI tools across the software development lifecycle, by phase, with customers, partners, pricing and how they connect. Every fact links to its source.`,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", inter.variable, geistMono.variable)}>
      <body className="bg-background text-foreground antialiased">
        {/* Here, not in `metadata`: a page's own `alternates` would replace it. React puts it in <head>. */}
        <link rel="alternate" type="application/atom+xml" href="/changes.xml" title="AI SDLC Landscape: changes" />
        {PLAUSIBLE_SRC && (
          <>
            {/* beforeInteractive puts both in the first HTML, where Plausible's install check looks. The stub queues calls made before the script loads. */}
            <Script id="plausible-init" strategy="beforeInteractive">
              {"window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()"}
            </Script>
            <Script src={PLAUSIBLE_SRC} strategy="beforeInteractive" async />
            <Engaged />
          </>
        )}
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
