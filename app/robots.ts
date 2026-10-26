import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Every crawler is welcome, search and AI alike (GPTBot, ClaudeBot, PerplexityBot, Google-Extended and
// the rest): the `*` rule covers them, so none is named. The data is CC BY 4.0 and meant to be read.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
