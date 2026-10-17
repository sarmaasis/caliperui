"use client";

import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "./lib/cn";
import "./shared/select.css";
import "./shared/input-2.css";
import "./select-menu.css";

export type SelectMenuOption = {
  value: string;
  label: string;
  /** Short identifier shown in mono at the end of the row, e.g. "eu-central-1". */
  code?: string;
  /** A 16px mark before the label, e.g. a network dot or a person's initials. */
  icon?: ReactNode;
  disabled?: boolean;
};

const ROW = 36;
const PAD = 4;

function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarse(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return coarse;
}

/**
 * A select whose list opens with the chosen option lying exactly over the
 * trigger text, so the eye never jumps. On touch screens it is the platform
 * picker. A hidden input carries the value in native forms.
 */
export function SelectMenu({
  options,
  value: controlled,
  defaultValue,
  onValueChange,
  placeholder = "Choose…",
  name,
  disabled,
  size = "md",
  variant = "field",
  className,
  ref,
  ...aria
}: {
  options: readonly SelectMenuOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  /** Submitted with the form. */
  name?: string;
  disabled?: boolean;
  /** sm is 32px for toolbars, filters and table rows; md follows the control height. */
  size?: "sm" | "md";
  /** ghost drops the field ring, for a select inside a composed control (a currency in a money field). */
  variant?: "field" | "ghost";
  className?: string;
  /** The trigger (or, on touch screens, the native select), e.g. for a dialog's first focus. */
  ref?: Ref<HTMLButtonElement | HTMLSelectElement>;
} & Pick<ComponentProps<"button">, "id" | "aria-label" | "aria-labelledby" | "aria-describedby" | "aria-invalid" | "aria-required">) {
  const listId = useId();
  const coarse = useCoarsePointer();
  const [inner, setInner] = useState(defaultValue);
  const value = controlled ?? inner;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [offset, setOffset] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selected = options.find((option) => option.value === value);

  // If the change handler moves focus on (e.g. into a reply box), leave it there when the list closes.
  const keepFocus = useRef(false);
  // A form may disable the trigger while it saves the choice. Focus cannot return to a disabled button,
  // so it returns as soon as the trigger is enabled again, unless the reader has moved on by then.
  const refocus = useRef(false);
  useEffect(() => {
    if (disabled || !refocus.current) return;
    refocus.current = false;
    const now = document.activeElement;
    if (!now || now === document.body) trigger.current?.focus();
  }, [disabled]);
  function choose(next: string) {
    if (controlled === undefined) setInner(next);
    onValueChange?.(next);
    const now = document.activeElement;
    keepFocus.current = !!now && now !== document.body && now !== trigger.current && !list.current?.contains(now);
  }

  function openList(nextOpen: boolean) {
    if (nextOpen && trigger.current) {
      // Lay the selected row over the trigger, unless that would leave the viewport.
      const rect = trigger.current.getBoundingClientRect();
      const above = PAD + selectedIndex * ROW;
      const fits = rect.top - above > 8 && rect.top - above + options.length * ROW + PAD * 2 < window.innerHeight - 8;
      setOffset(fits ? -(rect.height + above) - (ROW - rect.height) / 2 : 6);
      setActive(selectedIndex);
    }
    setOpen(nextOpen);
  }

  function move(delta: number) {
    let next = active;
    for (let step = 0; step < options.length; step += 1) {
      next = Math.min(options.length - 1, Math.max(0, next + delta));
      if (!options[next].disabled) break;
    }
    setActive(next);
  }

  function onListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowDown") move(1);
    else if (event.key === "ArrowUp") move(-1);
    else if (event.key === "Home") setActive(options.findIndex((option) => !option.disabled));
    else if (event.key === "End") setActive(options.length - 1 - [...options].reverse().findIndex((option) => !option.disabled));
    else if (event.key === "Enter" || event.key === " ") {
      const option = options[active];
      if (option && !option.disabled) {
        choose(option.value);
        setOpen(false);
      }
    } else if (event.key === "Tab") setOpen(false);
    else if (/^\S$/.test(event.key)) {
      const start = (active + 1) % options.length;
      const order = [...options.slice(start), ...options.slice(0, start)];
      const hit = order.find((option) => !option.disabled && option.label.toLowerCase().startsWith(event.key.toLowerCase()));
      if (hit) setActive(options.indexOf(hit));
    } else return;
    event.preventDefault();
  }

  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  if (coarse) {
    return (
      <span data-slot="select-menu-native" data-size={size} data-variant={variant} className={cn("relative block", className)}>
        <select
          ref={ref as Ref<HTMLSelectElement>}
          data-slot="select"
          {...aria}
          name={name}
          disabled={disabled}
          value={value ?? ""}
          onChange={(event) => choose(event.target.value)}
          className={cn(
            "block w-full min-w-0 appearance-none text-base text-foreground outline-none",
            size === "sm" ? "h-8 rounded-control pr-8 pl-2.5" : "h-[var(--control-height)] rounded-button pr-9 pl-3",
          )}
        >
          {!selected && <option value="" disabled>{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
              {option.code ? ` · ${option.code}` : ""}
            </option>
          ))}
        </select>
        <ChevronsUpDown aria-hidden="true" className={cn("pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground", size === "sm" ? "right-2.5" : "right-3")} />
      </span>
    );
  }

  return (
    <Popover.Root open={open} onOpenChange={openList}>
      <Popover.Trigger asChild>
        <button
          ref={(node) => {
            trigger.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as { current: HTMLButtonElement | HTMLSelectElement | null }).current = node;
          }}
          type="button"
          data-slot="select-menu"
          data-size={size}
          data-variant={variant}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          disabled={disabled}
          {...aria}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              openList(true);
            }
          }}
          className={cn(
            "flex w-full min-w-0 items-center justify-between gap-2 text-left text-foreground outline-none disabled:cursor-not-allowed",
            size === "sm" ? "h-8 rounded-control px-2.5 text-[13px]" : "h-[var(--control-height)] rounded-button px-3 text-base md:text-sm",
            className,
          )}
        >
          <span className={cn("flex min-w-0 items-center gap-2", !selected && "text-muted-foreground")}>
            {selected?.icon && <span data-slot="select-menu-icon" aria-hidden="true">{selected.icon}</span>}
            <span className="truncate">{selected ? selected.label : placeholder}</span>
            {selected?.code && <span data-slot="select-menu-code" className="shrink-0">{selected.code}</span>}
          </span>
          <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </Popover.Trigger>
      {name && <input type="hidden" name={name} value={value ?? ""} />}
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={offset}
          alignOffset={-28}
          avoidCollisions={offset > 0}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            keepFocus.current = false;
            list.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            if (keepFocus.current) event.preventDefault();
            else if (trigger.current?.disabled) {
              event.preventDefault();
              refocus.current = true;
            }
          }}
          data-slot="select-menu-content"
          style={{ width: "calc(var(--radix-popover-trigger-width) + 36px)", transformOrigin: `50% ${PAD + selectedIndex * ROW + ROW / 2}px` }}
        >
          <div
            ref={list}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={aria["aria-labelledby"]}
            aria-label={aria["aria-label"]}
            aria-activedescendant={`${listId}-${active}`}
            onKeyDown={onListKeyDown}
            className="max-h-[calc(8*36px+8px)] overflow-y-auto p-1 outline-none"
          >
            {options.map((option, index) => (
              <div
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                data-index={index}
                aria-selected={option.value === value}
                aria-disabled={option.disabled || undefined}
                data-active={index === active}
                data-slot="select-menu-option"
                onPointerMove={() => !option.disabled && setActive(index)}
                onClick={() => {
                  if (option.disabled) return;
                  choose(option.value);
                  setOpen(false);
                }}
              >
                <span className="grid size-4 place-items-center">{option.value === value && <Check aria-hidden="true" className="size-4" />}</span>
                {option.icon && <span data-slot="select-menu-icon" aria-hidden="true">{option.icon}</span>}
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {option.code && <span data-slot="select-menu-code">{option.code}</span>}
              </div>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
