// The site's navigation, in one place: the landscape, analysing your choices, updating the tool
// data, the latest updates and the pages about the site, the posts among them. The header, the phone menu and the footer all read it.
import { BookOpen, Download, Info, NotebookPen, Shield, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  /** One short line on what the page answers. */
  blurb: string;
  Icon: LucideIcon;
  /** A file to download rather than a page. */
  download?: boolean;
}

export interface NavGroup {
  id: "landscape" | "analyze" | "contribute" | "updates" | "about";
  label: string;
  /** A direct link. A group without one opens a menu of `items`. */
  href?: string;
  items?: NavItem[];
}

export const NAV: NavGroup[] = [
  { id: "landscape", label: "Landscape", href: "/" },
  { id: "analyze", label: "Analyze choices", href: "/analyze" },
  { id: "contribute", label: "Update tool data", href: "/contribute" },
  { id: "updates", label: "Latest updates", href: "/changes" },
  {
    id: "about", label: "About",
    items: [
      { href: "/about", label: "About the landscape", blurb: "Method, sources and licences", Icon: Info },
      { href: "/blog", label: "Blog", blurb: "What the records show, by date", Icon: NotebookPen },
      { href: "/ownership", label: "Software ownership", blurb: "The maintainer's thesis", Icon: BookOpen },
      { href: "/privacy", label: "Privacy", blurb: "What the site measures and keeps", Icon: Shield },
      { href: "/landscape.json", label: "Download the data", blurb: "Every record as JSON", Icon: Download, download: true },
    ],
  },
];

/** True when the item is the page shown at `pathname`. */
export const isCurrent = (item: NavItem, pathname: string) => item.href === pathname;

/** True when `pathname` is the group's page or one under it, or one of its items. */
export function isGroupCurrent(group: NavGroup, pathname: string): boolean {
  if (group.href) return group.href === "/" ? pathname === "/" : pathname === group.href || pathname.startsWith(`${group.href}/`);
  return (group.items ?? []).some((i) => isCurrent(i, pathname));
}
