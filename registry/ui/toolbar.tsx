"use client";

import { Ellipsis } from "lucide-react";
import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { GlideHighlight, glideBox, type GlideBox } from "./glide-highlight";
import { Kbd } from "./kbd";
import { cn } from "./lib/cn";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import "./toolbar.css";

/* How each tool appears in the More menu once it no longer fits. */
type Entry =
  | { kind: "action"; label: string; icon?: ReactNode; disabled?: boolean; onSelect: () => void }
  | { kind: "toggle"; label: string; icon?: ReactNode; disabled?: boolean; checked: boolean; onSelect: () => void }
  | { kind: "option"; group: string; groupLabel: string; value: string; label: string; icon?: ReactNode; checked: boolean; onSelect: () => void };

type Ctx = { orientation: "horizontal" | "vertical"; hidden: ReadonlySet<string>; entries: Map<string, Entry> };
type Group = { id: string; label: string; type: "single" | "multiple"; values: readonly string[]; toggle: (value: string) => void };

const ToolbarContext = createContext<Ctx | null>(null);
const GroupContext = createContext<Group | null>(null);

/** Registers a tool's menu form after each render, so the menu always has the latest state. */
function useEntry(entry: Entry) {
  const ctx = useContext(ToolbarContext);
  const id = useId();
  useLayoutEffect(() => {
    if (!ctx) return;
    ctx.entries.set(id, entry);
    return () => void ctx.entries.delete(id);
  });
  return id;
}

/** A piece of the row that folds as one: a tool, a group or a separator. */
function useUnit() {
  const ctx = useContext(ToolbarContext);
  const id = useId();
  return { id, hidden: ctx?.hidden.has(id) ?? false, orientation: ctx?.orientation ?? "horizontal" };
}

const MORE = 36;
const focusables = "button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex='-1'])";

/**
 * A row of tools with one tab stop. Arrows, Home and End move between them,
 * a toggled tool sits recessed in the shell, and when the row runs out of
 * width the last tools fold into a More menu that keeps their labels, state
 * and order. Fields inside keep their own arrow keys.
 */
