"use client";

import * as Primitive from "@radix-ui/react-tabs";
import { Slottable } from "@radix-ui/react-slot";
import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { cn } from "./lib/cn";
import "./tabs.css";

export const Tabs = Primitive.Root;

/**
 * Tabs. The default underline variant moves one 2px accent line between tabs
 * on the settle curve while the panel swaps at once; labels never change
 * weight, so nothing shifts. The plate variant fills the active tab with the accent.
 */
export function TabsList({
  className,
  children,
  ref,
  variant = "underline",
  ...props
}: ComponentProps<typeof Primitive.List> & { variant?: "underline" | "plate" }) {
  const list = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  useImperativeHandle(ref, () => list.current!, []);
  useLayoutEffect(() => {
    const element = list.current;
    if (!element) return;
    const measure = () => {
      const active = element.querySelector<HTMLElement>(
        '[role="tab"][data-state="active"]',
      );
      setIndicator(
        active
          ? {
              left:
                active.getBoundingClientRect().left -
                element.getBoundingClientRect().left +
                element.scrollLeft,
              top:
                active.getBoundingClientRect().top -
                element.getBoundingClientRect().top +
                element.scrollTop,
              width: active.offsetWidth,
              height: active.offsetHeight,
            }
          : null,
      );
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    element
      .querySelectorAll('[role="tab"]')
      .forEach((tab) => resize.observe(tab));
    const selection = new MutationObserver(measure);
    selection.observe(element, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-state", "data-orientation", "dir"],
    });
    return () => {
      resize.disconnect();
      selection.disconnect();
    };
  }, [children]);
  return (
    <Primitive.List
      ref={list}
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(
        "relative isolate inline-flex max-w-full gap-1 overflow-auto data-[orientation=vertical]:flex-col",
        variant === "plate" ? "rounded-overlay bg-surface p-1" : "shadow-[inset_0_-1px_0_var(--border)]",
        className,
      )}
      {...props}
    >
      {indicator && (
        <span
          aria-hidden="true"
          data-slot="tabs-indicator"
          style={{
            width: indicator.width,
            height: indicator.height,
            transform: `translate(${indicator.left}px, ${indicator.top}px)`,
          }}
        />
      )}
      <Slottable>{children}</Slottable>
    </Primitive.List>
  );
}

export function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof Primitive.Trigger>) {
  return (
    <Primitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative flex h-[var(--control-height)] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-surface px-3 text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:outline-solid focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-45 data-[state=active]:text-foreground in-data-[variant=plate]:data-[state=active]:text-accent-foreground [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  );
}

/** A count inside a tab, e.g. 128 invoices. Part of the tab's accessible name. */
export function TabsCount({ className, ...props }: ComponentProps<"span">) {
  return <span data-slot="tabs-count" className={className} {...props} />;
}

export function TabsContent({
  className,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Content
      data-slot="tabs-content"
      className={cn(
        "mt-5 min-w-0 rounded-surface outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[state=inactive]:hidden",
        className,
      )}
      {...props}
    />
  );
}
