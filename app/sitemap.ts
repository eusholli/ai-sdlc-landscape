import type { MetadataRoute } from "next";
import { allTools, dataDate } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(dataDate());
  const pages = [
    { path: "", priority: 1 },
    { path: "/compare", priority: 0.6 },
    { path: "/moves", priority: 0.6 },
    { path: "/insights", priority: 0.6 },
    { path: "/about", priority: 0.5 },
  ];

  return [
    ...pages.map(({ path, priority }) => ({ url: `${SITE_URL}${path}`, lastModified, priority })),
    ...allTools().map((tool) => ({
      url: `${SITE_URL}/tools/${tool.id}`,
      lastModified: tool.history ? new Date(tool.history.edited) : lastModified,
      priority: 0.7,
    })),
  ];
}