export function Toolbar({
  label,
  orientation = "horizontal",
  overflow = true,
  className,
  children,
  ...props
}: Omit<ComponentProps<"div">, "role"> & {
  /** Names the toolbar, e.g. "Formatting". */
  label: string;
  orientation?: "horizontal" | "vertical";
  /** Fold tools that do not fit into a More menu (horizontal only). */
  overflow?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const widths = useRef(new Map<string, number>());
  const [entries] = useState(() => new Map<string, Entry>());
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  const [menu, setMenu] = useState<Entry[][]>([]);
  const [box, setBox] = useState<GlideBox | null>(null);
  const folds = overflow && orientation === "horizontal";

  const items = useCallback(() => {
    const element = root.current;
    if (!element) return [];
    return [...element.querySelectorAll<HTMLElement>("[data-toolbar-item], [data-toolbar-generic]")]
      .filter((node) => !node.closest("[data-overflowed]"))
      .map((node) => (node.hasAttribute("data-toolbar-item") ? node : node.querySelector<HTMLElement>(focusables)))
      .filter((node): node is HTMLElement => !!node && !(node as HTMLButtonElement).disabled);
  }, []);

  const activate = useCallback((node: HTMLElement) => {
    for (const other of items()) {
      other.tabIndex = other === node ? 0 : -1;
      if (other !== node) delete other.dataset.toolbarActive;
    }
    node.dataset.toolbarActive = "";
  }, [items]);

  // One tab stop: the tool used last, or the first one.
  useLayoutEffect(() => {
    const list = items();
    if (!list.length) return;
    const current = list.find((node) => node.dataset.toolbarActive !== undefined) ?? list[0]!;
    for (const node of list) node.tabIndex = node === current ? 0 : -1;
  });

  const fit = useCallback(() => {
    const element = root.current;
    if (!element || !folds) return;
    const units = [...element.querySelectorAll<HTMLElement>("[data-toolbar-unit]")];
    for (const unit of units) if (!unit.hasAttribute("data-overflowed")) widths.current.set(unit.dataset.toolbarUnit!, unit.offsetWidth + 2);
    const width = (unit: HTMLElement) => widths.current.get(unit.dataset.toolbarUnit!) ?? 0;
    const available = element.clientWidth - 6;
    const next = new Set<string>();
    if (units.reduce((sum, unit) => sum + width(unit), 0) > available) {
      let budget = available - MORE - units.filter((unit) => unit.dataset.pinned !== undefined).reduce((sum, unit) => sum + width(unit), 0);
      let full = false;
      for (const unit of units) {
        if (unit.dataset.pinned !== undefined) continue;
        if (!full && width(unit) <= budget) budget -= width(unit);
        else {
          full = true;
          next.add(unit.dataset.toolbarUnit!);
        }
      }
      // No separator left dangling at the end of the row.
      for (let i = units.length - 1; i >= 0; i -= 1) {
        const unit = units[i]!;
        if (next.has(unit.dataset.toolbarUnit!) || unit.dataset.pinned !== undefined) continue;
        if (unit.dataset.separator !== undefined) next.add(unit.dataset.toolbarUnit!);
        else break;
      }
    }
    setHidden((current) => (current.size === next.size && [...next].every((id) => current.has(id)) ? current : next));
  }, [folds]);

  useLayoutEffect(() => {
    const element = root.current;
    if (!element || !folds) return;
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, [fit, folds]);

  function move(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.matches("input, textarea, [contenteditable='true']")) return;
    const back = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
    const forward = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
    if (![back, forward, "Home", "End"].includes(event.key)) return;
    const list = items();
    const index = list.findIndex((node) => node === target || node.contains(target));
    if (index < 0) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? list.length - 1 : (index + (event.key === forward ? 1 : -1) + list.length) % list.length;
    activate(list[next]!);
    list[next]!.focus();
  }

  function place(target: EventTarget | null) {
    const button = target instanceof Element ? target.closest<HTMLElement>('[data-slot="button"]') : null;
    if (!button || !root.current?.contains(button)) return;
    setBox(glideBox(button));
  }
  const rest = () => setBox((current) => (current ? { ...current, active: false } : null));

  function openMenu(open: boolean) {
    if (!open || !root.current) return;
    // Units in row order, each with its tools in order.
    const units = [...root.current.querySelectorAll<HTMLElement>("[data-toolbar-unit][data-overflowed]")];
    setMenu(
      units
        .map((unit) => [...unit.querySelectorAll<HTMLElement>("[data-toolbar-entry]")].map((node) => entries.get(node.dataset.toolbarEntry!)).filter((entry): entry is Entry => !!entry))
        .filter((list) => list.length > 0),
    );
  }

  return (
    <ToolbarContext.Provider value={{ orientation, hidden, entries }}>
      <TooltipProvider>
        <div
          {...props}
          ref={root}
          role="toolbar"
          aria-label={label}
          aria-orientation={orientation}
          data-slot="toolbar"
          data-orientation={orientation}
          onKeyDown={(event) => {
            move(event);
            props.onKeyDown?.(event);
          }}
          onFocus={(event) => {
            const node = items().find((item) => item === event.target || item.contains(event.target as Node));
            if (node) activate(node);
            place(event.target);
          }}
          onBlur={(event) => !root.current?.contains(event.relatedTarget as Node) && rest()}
          onPointerMove={(event) => place(event.target)}
          onPointerLeave={rest}
          className={cn(
            "relative flex max-w-full min-w-0 gap-0.5 rounded-touch bg-raised p-[3px] shadow-raised",
            orientation === "vertical" ? "inline-flex flex-col" : "items-center",
            className,
          )}
        >
          <GlideHighlight box={box} />
          {children}
          {folds && hidden.size > 0 && (
            <DropdownMenu onOpenChange={openMenu}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-toolbar-item="" aria-label="More tools" className="ml-auto">
                  <Ellipsis aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {menu.map((list, index) => (
                  <Fragment key={index}>
                    {/* Single tools sit together; groups get a rule either side. */}
                    {index > 0 && (list.length > 1 || menu[index - 1]!.length > 1) && <DropdownMenuSeparator />}
                    <MenuUnit entries={list} />
                  </Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </TooltipProvider>
    </ToolbarContext.Provider>
  );
}

function MenuUnit({ entries }: { entries: Entry[] }) {
  const first = entries[0]!;
  if (first.kind === "option") {
    const chosen = entries.find((entry) => entry.kind === "option" && entry.checked);
    return (
      <>
        <DropdownMenuLabel>{first.groupLabel}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={chosen?.kind === "option" ? chosen.value : ""}>
          {entries.map((entry) =>
            entry.kind === "option" ? (
              <DropdownMenuRadioItem key={entry.value} value={entry.value} onSelect={entry.onSelect}>
                {entry.icon}
                {entry.label}
              </DropdownMenuRadioItem>
            ) : null,
          )}
        </DropdownMenuRadioGroup>
      </>
    );
  }
  return entries.map((entry) =>
    entry.kind === "toggle" ? (
      <DropdownMenuCheckboxItem key={entry.label} checked={entry.checked} disabled={entry.disabled} onSelect={entry.onSelect}>
        {entry.label}
      </DropdownMenuCheckboxItem>
    ) : entry.kind === "action" ? (
      <DropdownMenuItem key={entry.label} disabled={entry.disabled} onSelect={entry.onSelect}>
        {entry.icon}
        {entry.label}
      </DropdownMenuItem>
    ) : null,
  );
}

function ToolTip({ label, shortcut, show, children }: { label: string; shortcut?: string; show: boolean; children: ReactNode }) {
  if (!show && !shortcut) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut && <Kbd keys={shortcut} variant="inline" size="sm" />}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * One tool. With an icon and no `showLabel`, the label becomes its accessible
 * name and tooltip. Pass `pressed` to make it a toggle such as Bold.
 */
export function ToolbarButton({
  label,
  icon,
  showLabel = !icon,
  shortcut,
  pressed,
  onPressedChange,
  onClick,
  pinned = false,
  disabled,
  className,
}: {
  label: string;
  icon?: ReactNode;
  showLabel?: boolean;
  /** Shown in the tooltip, e.g. "mod+b". Your app listens for the keys. */
  shortcut?: string;
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  onClick?: () => void;
  /** Never folds into the More menu. */
  pinned?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const toggle = pressed !== undefined;
  const activate = () => (toggle ? onPressedChange?.(!pressed) : onClick?.());
  const entry = useEntry(toggle ? { kind: "toggle", label, icon, disabled, checked: !!pressed, onSelect: activate } : { kind: "action", label, icon, disabled, onSelect: activate });
  const unit = useUnit();
  return (
    <span data-toolbar-unit={unit.id} data-pinned={pinned ? "" : undefined} data-overflowed={unit.hidden ? "" : undefined}>
      <ToolTip label={label} shortcut={shortcut} show={!showLabel}>
        <Button
          variant="ghost"
          size={showLabel ? "sm" : "icon"}
          data-toolbar-item=""
          data-toolbar-entry={entry}
          aria-pressed={toggle ? pressed : undefined}
          aria-label={showLabel ? undefined : label}
          disabled={disabled}
          onClick={activate}
          className={className}
        >
          {icon}
          {showLabel && label}
        </Button>
      </ToolTip>
    </span>
  );
}

/**
 * Tools that belong together and fold together: `single` is one choice such
 * as alignment (a radio group), `multiple` is independent toggles such as
 * bold and italic.
 */
export function ToolbarToggleGroup({
  label,
  pinned = false,
  children,
  ...choice
}: {
  label: string;
  pinned?: boolean;
  children: ReactNode;
} & (
  | { type: "single"; value: string; onValueChange: (value: string) => void }
  | { type: "multiple"; value: readonly string[]; onValueChange: (value: string[]) => void }
)) {
  const { type } = choice;
  const unit = useUnit();
  const values = choice.type === "single" ? (choice.value ? [choice.value] : []) : choice.value;
  const toggle = (item: string) => {
    if (choice.type === "single") choice.onValueChange(item);
    else choice.onValueChange(values.includes(item) ? values.filter((v) => v !== item) : [...values, item]);
  };
  return (
    <GroupContext.Provider value={{ id: unit.id, label, type, values, toggle }}>
      <span
        role={type === "single" ? "radiogroup" : "group"}
        aria-label={label}
        data-slot="toolbar-group"
        data-toolbar-unit={unit.id}
        data-pinned={pinned ? "" : undefined}
        data-overflowed={unit.hidden ? "" : undefined}
      >
        {children}
      </span>
    </GroupContext.Provider>
  );
}

export function ToolbarToggleItem({ value, label, icon, shortcut, disabled }: { value: string; label: string; icon?: ReactNode; shortcut?: string; disabled?: boolean }) {
  const group = useContext(GroupContext);
  if (!group) throw new Error("ToolbarToggleItem belongs inside a ToolbarToggleGroup.");
  const on = group.values.includes(value);
  const single = group.type === "single";
  const select = () => group.toggle(value);
  const entry = useEntry(
    single
      ? { kind: "option", group: group.id, groupLabel: group.label, value, label, icon, checked: on, onSelect: select }
      : { kind: "toggle", label, icon, disabled, checked: on, onSelect: select },
  );
  return (
    <ToolTip label={label} shortcut={shortcut} show={!!icon}>
      <Button
        variant="ghost"
        size={icon ? "icon" : "sm"}
        data-toolbar-item=""
        data-toolbar-entry={entry}
        role={single ? "radio" : undefined}
        aria-checked={single ? on : undefined}
        aria-pressed={single ? undefined : on}
        data-on={on || undefined}
        aria-label={icon ? label : undefined}
        disabled={disabled}
        onClick={select}
      >
        {icon ?? label}
      </Button>
    </ToolTip>
  );
}

export function ToolbarSeparator() {
  const unit = useUnit();
  return (
    <span
      role="separator"
      aria-orientation={unit.orientation === "vertical" ? "horizontal" : "vertical"}
      data-slot="toolbar-separator"
      data-toolbar-unit={unit.id}
      data-separator=""
      data-overflowed={unit.hidden ? "" : undefined}
    />
  );
}

/**
 * Any other control in the row, such as a SelectMenu or a zoom field. It
 * joins the arrow-key order and stays visible when the row folds.
 */
export function ToolbarItem({ children, className }: { children: ReactNode; className?: string }) {
  const unit = useUnit();
  return (
    <span data-toolbar-unit={unit.id} data-toolbar-generic="" data-pinned="" className={className}>
      {children}
    </span>
  );
}
