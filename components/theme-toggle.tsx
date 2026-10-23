"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ToggleGroup } from "radix-ui";

const OPTIONS = [
  { value: "light", label: "Light theme", icon: Sun },
  { value: "dark", label: "Dark theme", icon: Moon },
  { value: "system", label: "System theme", icon: Monitor },
] as const satisfies readonly { value: string; label: string; icon: LucideIcon }[];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <ToggleGroup.Root
      type="single"
      value={mounted ? theme ?? "system" : ""}
      onValueChange={(next) => next && setTheme(next)}
      aria-label="Theme"
      className="inline-flex items-center rounded-lg bg-muted p-0.5"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <ToggleGroup.Item
          key={value}
          value={value}
          aria-label={label}
          title={label}
          className="inline-flex size-7 items-center max-sm:h-11 max-sm:w-8 justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm data-[state=on]:ring-1 data-[state=on]:ring-border"
        >
          <Icon className="size-3.5" aria-hidden />
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
