"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from "react";
import { Button, type ButtonProps } from "./button";
import { ButtonGroup } from "./button-group";
import "./toggle.css";

export type ToggleProps = Omit<ButtonProps, "variant" | "aria-pressed"> & {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
};

/**
 * A button that stays pressed: bold, pin, mute. Pressed is recessed, the way a toggled tool
 * in a button group is, so "on" never looks like a selected tab. Give an icon-only toggle an
 * aria-label; the pressed state is announced by `aria-pressed`.
 */
export function Toggle({ pressed, defaultPressed = false, onPressedChange, onClick, ...props }: ToggleProps) {
  const [own, setOwn] = useState(defaultPressed);
  const on = pressed ?? own;
  return (
    <Button
      variant="ghost"
      {...props}
      data-toggle=""
      aria-pressed={on}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (pressed === undefined) setOwn(!on);
        onPressedChange?.(!on);
      }}
    />
  );
}

type GroupContext = {
  type: "single" | "multiple";
  values: string[];
  disabled?: boolean;
  toggle: (value: string) => void;
};
const Context = createContext<GroupContext | null>(null);

export type ToggleGroupProps = Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "aria-label"> & {
  /** Single behaves like a radio group: one value, always one selected. Multiple lets any combination stay on. */
  type?: "single" | "multiple";
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** Names the group for assistive technology, such as "Text style". */
  label: string;
  disabled?: boolean;
};

/**
 * A row of toggles in the raised Button Group shell. The group is one tab stop; arrow keys,
 * Home and End move between items (and select, in single mode). Arrow keys follow the
 * reading direction, so the group works right to left.
 */
export function ToggleGroup({
  type = "multiple",
  value,
  defaultValue = [],
  onValueChange,
  label,
  disabled,
  onKeyDown,
  children,
  ...props
}: ToggleGroupProps) {
  const [own, setOwn] = useState(defaultValue);
  const values = value ?? own;
  const root = useRef<HTMLDivElement>(null);

  function set(next: string[]) {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }
  function toggle(item: string) {
    if (type === "single") set([item]);
    else set(values.includes(item) ? values.filter((entry) => entry !== item) : [...values, item]);
  }

  const items = () => Array.from(root.current?.querySelectorAll<HTMLElement>('[data-slot="button"]:not(:disabled)') ?? []);
  // One tab stop: the item last focused, else the selected one, else the first. It lives on the
  // elements, so arrow keys and clicks can move it without re-rendering the group.
  const lastStop = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const all = items();
    const stop =
      all.find((item) => item === lastStop.current) ??
      all.find((item) => item.getAttribute("aria-checked") === "true" || item.getAttribute("aria-pressed") === "true") ??
      all[0];
    for (const item of all) item.tabIndex = item === stop ? 0 : -1;
  });

  function keys(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || !root.current) return;
    const all = items();
    const at = all.indexOf(document.activeElement as HTMLElement);
    if (at < 0) return;
    const rtl = getComputedStyle(root.current).direction === "rtl";
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    let next: HTMLElement | undefined;
    if (event.key === forward || event.key === "ArrowDown") next = all[(at + 1) % all.length];
    else if (event.key === back || event.key === "ArrowUp") next = all[(at - 1 + all.length) % all.length];
    else if (event.key === "Home") next = all[0];
    else if (event.key === "End") next = all[all.length - 1];
    if (!next) return;
    event.preventDefault();
    lastStop.current = next;
    for (const item of all) item.tabIndex = item === next ? 0 : -1;
    next.focus();
    if (type === "single") next.click();
  }

  return (
    <Context.Provider value={{ type, values, disabled, toggle }}>
      <ButtonGroup
        ref={root}
        aria-label={label}
        onKeyDown={keys}
        onFocusCapture={(event) => {
          // A click or Tab landing on an item makes it the tab stop too.
          const target = event.target as HTMLElement;
          if (items().includes(target)) {
            lastStop.current = target;
            for (const item of items()) item.tabIndex = item === target ? 0 : -1;
          }
        }}
        {...props}
      >
        {children}
      </ButtonGroup>
    </Context.Provider>
  );
}

export type ToggleGroupItemProps = Omit<ButtonProps, "variant" | "value"> & { value: string };

export function ToggleGroupItem({ value, onClick, disabled, ...props }: ToggleGroupItemProps) {
  const group = useContext(Context);
  if (!group) throw new Error("ToggleGroupItem must be inside a ToggleGroup.");
  const on = group.values.includes(value);
  return (
    <Button
      variant="ghost"
      {...props}
      {...(group.type === "single" ? { role: "radio", "aria-checked": on } : { "aria-pressed": on })}
      disabled={group.disabled || disabled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) group.toggle(value);
      }}
    />
  );
}
