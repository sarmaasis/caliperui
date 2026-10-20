"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { cn } from "./lib/cn";
import "./shared/accordion-panel.css";
import "./accordion.css";

export type AccordionItem = { id: string; title: string; content: ReactNode; icon?: ReactNode };

export function Accordion({
  items,
  value,
  defaultValue = null,
  onValueChange,
  className,
}: {
  items: readonly AccordionItem[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  className?: string;
}) {
  const [local, setLocal] = useState(defaultValue);
  const openId = value === undefined ? local : value;
  const base = useId();

  function toggle(id: string) {
    const next = openId === id ? null : id;
    if (value === undefined) setLocal(next);
    onValueChange?.(next);
  }

  return (
    <div data-slot="accordion" className={cn("grid max-w-lg", className)}>
      {items.map((item) => {
        const open = openId === item.id;
        const panelId = `${base}-${item.id}`;
        return (
          <div key={item.id} data-slot="accordion-item" data-open={open || undefined}>
            <h3>
              <button
                type="button"
                id={`${panelId}-trigger`}
                aria-expanded={open}
                aria-controls={panelId}
                data-slot="accordion-trigger"
                className="flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium outline-none hover:bg-muted/60 active:bg-[var(--raised-press)] focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                onClick={() => toggle(item.id)}
              >
                {item.icon ? <span className="grid size-7 shrink-0 place-items-center text-muted-foreground">{item.icon}</span> : null}
                <span className="min-w-0 flex-1">{item.title}</span>
                <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={`${panelId}-trigger`} data-slot="accordion-panel" data-open={open || undefined} inert={open ? undefined : true}>
              <div className="px-3 pb-3 text-sm leading-6 text-muted-foreground">{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
