"use client";

import { Search, X } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  type DialogContentProps,
} from "./dialog";
import { Input } from "./input";
import { cn } from "./lib/cn";
import "./command-palette.css";

export type CommandItem = {
  id: string;
  label: string;
  description?: string;
  group?: string;
  icon?: ReactNode;
  keywords?: readonly string[];
  disabled?: boolean;
  /** One disambiguating fact on the right, in mono: an amount, a role, a shortcut. */
  meta?: string;
  /** Shown in the side pane while the item is highlighted. */
  preview?: CommandPreview;
  onSelect: () => void;
};

export type CommandPreview = {
  kind: string;
  title: string;
  rows?: readonly (readonly [string, string])[];
  hint?: string;
};

/** Typing the prefix narrows the list to one group, shown as a chip. */
export type CommandScope = { prefix: string; label: string; group: string };

export type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: readonly CommandItem[];
  title?: string;
  description?: string;
  className?: string;
  onCloseAutoFocus?: DialogContentProps["onCloseAutoFocus"];
  scopes?: readonly CommandScope[];
  /** Offered when nothing matches, e.g. create an invoice for the typed name. */
  emptyAction?: { label: (query: string) => string; onSelect: (query: string) => void };
  /** The search field's prompt, naming what can be found, e.g. "Search people, companies and deals…". */
  placeholder?: string;
  /** What one item is called in the count and the empty state, singular and plural: ["result", "results"] for a site search. */
  noun?: readonly [string, string];
};

