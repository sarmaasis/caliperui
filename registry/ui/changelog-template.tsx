"use client";

import { Link2 } from "lucide-react";
import { useId, useMemo, useState, type ComponentProps, type ReactNode } from "react";
import { Avatar } from "./avatar";
import { Badge, type BadgeTone } from "./badge";
import { BlockEyebrow, BlockLead, BlockRoot, BlockStage, BlockTitle, type BlockAction } from "./block-concept";
import { BlockNav, type BlockNavLink } from "./block-nav";
import { FooterBlock } from "./footer-block";
import { cn } from "./lib/cn";
import "./shared/skip-link.css";
import "./changelog-template.css";

type Without<T> = Omit<T, "className">;

export type ChangelogTemplateEntry = {
  /** Also the anchor, e.g. "4.2". */
  version: string;
  /** ISO date, e.g. "2026-10-07". */
  date: string;
  title: string;
  /** What changed and why it matters, in a few sentences or a list. */
  body: ReactNode;
  /** e.g. ["New", "Improved", "Fixed"]. */
  tags?: readonly string[];
  /** Who shipped it, shown with their face under the version. */
  author?: string;
  /** A product view of the change. */
  media?: ReactNode;
  mediaTitle?: string;
};

const formatDate = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

/**
 * What shipped, newest first. Each release has a date that stays in view
 * while you read it, a linkable version, tags you can filter by and an
 * optional product view. The filter states how many releases match.
 */
export function ChangelogTemplate({
  brand,
  nav = [],
  signIn,
  primary,
  eyebrow = "Changelog",
  title,
  lead,
  entries,
  tones,
  footer,
  header,
  footerNode,
  className,
}: {
  brand: string;
  nav?: readonly BlockNavLink[];
  signIn?: BlockAction;
  primary?: BlockAction;
  eyebrow?: string;
  title: string;
  lead?: string;
  entries: readonly ChangelogTemplateEntry[];
  /** A hue per tag, e.g. { New: "green", Fixed: "orange" }; a tag without one stays a plain chip. */
  tones?: Readonly<Record<string, BadgeTone>>;
  footer?: Omit<Without<ComponentProps<typeof FooterBlock>>, "brand"> & { brand?: string };
  /** Replaces the built-in header, for a site that already has its own. */
  header?: ReactNode;
  /** Replaces the built-in footer. */
  footerNode?: ReactNode;
  className?: string;
}) {
  const id = useId();
  const tags = useMemo(() => [...new Set(entries.flatMap((entry) => entry.tags ?? []))], [entries]);
  const [tag, setTag] = useState<string | null>(null);
  const shown = tag ? entries.filter((entry) => entry.tags?.includes(tag)) : entries;
  const anchor = (version: string) => `v${version.replace(/[^a-z0-9]+/giu, "-")}`;

  return (
    <div data-slot="block" className={cn("@container relative", className)}>
      <a href={`#${id}-main`} data-slot="skip-link">Skip to content</a>
      {header ?? <BlockNav brand={brand} nav={nav} signIn={signIn} primary={primary} />}
      <main id={`${id}-main`} tabIndex={-1} className="outline-none">
        <BlockRoot width="narrow" as="div">
          <header className="grid gap-6 border-b border-[var(--k-line-strong)] pb-10">
            <BlockEyebrow>{eyebrow}</BlockEyebrow>
            <BlockTitle as="h1" size={1}>{title}</BlockTitle>
            {lead && <BlockLead>{lead}</BlockLead>}
            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter releases">
                {[null, ...tags].map((item) => (
                  <button key={item ?? "all"} type="button" data-slot="changelog-filter" aria-pressed={tag === item} onClick={() => setTag(item)}>
                    {item ?? "All"}
                  </button>
                ))}
                <span className="ml-1 text-[13px] text-[var(--k-muted)]" role="status">{shown.length} {shown.length === 1 ? "release" : "releases"}</span>
              </div>
            )}
          </header>
          <ol className="grid">
            {shown.map((entry) => (
              <li key={entry.version} id={anchor(entry.version)} data-slot="changelog-entry">
                <div data-slot="changelog-meta">
                  <time dateTime={entry.date} className="text-sm text-[var(--k-muted)]">{formatDate(entry.date)}</time>
                  <a href={`#${anchor(entry.version)}`} data-slot="changelog-version" aria-label={`Link to version ${entry.version}`}>
                    v{entry.version}
                    <Link2 aria-hidden="true" className="size-3.5" />
                  </a>
                  {entry.author && <span data-slot="changelog-author"><Avatar name={entry.author} alt="" className="size-6 text-[10px]" />{entry.author}</span>}
                </div>
                <article className="grid min-w-0 gap-5">
                  {entry.tags && entry.tags.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
                      {entry.tags.map((item) => (tones?.[item] ? <li key={item}><Badge tone={tones[item]}>{item}</Badge></li> : <li key={item} data-slot="block-chip">{item}</li>))}
                    </ul>
                  )}
                  <h2 data-slot="block-title" data-size="3" className="!text-[clamp(24px,3cqi,34px)]">{entry.title}</h2>
                  <div data-slot="changelog-body">{entry.body}</div>
                  {entry.media && (
                    <BlockStage title={entry.mediaTitle} className="!pb-[clamp(14px,4.5cqi,40px)] [&_[data-slot=block-window]]:rounded-[var(--k-radius-lg)]">
                      {entry.media}
                    </BlockStage>
                  )}
                </article>
              </li>
            ))}
          </ol>
        </BlockRoot>
      </main>
      {footerNode ?? (footer && <FooterBlock {...footer} brand={footer.brand ?? brand} />)}
    </div>
  );
}
