"use client";

import * as Primitive from "@radix-ui/react-dropdown-menu";
import { Check, Circle } from "lucide-react";
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { GlideHighlight, useHighlightedGlide } from "./glide-highlight";
import { cn } from "./lib/cn";
import "./shared/dropdown-content.css";
import "./dropdown-menu.css";

export const DropdownMenu = Primitive.Root;
export const DropdownMenuTrigger = Primitive.Trigger;
export const DropdownMenuGroup = Primitive.Group;
export const DropdownMenuRadioGroup = Primitive.RadioGroup;

export function DropdownMenuContent({
  className,
  sideOffset = 8,
  collisionPadding = 16,
  children,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  const [content, setContent] = useState<HTMLDivElement | null>(null);
  const box = useHighlightedGlide(content);
  return (
    <Primitive.Portal>
      <Primitive.Content
        ref={setContent}
        data-slot="dropdown-content"
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          "relative z-50 min-w-56 max-w-[calc(100vw-2rem)] max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto rounded-surface border border-border bg-elevated p-1 text-[13px] text-foreground shadow-overlay outline-none",
          className,
        )}
        {...props}
      >
        <GlideHighlight box={box} />
        {children}
      </Primitive.Content>
    </Primitive.Portal>
  );
}

/** Row anatomy shared by every menu: dropdown, menubar and context menus. */
export const menuItemClass =
  "relative z-10 flex min-h-[34px] max-md:min-h-[var(--control-height)] cursor-default select-none items-center gap-2.5 rounded-control px-2.5 text-[13px] font-normal outline-none data-[highlighted]:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[variant=destructive]:text-destructive [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground data-[variant=destructive]:[&_svg]:text-destructive";

export function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof Primitive.Item>) {
  return (
    <Primitive.Item
      data-slot="dropdown-item"
      className={cn(menuItemClass, className)}
      {...props}
    />
  );
}
export function DropdownMenuCheckboxItem({
  className,
  children,
  ...props
}: ComponentProps<typeof Primitive.CheckboxItem>) {
  return (
    <Primitive.CheckboxItem
      data-slot="dropdown-item"
      className={cn(menuItemClass, "pl-8", className)}
      {...props}
    >
      <span className="absolute left-2.5 flex size-4 items-center justify-center">
        <Primitive.ItemIndicator>
          <Check aria-hidden="true" />
        </Primitive.ItemIndicator>
      </span>
      {children}
    </Primitive.CheckboxItem>
  );
}
export function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof Primitive.RadioItem>) {
  return (
    <Primitive.RadioItem
      data-slot="dropdown-item"
      className={cn(menuItemClass, "pl-8", className)}
      {...props}
    >
      <span className="absolute left-2.5 flex size-4 items-center justify-center">
        <Primitive.ItemIndicator>
          <Circle className="!size-2 fill-current" aria-hidden="true" />
        </Primitive.ItemIndicator>
      </span>
      {children}
    </Primitive.RadioItem>
  );
}
export function DropdownMenuLabel({
  className,
  ...props
}: ComponentProps<typeof Primitive.Label>) {
  return (
    <Primitive.Label
      className={cn(
        "px-2.5 pb-1 pt-2 text-xs font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof Primitive.Separator>) {
  return (
    <Primitive.Separator
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

export function DropdownMenuShortcut({
  className,
  ...props
}: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "ml-auto pl-4 font-mono text-xs tracking-wide text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

/**
 * A destructive item that asks in place: choosing it turns the row into the
 * question with Cancel and the confirming action, instead of stacking a
 * dialog on the menu. Both answers are menu items, so arrows and Enter work.
 */
export function DropdownMenuConfirmItem({
  label,
  icon,
  question,
  detail,
  confirmLabel = "Delete",
  onConfirm,
}: {
  label: string;
  icon?: ReactNode;
  /** e.g. "Delete 3 files?" */
  question: string;
  /** e.g. "They move to Trash for 30 days." */
  detail?: string;
  confirmLabel?: string;
  onConfirm: () => void;
}) {
  const [asking, setAsking] = useState(false);
  const cancel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (asking) cancel.current?.focus();
  }, [asking]);
  if (!asking) {
    return (
      <DropdownMenuItem
        data-variant="destructive"
        onSelect={(event) => {
          event.preventDefault();
          setAsking(true);
        }}
      >
        {icon}
        {label}
      </DropdownMenuItem>
    );
  }
  return (
    <div data-slot="menu-confirm" role="group" aria-label={question}>
      <p className="px-2.5 pt-2 text-[13px] font-medium text-destructive">{question}</p>
      {detail && <p className="px-2.5 pb-1 text-xs text-muted-foreground">{detail}</p>}
      <DropdownMenuItem
        ref={cancel}
        onSelect={(event) => {
          event.preventDefault();
          setAsking(false);
        }}
      >
        Cancel
      </DropdownMenuItem>
      <DropdownMenuItem data-variant="destructive" onSelect={onConfirm}>
        {icon}
        {confirmLabel}
      </DropdownMenuItem>
    </div>
  );
}
