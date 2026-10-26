"use client";

import { Activity, List, Map as MapIcon, Network } from "lucide-react";
import { useQueryStates } from "nuqs";
import { usePathname, useRouter } from "next/navigation";
import { SegmentedSwitcher, type SegmentOption } from "@/components/segmented-switcher";
import { filterParsers } from "@/lib/filters";

type View = "map" | "network" | "list" | "moves";

const OPTIONS: readonly SegmentOption<View>[] = [
  { value: "map", label: "Map", icon: MapIcon },
  { value: "network", label: "Network", icon: Network },
  { value: "list", label: "List", icon: List },
  { value: "moves", label: "Market moves", icon: Activity },
];

/** `pillId` must differ when two switchers are mounted at once, as on the home page list. */
export function ViewSwitcher({ pillId = "view-pill" }: { pillId?: string }) {
  const [{ view }, setQuery] = useQueryStates(filterParsers);
  const pathname = usePathname();
  const router = useRouter();
  const onHome = pathname === "/";

  return (
    <SegmentedSwitcher
      options={OPTIONS}
      value={onHome ? view : ""}
      onChange={(next) => (onHome ? void setQuery({ view: next }) : router.push(`/?view=${next}`))}
      label="View"
      pillId={pillId}
    />
  );
}
