import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";
import { cn } from "@/lib/utils";
import { allTools } from "@/lib/data";
import { OPEN_GRAPH } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
