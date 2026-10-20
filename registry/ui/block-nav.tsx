"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ElementType, type ReactNode } from "react";
import { BlockButton, type BlockAction } from "./block-concept";
import { cn } from "./lib/cn";
import "./shared/site-header.css";
import "./block-nav.css";

export type BlockNavLink = { label: string; href: string; current?: boolean };

/**
 * The site header page templates share. It sits on the page colour, gains a
 * hairline and frost once the page scrolls, keeps the primary action in
 * reach, and on narrow pages folds the links into a menu disclosure that
 * closes with Escape and returns focus to its button.
 */
export function BlockNav({
  brand,
  brandHref = "/",
  brandLabel,
  logo,
  nav = [],
  signIn,
  primary,
  aside,
  link: Link = "a",
  className,
}: {
  brand: string;
  brandHref?: string;
  /** The home link's accessible name when the visible brand is short, e.g. "Halden home". */
  brandLabel?: string;
  /** A mark set before the brand name; the name stays the accessible label. */
  logo?: ReactNode;
  nav?: readonly BlockNavLink[];
  signIn?: BlockAction;
  primary?: BlockAction;
  /** Extra controls before the actions, e.g. a theme switch or search. */
  aside?: ReactNode;
  /** The element for the brand and nav links, e.g. your router's Link, so moving between pages stays in the app. */
  link?: ElementType;
  className?: string;
}) {
  const id = useId();
  const sentinel = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const top = sentinel.current;
    if (!top) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry!.isIntersecting));
    observer.observe(top);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="absolute top-0 h-px w-px" />
      <header data-slot="site-header" data-scrolled={scrolled || undefined} className={cn("sticky top-0 z-20", className)}>
        <div data-slot="block-nav-row">
          <Link href={brandHref} aria-label={brandLabel} data-slot="block-nav-brand" className={cn(logo && "inline-flex items-center gap-2.5")}>{logo}{brand}</Link>
          {nav.length > 0 && (
            <nav aria-label="Site" className="hidden @[860px]:block">
              <ul data-slot="block-nav-list">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} aria-current={item.current ? "page" : undefined} data-slot="block-nav-link">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <span className="ml-auto hidden items-center gap-2 @[860px]:flex">
            {aside}
            {signIn && <BlockButton action={signIn} kind="secondary" link={Link} />}
            {primary && <BlockButton action={primary} link={Link} />}
          </span>
          {(nav.length > 0 || signIn) && (
            <button
              ref={menuButton}
              type="button"
              aria-expanded={menu}
              aria-controls={`${id}-menu`}
              onClick={() => setMenu((open) => !open)}
              data-slot="block-button"
              data-kind="secondary"
              className="ml-auto !min-h-11 !px-4 @[860px]:hidden"
            >
              {menu ? <X aria-hidden="true" className="size-4" /> : <Menu aria-hidden="true" className="size-4" />}
              Menu
            </button>
          )}
        </div>
        <div
          id={`${id}-menu`}
          hidden={!menu}
          data-slot="site-menu"
          className="absolute inset-x-0 top-full grid gap-1 border-b border-x border-border bg-[var(--elevated-glass)] px-5 pt-2 pb-6 backdrop-blur-[20px] backdrop-saturate-[1.4] [box-shadow:var(--shadow-overlay),inset_0_1px_0_var(--edge-light)] @[860px]:hidden"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setMenu(false);
              menuButton.current?.focus();
            }
          }}
        >
          {nav.map((item) => (
            <Link key={item.href} href={item.href} aria-current={item.current ? "page" : undefined} onClick={() => setMenu(false)} className="flex h-12 items-center border-b border-[var(--k-line)] text-[17px]">
              {item.label}
            </Link>
          ))}
          {menu && aside && <div className="mt-4 flex flex-wrap items-center gap-2">{aside}</div>}
          <span className="mt-4 grid gap-2">
            {signIn && <BlockButton action={signIn} kind="secondary" link={Link} />}
            {primary && <BlockButton action={primary} link={Link} />}
          </span>
        </div>
      </header>
    </>
  );
}
