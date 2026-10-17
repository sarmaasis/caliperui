"use client";

import { Check, ChevronDown, Plus } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Label } from "./label";
import { cn } from "./lib/cn";
import "./shared/input.css";
import "./shared/input-2.css";
import "./combobox.css";

export type ComboboxOption = {
  value: string;
  label: string;
  group?: string;
  keywords?: readonly string[];
  disabled?: boolean;
};

export function Combobox({
  label,
  options,
  value,
  defaultValue = "",
  onValueChange,
  placeholder = "Search",
  name,
  disabled,
  id,
  className,
  onCreate,
  createLabel = (query: string) => `Add “${query}”`,
}: {
  label: string;
  options: readonly ComboboxOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  /** Offered when nothing matches, e.g. invite someone by the typed name. */
  onCreate?: (query: string) => void;
  createLabel?: (query: string) => string;
}) {
  const generated = useId();
  const fieldId = id ?? generated;
  const listId = `${fieldId}-list`;
  const root = useRef<HTMLDivElement>(null);
  const [local, setLocal] = useState(defaultValue);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const current = value ?? local;
  const selected = options.find((option) => option.value === current);
  const needle = query.trim().toLowerCase();
  const matches = options.filter((option) => {
    if (!needle) return true;
    return `${option.label} ${option.value} ${(option.keywords ?? []).join(" ")}`.toLowerCase().includes(needle);
  });
  const enabled = matches.filter((option) => !option.disabled);

  function highlight(text: string) {
    if (!needle) return text;
    const at = text.toLowerCase().indexOf(needle);
    if (at < 0) return text;
    return (
      <>
        {text.slice(0, at)}
        <mark data-slot="combobox-match">{text.slice(at, at + needle.length)}</mark>
        {text.slice(at + needle.length)}
      </>
    );
  }

  function choose(next: string) {
    if (value == null) setLocal(next);
    onValueChange?.(next);
    setQuery("");
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  return (
    <div ref={root} className={cn("grid max-w-sm gap-1.5", className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <div className="relative">
        <input
          id={fieldId}
          data-slot="input"
          role="combobox"
          disabled={disabled}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && matches[active] ? `${listId}-${matches[active].value}` : undefined}
          placeholder={placeholder}
          value={open ? query : (selected?.label ?? "")}
          className="h-[var(--control-height)] w-full rounded-button pr-9 pl-3 text-base outline-none placeholder:text-muted-foreground md:text-sm"
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          onChange={(event) => {
            setQuery(event.currentTarget.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              setActive((index) => {
                const step = event.key === "ArrowDown" ? 1 : -1;
                let next = index;
                for (let count = 0; count < matches.length; count += 1) {
                  next = (next + step + matches.length) % matches.length;
                  if (!matches[next]?.disabled) return next;
                }
                return index;
              });
            } else if (event.key === "Enter" && open && enabled[0]) {
              event.preventDefault();
              const pick = matches[active] && !matches[active].disabled ? matches[active] : enabled[0];
              if (pick) choose(pick.value);
            } else if (event.key === "Escape") {
              setQuery("");
              setOpen(false);
            }
          }}
        />
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground transition-transform duration-[var(--duration-fast)] ease-out motion-reduce:transition-none",
            open && "rotate-180",
            disabled && "opacity-45",
          )}
        />
        {open && <div id={listId} role="listbox" data-slot="combobox-menu" data-open="true" aria-label={label}>
          <div className="p-1">
            {matches.length === 0 ? (
              <div role="status" className="grid gap-1 px-2 py-3">
                <p className="text-sm font-medium">No matches for “{query.trim()}”</p>
                <p className="text-xs text-muted-foreground">Check the spelling{onCreate ? ", or add it." : "."}</p>
                {onCreate && query.trim() && (
                  <button
                    type="button"
                    className="mt-2 flex h-[var(--control-height)] w-full items-center gap-2 rounded-[10px] bg-muted px-2 text-left text-sm font-medium outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-ring"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onCreate(query.trim());
                      setQuery("");
                      setOpen(false);
                    }}
                  >
                    <Plus aria-hidden="true" className="size-4" />
                    {createLabel(query.trim())}
                  </button>
                )}
              </div>
            ) : (
              matches.map((option, index) => (
                <button
                  key={option.value}
                  id={`${listId}-${option.value}`}
                  type="button"
                  role="option"
                  aria-selected={option.value === current}
                  aria-disabled={option.disabled || undefined}
                  data-highlighted={index === active || undefined}
                  className="flex h-[var(--control-height)] w-full items-center justify-between rounded-surface px-2 text-left text-sm font-medium outline-none data-[highlighted]:bg-muted aria-disabled:opacity-45 aria-selected:font-semibold"
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => {
                    if (!option.disabled) choose(option.value);
                  }}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Check aria-hidden="true" className={cn("size-3.5 shrink-0", option.value !== current && "opacity-0")} />
                    <span className="truncate">{highlight(option.label)}</span>
                  </span>
                  {option.group && <span className="text-xs font-normal text-muted-foreground">{option.group}</span>}
                </button>
              ))
            )}
          </div>
        </div>}
        {name ? <input type="hidden" name={name} value={current} /> : null}
        <span className="sr-only" aria-live="polite">
          {open && needle ? `${matches.length} ${matches.length === 1 ? "result" : "results"}` : ""}
        </span>
      </div>
    </div>
  );
}
