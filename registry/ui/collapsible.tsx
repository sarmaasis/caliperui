"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { cn } from "./lib/cn";
import "./shared/accordion-panel.css";

export function Collapsible({
  title,
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  className,
}: {
  title: string;
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}) {
  const [local, setLocal] = useState(defaultOpen);
  const shown = open ?? local;
  const panelId = useId();

  return (
    <div data-slot="collapsible" className={cn("max-w-lg rounded-overlay border border-border px-3", className)}>
      <button
        type="button"
        aria-expanded={shown}
        aria-controls={panelId}
        data-slot="accordion-trigger"
        className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm font-medium outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        onClick={() => {
          const next = !shown;
          if (open == null) setLocal(next);
          onOpenChange?.(next);
        }}
      >
        {title}
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </button>
      <div id={panelId} data-slot="accordion-panel" data-open={shown || undefined} inert={shown ? undefined : true}>
        <div className="pb-3 text-sm leading-6 text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
