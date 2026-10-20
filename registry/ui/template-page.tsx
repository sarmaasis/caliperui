"use client";

import { useEffect, useId, useState, type ComponentProps, type ReactNode } from "react";
import type { BlockAction } from "./block-concept";
import { BlockNav, type BlockNavLink } from "./block-nav";
import { FooterBlock } from "./footer-block";
import { cn } from "./lib/cn";
import "./shared/skip-link.css";
import "./template-page.css";

export type TemplateFooter = Omit<ComponentProps<typeof FooterBlock>, "brand" | "className"> & { brand?: string };

/**
 * The frame every Free page template shares: a skip link, the site header,
 * one main region that can take focus, and the footer block. Pages put
 * their bands inside.
 */
export function TemplatePage({
  brand,
  nav = [],
  signIn,
  primary,
  footer,
  className,
  children,
}: {
  brand: string;
  nav?: readonly BlockNavLink[];
  signIn?: BlockAction;
  primary?: BlockAction;
  footer?: TemplateFooter;
  className?: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div data-slot="block" className={cn("@container relative", className)}>
      <a href={`#${id}-main`} data-slot="skip-link">Skip to content</a>
      <BlockNav brand={brand} nav={nav} signIn={signIn} primary={primary} />
      <main id={`${id}-main`} tabIndex={-1} className="outline-none">
        {children}
      </main>
      {footer && <FooterBlock {...footer} brand={footer.brand ?? brand} />}
    </div>
  );
}

/** The nearest element that scrolls, or null for the window. */
export function scrollParent(element: HTMLElement | null): HTMLElement | null {
  for (let node = element?.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) return node;
  }
  return null;
}

/**
 * Which section the reader is in: the last heading that has passed a line
 * just under the sticky header. Works in the window or a scrolling panel.
 */
export function useScrollSpy(ids: readonly string[], offset = 120) {
  const [active, setActive] = useState(ids[0] ?? "");
  const key = ids.join("|");
  useEffect(() => {
    const first = ids[0] ? document.getElementById(ids[0]) : null;
    if (!first) return;
    const scroller = scrollParent(first);
    const target: HTMLElement | Window = scroller ?? window;
    const update = () => {
      const top = scroller ? scroller.getBoundingClientRect().top : 0;
      let current = ids[0]!;
      for (const id of ids) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top - top <= offset) current = id;
      }
      setActive(current);
    };
    update();
    target.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      target.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
    // ids are compared by value through `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, offset]);
  return active;
}

/** How far through an element the reader is, 0 to 1. */
export function useReadingProgress(element: HTMLElement | null) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!element) return;
    const scroller = scrollParent(element);
    const target: HTMLElement | Window = scroller ?? window;
    const update = () => {
      const rect = element.getBoundingClientRect();
      const top = scroller ? scroller.getBoundingClientRect().top : 0;
      const view = scroller ? scroller.clientHeight : window.innerHeight;
      const travel = rect.height - view;
      setProgress(travel <= 0 ? 1 : Math.min(1, Math.max(0, (top - rect.top) / travel)));
    };
    update();
    target.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      target.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [element]);
  return progress;
}

/** Jumps to a section inside whatever scrolls, then moves focus to its heading. */
export function goToSection(id: string) {
  const element = document.getElementById(id);
  if (!element) return;
  const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  const heading = element.matches("h1, h2, h3") ? element : element.querySelector<HTMLElement>("h2, h3");
  heading?.setAttribute("tabindex", "-1");
  heading?.focus({ preventScroll: true });
}

/**
 * The page outline: numbered when `numbered`, with the reader's section
 * marked as current. On narrow pages it folds into a disclosure.
 */
export function TemplateOutline({
  items,
  active,
  label = "On this page",
  numbered = false,
  className,
}: {
  items: readonly { id: string; title: string }[];
  active: string;
  label?: string;
  numbered?: boolean;
  className?: string;
}) {
  const list = (
    <ol data-slot="template-outline-list" data-numbered={numbered || undefined}>
      {items.map((item, index) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            aria-current={active === item.id ? "location" : undefined}
            onClick={(event) => {
              event.preventDefault();
              goToSection(item.id);
              history.replaceState(null, "", `#${item.id}`);
            }}
          >
            {numbered && <span data-slot="template-outline-number">{index + 1}.</span>}
            {item.title}
          </a>
        </li>
      ))}
    </ol>
  );
  return (
    <nav aria-label={label} data-slot="template-outline" className={className}>
      <p data-slot="template-outline-label">{label}</p>
      {list}
      <details data-slot="template-outline-fold">
        <summary>{label}</summary>
        {list}
      </details>
    </nav>
  );
}
