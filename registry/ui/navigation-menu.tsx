"use client";

import * as Primitive from "@radix-ui/react-navigation-menu";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { useLayoutEffect, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import { GlideHighlight, glideBox, type GlideBox } from "./glide-highlight";
import { cn } from "./lib/cn";
import "./navigation-menu.css";

/**
 * A site header's destinations, some with a panel of links. Hover waits for
 * intent before opening, a highlight glides between items, and the frosted
 * panel follows from one item to the next by resizing in place rather than
 * closing and opening again. Every panel is reachable by keyboard: Enter or
 * ↓ opens it, Tab walks its links, Escape closes it and returns to its item.
 * Below a tablet width use a drawer instead: a flyout is a pointer pattern.
 */
export function NavigationMenu({ className, children, ...props }: ComponentProps<typeof Primitive.Root>) {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  // The panel starts under its item and glides to the next one, but never past the window edge.
  useLayoutEffect(() => {
    if (!root) return;
    const anchor = root.querySelector<HTMLElement>('[data-slot="navigation-viewport-anchor"]');
    if (!anchor) return;
    let wasOpen = false;
    const place = () => {
      const viewport = anchor.querySelector<HTMLElement>('[data-slot="navigation-viewport"]');
      const trigger = root.querySelector<HTMLElement>('[data-slot="navigation-item-control"][data-state="open"]');
      if (!viewport || !trigger) {
        wasOpen = false;
        return;
      }
      const width = parseFloat(viewport.style.getPropertyValue("--radix-navigation-menu-viewport-width")) || viewport.offsetWidth;
      const box = root.getBoundingClientRect();
      const wanted = trigger.getBoundingClientRect().left - box.left - 8;
      const left = Math.max(16 - box.left, Math.min(wanted, window.innerWidth - 16 - width - box.left));
      anchor.toggleAttribute("data-instant", !wasOpen);
      anchor.style.setProperty("--nav-offset", `${Math.round(left)}px`);
      wasOpen = true;
    };
    place();
    const observer = new MutationObserver(place);
    observer.observe(root, { subtree: true, attributes: true, attributeFilter: ["data-state", "style"] });
    window.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [root]);
  return (
    <Primitive.Root ref={setRoot} data-slot="navigation-menu" className={cn("relative z-20 flex max-w-full", className)} {...props}>
      {children}
      <div data-slot="navigation-viewport-anchor" className="absolute top-full left-0">
        <Primitive.Viewport data-slot="navigation-viewport" />
      </div>
    </Primitive.Root>
  );
}

export function NavigationMenuList({ className, children, ...props }: ComponentProps<typeof Primitive.List>) {
  const [list, setList] = useState<HTMLUListElement | null>(null);
  const [box, setBox] = useState<GlideBox | null>(null);
  // The highlight sits under the item you point at or focus, and rests on the open item otherwise.
  useLayoutEffect(() => {
    if (!list) return;
    const update = () => {
      const target =
        list.querySelector<HTMLElement>('[data-slot="navigation-item-control"][data-hovered]') ??
        list.querySelector<HTMLElement>('[data-slot="navigation-item-control"][data-state="open"]');
      setBox((current) => (target ? glideBox(target) : current ? { ...current, active: false } : null));
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(list, { subtree: true, attributes: true, attributeFilter: ["data-state", "data-hovered"] });
    return () => observer.disconnect();
  }, [list]);
  return (
    <Primitive.List
      ref={setList}
      data-slot="navigation-list"
      className={cn("relative flex items-center gap-0.5", className)}
      onPointerOver={(event) => markHover(list, event.target)}
      onPointerLeave={() => markHover(list, null)}
      onFocus={(event) => markHover(list, event.target)}
      onBlur={() => markHover(list, null)}
      {...props}
    >
      <GlideHighlight box={box} />
      {children}
    </Primitive.List>
  );
}

/* Pointer and focus position, mirrored in an attribute the observer above can watch. */
function markHover(list: HTMLElement | null, target: EventTarget | null) {
  if (!list) return;
  const control = target instanceof Element ? target.closest('[data-slot="navigation-item-control"]') : null;
  list.querySelectorAll("[data-hovered]").forEach((element) => element !== control && element.removeAttribute("data-hovered"));
  if (control && list.contains(control)) control.setAttribute("data-hovered", "");
}

export const NavigationMenuItem = Primitive.Item;

const control =
  "relative z-10 inline-flex h-9 select-none items-center gap-1 rounded-[10px] px-3 text-[13px] font-medium text-muted-foreground outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:text-foreground focus-visible:text-foreground focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[state=open]:text-foreground data-[active]:text-foreground";

export function NavigationMenuTrigger({ className, children, ...props }: ComponentProps<typeof Primitive.Trigger>) {
  return (
    <Primitive.Trigger data-slot="navigation-item-control" className={cn(control, "cursor-default", className)} {...props}>
      {children}
      <ChevronDown aria-hidden="true" data-slot="navigation-chevron" className="size-3.5" />
    </Primitive.Trigger>
  );
}

/** A top-level destination without a panel. Pass `active` on the current page. */
export function NavigationMenuLink({ className, ...props }: ComponentProps<typeof Primitive.Link>) {
  return <Primitive.Link data-slot="navigation-item-control" className={cn(control, className)} {...props} />;
}

export function NavigationMenuContent({ className, ...props }: ComponentProps<typeof Primitive.Content>) {
  return <Primitive.Content data-slot="navigation-content" className={cn("p-2", className)} {...props} />;
}

/**
 * A link inside a panel: an optional icon, a title and one line saying what
 * is there. `external` adds an arrow and opens a new tab.
 */
export function NavigationMenuCard({
  href,
  title,
  description,
  icon,
  external = false,
  active,
  className,
}: {
  href: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  external?: boolean;
  active?: boolean;
  className?: string;
}) {
  return (
    <Primitive.Link asChild active={active}>
      <a
        href={href}
        data-slot="navigation-card"
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        aria-current={active ? "page" : undefined}
        className={className}
      >
        {icon && <span data-slot="navigation-card-icon" aria-hidden="true">{icon}</span>}
        <span className="grid min-w-0 gap-0.5">
          <span className="inline-flex items-center gap-1 text-[13px] font-medium text-foreground">
            {title}
            {external && (
              <>
                <ArrowUpRight aria-hidden="true" className="size-3.5 text-muted-foreground" />
                <span className="sr-only">(opens in a new tab)</span>
              </>
            )}
          </span>
          {description && <span className="text-xs leading-[18px] text-muted-foreground">{description}</span>}
        </span>
      </a>
    </Primitive.Link>
  );
}

/**
 * Lays a panel out in labelled columns, with an optional featured cell on
 * the end (a launch, a guide). Columns stack in a narrow viewport.
 */
export function NavigationMenuPanel({
  columns,
  featured,
  className,
}: {
  columns: readonly { title?: string; links: readonly ComponentProps<typeof NavigationMenuCard>[] }[];
  featured?: ReactNode;
  className?: string;
}) {
  return (
    <div data-slot="navigation-panel" data-featured={featured ? "" : undefined} style={{ "--nav-columns": columns.length } as CSSProperties} className={className}>
      {columns.map((column, index) => (
        <div key={column.title ?? index} className="grid content-start gap-0.5">
          {column.title && <p data-slot="navigation-panel-title">{column.title}</p>}
          <ul className="grid gap-0.5">
            {column.links.map((link) => (
              <li key={link.href + link.title}>
                <NavigationMenuCard {...link} />
              </li>
            ))}
          </ul>
        </div>
      ))}
      {featured && <div data-slot="navigation-featured">{featured}</div>}
    </div>
  );
}