export function CommandPalette({
  open,
  onOpenChange,
  items,
  title = "Command palette",
  description = "Search destinations, projects, and actions.",
  className,
  onCloseAutoFocus,
  scopes = [],
  emptyAction,
  placeholder = "Find a project or action…",
  noun = ["command", "commands"],
}: CommandPaletteProps) {
  const hasPreview = items.some((item) => item.preview);
  // Esc leaves an active scope first; without a scope it closes.
  const clearOnEscape = useRef<(() => boolean) | null>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex flex-col gap-0 overflow-hidden rounded-[16px] p-0 sm:p-0",
          hasPreview ? "max-w-2xl" : "max-w-xl",
          className,
        )}
        onCloseAutoFocus={onCloseAutoFocus}
        onEscapeKeyDown={(event) => {
          if (clearOnEscape.current?.()) event.preventDefault();
        }}
      >
        <PaletteContent
          items={items}
          title={title}
          description={description}
          interactive={open}
          scopes={scopes}
          emptyAction={emptyAction}
          placeholder={placeholder}
          noun={noun}
          hasPreview={hasPreview}
          clearOnEscape={clearOnEscape}
          onSelect={(item) => {
            onOpenChange(false);
            item.onSelect();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function PaletteContent({
  items,
  title,
  description,
  interactive,
  onSelect,
  scopes,
  emptyAction,
  placeholder,
  noun,
  hasPreview,
  clearOnEscape,
}: {
  items: readonly CommandItem[];
  title: string;
  description: string;
  interactive: boolean;
  onSelect: (item: CommandItem) => void;
  scopes: readonly CommandScope[];
  emptyAction?: CommandPaletteProps["emptyAction"];
  placeholder: string;
  noun: readonly [string, string];
  hasPreview: boolean;
  clearOnEscape: { current: (() => boolean) | null };
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const activeOption = useRef<HTMLDivElement>(null);
  const options = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState<{
    top: number;
    height: number;
  } | null>(null);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [scopeId, setScopeId] = useState<string | null>(null);
  const scope = scopes.find((candidate) => candidate.prefix === scopeId);
  const search = query.trim().toLowerCase();
  const showIcons = items.some((item) => Boolean(item.icon));
  const groups = new Map<string, CommandItem[]>();
  for (const item of items) {
    const group = item.group ?? "";
    if (scope && group !== scope.group) continue;
    const grouped = groups.get(group) ?? [];
    groups.set(group, grouped);
    const text = [item.label, item.description, ...(item.keywords ?? [])]
      .join(" ")
      .toLowerCase();
    if (text.includes(search)) grouped.push(item);
  }
  const visibleGroups = [...groups.entries()].filter(
    ([, commands]) => commands.length,
  );
  const matched = visibleGroups.flatMap(([, commands]) => commands);
  const enabled = matched.filter((item) => !item.disabled);
  const active = enabled.find((item) => item.id === activeId) ?? enabled[0];
  const optionIds = new Map(
    matched.map((item, index) => [item.id, `${id}-option-${index}`]),
  );
  const listId = `${id}-commands`;

  useEffect(() => {
    activeOption.current?.scrollIntoView({
      block: "nearest",
      behavior: "instant",
    });
  }, [active?.id, search]);

  useLayoutEffect(() => {
    const list = options.current;
    const option = activeOption.current;
    if (!list || !option) {
      setHighlight(null);
      return;
    }
    const measure = () => {
      setHighlight({
        top: option.offsetTop,
        height: option.offsetHeight,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    observer.observe(option);
    return () => observer.disconnect();
  }, [active?.id, search]);

  function select(item: CommandItem) {
    if (interactive && !item.disabled) onSelect(item);
  }

  useEffect(() => {
    clearOnEscape.current = () => {
      if (!scope) return false;
      setScopeId(null);
      setActiveId(null);
      return true;
    };
  });

  function mark(text: string) {
    const at = search ? text.toLowerCase().indexOf(search) : -1;
    if (at < 0) return text;
    return (
      <>
        {text.slice(0, at)}
        <mark data-slot="command-match">{text.slice(at, at + search.length)}</mark>
        {text.slice(at + search.length)}
      </>
    );
  }

  function clearSearch() {
    setQuery("");
    setScopeId(null);
    setActiveId(null);
    input.current?.focus();
  }

  return (
    <>
      <div className="shrink-0 border-b border-border p-4">
        <DialogTitle className="pr-12 text-sm leading-5">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        <label htmlFor={`${id}-search`} className="sr-only">
          Search {noun[1]}
        </label>
        <div className="relative mt-3 flex items-center gap-2 rounded-surface bg-surface pl-3 focus-within:outline-solid focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
          <Search
            className="pointer-events-none size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          {scope && <span data-slot="command-scope">{scope.label}</span>}
          <Input
            ref={input}
            id={`${id}-search`}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={interactive}
            aria-controls={listId}
            aria-activedescendant={
              active ? optionIds.get(active.id) : undefined
            }
            autoComplete="off"
            spellCheck={false}
            placeholder={placeholder}
            value={query}
            readOnly={!interactive}
            className="flex-1 border-0 bg-transparent pl-0 pr-11 shadow-none focus-visible:shadow-none"
            onChange={(event) => {
              if (!interactive) return;
              const value = event.target.value;
              // Typing a scope prefix first turns it into a chip.
              const typed = !scope && scopes.find((candidate) => value.startsWith(candidate.prefix));
              if (typed) {
                setScopeId(typed.prefix);
                setQuery(value.slice(typed.prefix.length));
              } else {
                setQuery(value);
              }
              setActiveId(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !query && scope) {
                event.preventDefault();
                setScopeId(null);
                return;
              }
              if (
                !interactive ||
                event.nativeEvent.isComposing ||
                event.altKey ||
                event.ctrlKey ||
                event.metaKey ||
                event.shiftKey
              )
                return;
              if (event.key === "Enter" && active) {
                event.preventDefault();
                select(active);
              } else if (
                enabled.length &&
                (["ArrowDown", "ArrowUp"].includes(event.key) ||
                  (!query && ["Home", "End"].includes(event.key)))
              ) {
                event.preventDefault();
                const current = enabled.findIndex(
                  (item) => item.id === active?.id,
                );
                const next =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? enabled.length - 1
                      : (current +
                          (event.key === "ArrowDown" ? 1 : -1) +
                          enabled.length) %
                        enabled.length;
                setActiveId(enabled[next].id);
              }
            }}
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0"
              aria-label="Clear command search"
              onClick={clearSearch}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      <div className={cn("grid min-h-0", hasPreview && "md:grid-cols-[minmax(0,1fr)_240px]")}>
      <div className="min-h-0 max-h-[min(28rem,60dvh)] overflow-y-auto overscroll-contain p-2">
        <div
          ref={options}
          id={listId}
          role="listbox"
          aria-label="Commands"
          className="relative isolate"
        >
          {highlight && (
            <div
              key={search}
              data-slot="command-highlight"
              aria-hidden="true"
              style={{
                height: highlight.height,
                transform: `translateY(${highlight.top}px)`,
              }}
            />
          )}
          {visibleGroups.map(([group, commands], groupIndex) => (
            <div key={group} role="group" aria-label={group || undefined}>
              {group && (
                <p
                  className={cn(
                    "px-3 pb-1 text-xs font-medium text-muted-foreground",
                    groupIndex ? "pt-3" : "pt-1",
                  )}
                >
                  {group}
                </p>
              )}
              {commands.map((item) => {
                const selected = active?.id === item.id;
                return (
                  <div
                    data-slot="command-option"
                    key={item.id}
                    id={optionIds.get(item.id)}
                    ref={selected ? activeOption : undefined}
                    role="option"
                    aria-selected={selected}
                    aria-disabled={item.disabled || undefined}
                    className={cn(
                      "flex min-h-[var(--control-height)] cursor-pointer items-center gap-3 rounded-surface px-3 text-sm font-medium",
                      item.description && "py-2",
                      "text-foreground",
                      item.disabled &&
                        "cursor-not-allowed text-muted-foreground hover:bg-transparent",
                    )}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => {
                      if (!item.disabled && interactive) setActiveId(item.id);
                    }}
                    onClick={() => select(item)}
                  >
                    {showIcons && (
                      <span
                        className="flex size-5 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-4"
                        aria-hidden="true"
                      >
                        {item.icon}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-5 font-medium break-words [overflow-wrap:anywhere]">
                        {mark(item.label)}
                      </span>
                      {item.description && (
                        <span className="block text-xs leading-4 text-muted-foreground break-words [overflow-wrap:anywhere]">
                          {item.description}
                        </span>
                      )}
                    </span>
                    {item.meta && !item.disabled && (
                      <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                        {item.meta}
                      </span>
                    )}
                    {item.disabled && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        Unavailable
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {!matched.length && (
          <div className="px-3 py-6 text-center">
            <p className="text-sm font-medium">No {noun[1]} found</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground break-words [overflow-wrap:anywhere]">
              {search
                ? `Nothing matches “${query.trim()}”. Try another word or a shorter one.`
                : `There are no ${noun[1]} in this context.`}
            </p>
            {search && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {emptyAction && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => emptyAction.onSelect(search)}
                  >
                    {emptyAction.label(search)}
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={clearSearch}>
                  Clear search
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      {hasPreview && (
        <div data-slot="command-preview" aria-live="polite" className="hidden md:flex">
          {active?.preview ? (
            <>
              <span className="tabular-nums text-[11px] tracking-[0.06em] text-muted-foreground uppercase">{active.preview.kind}</span>
              <span className="text-base leading-6 font-semibold">{active.preview.title}</span>
              {active.preview.rows && (
                <dl className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-2.5 gap-y-1.5 text-[13px] leading-[18px]">
                  {active.preview.rows.map(([key, value]) => (
                    <div key={key} className="contents">
                      <dt className="text-muted-foreground">{key}</dt>
                      <dd className="m-0 tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {active.preview.hint && <span className="mt-auto text-xs text-muted-foreground">{active.preview.hint}</span>}
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Highlight a result to preview it.</span>
          )}
        </div>
      )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border px-4 py-3 text-xs leading-5 text-muted-foreground">
        <p role="status" aria-atomic="true">
          {matched.length} {matched.length === 1 ? noun[0] : noun[1]}
        </p>
        <p className="hidden sm:block">
          <span aria-hidden="true">↑↓</span> Navigate · Enter Select · Esc Close
        </p>
      </div>
    </>
  );
}
