"use client";

import { PanelLeft } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "./lib/cn";
import "./sidebar.css";

export type SidebarItem = { id: string; label: string; icon: ReactNode };

export function Sidebar({
  label = "Project",
  items,
  value,
  defaultValue,
  onValueChange,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  className,
}: {
  label?: string;
  items: readonly SidebarItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
}) {
  const [localValue, setLocalValue] = useState(defaultValue ?? items[0]?.id ?? "");
  const [localCollapsed, setLocalCollapsed] = useState(defaultCollapsed);
  const current = value ?? localValue;
  const closed = collapsed ?? localCollapsed;

  function select(next: string) {
    if (value == null) setLocalValue(next);
    onValueChange?.(next);
  }

  function toggle() {
    const next = !closed;
    if (collapsed == null) setLocalCollapsed(next);
    onCollapsedChange?.(next);
  }

  return (
    <aside data-slot="sidebar" data-collapsed={closed || undefined} aria-label={label} className={cn("flex h-72 flex-col overflow-hidden border-r border-border bg-background", className)}>
      <div className="flex h-12 items-center gap-2 px-2">
        <button type="button" aria-pressed={closed} aria-label={closed ? "Expand sidebar" : "Collapse sidebar"} className="grid size-9 shrink-0 place-items-center rounded-surface outline-none hover:bg-muted active:bg-[var(--raised-press)] focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-ring" onClick={toggle}>
          <PanelLeft aria-hidden="true" className="size-4" />
        </button>
        <span data-slot="sidebar-label"><span className="truncate text-sm font-medium">{label}</span></span>
      </div>
      <nav className="grid gap-1 px-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={item.id === current ? "page" : undefined}
            title={item.label}
            className="flex h-9 items-center gap-2 rounded-surface px-2 text-sm outline-none hover:bg-muted active:bg-[var(--raised-press)] focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-ring aria-[current=page]:bg-selected"
            onClick={() => select(item.id)}
          >
            <span className="grid size-5 shrink-0 place-items-center">{item.icon}</span>
            <span data-slot="sidebar-label"><span className="truncate">{item.label}</span></span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
