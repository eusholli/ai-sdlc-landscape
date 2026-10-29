import type { MetadataRoute } from "next";
import { allTools, dataDate, phases } from "@/lib/data";
import { digestMonths } from "@/lib/digest";
import { getPaper } from "@/lib/paper";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(dataDate());
  const pages = [
    { path: "", priority: 1 },
    { path: "/analyze", priority: 0.7 },
    { path: "/ownership", priority: 0.8 },
    { path: "/changes", priority: 0.6 },
    { path: "/about", priority: 0.5 },
    { path: "/contribute", priority: 0.5 },
    { path: "/privacy", priority: 0.3 },
    { path: "/llms.txt", priority: 0.5 },
    { path: "/llms-full.txt", priority: 0.4 },
  ];

  return [
    ...pages.map(({ path, priority }) => ({
      url: `${SITE_URL}${path}`,
      // The thesis changes with its own date, not the data's.
      lastModified: path === "/ownership" ? new Date(getPaper().date) : lastModified,
      priority,
    })),
    ...phases().map((phase) => ({
      url: `${SITE_URL}/phases/${phase.id}`,
      lastModified,
      priority: 0.8,
    })),
    ...digestMonths().map((month) => ({
      url: `${SITE_URL}/changes/${month}`,
      lastModified,
      priority: 0.4,
    })),
    ...allTools().map((tool) => ({
      url: `${SITE_URL}/tools/${tool.id}`,
      lastModified: tool.history ? new Date(tool.history.edited) : lastModified,
      priority: 0.7,
    })),
  ];
}
