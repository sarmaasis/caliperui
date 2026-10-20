"use client";

import { ArrowRight, Link2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { BlockEyebrow, BlockInitials, BlockLead, BlockRoot, BlockStage, BlockTitle, type BlockAction } from "./block-concept";
import type { BlockNavLink } from "./block-nav";
import { CopyButton } from "./copy-button";
import { TemplateOutline, TemplatePage, useReadingProgress, useScrollSpy, type TemplateFooter } from "./template-page";
import "./shared/article-prose.css";
import "./blog-post-template.css";

export type BlogArticleSection = {
  /** The anchor, e.g. "why-we-moved". */
  id: string;
  title: string;
  body: ReactNode;
};

export type BlogArticleRelated = { title: string; href: string; category?: string; date?: string; excerpt?: string };

export type BlogArticle = {
  category: string;
  title: string;
  /** The standfirst: one or two sentences under the title. */
  lead: string;
  /** ISO date, e.g. "2026-10-07". */
  date: string;
  readingMinutes: number;
  author: { name: string; role: string; href?: string; bio?: string };
  cover?: ReactNode;
  coverTitle?: string;
  /** Short caption under the cover, e.g. its source. */
  coverCaption?: string;
  sections: readonly BlogArticleSection[];
  /** Where this article lives, for the copy-link button. */
  url?: string;
};

const formatDate = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

/**
 * One article at a reading measure: a progress line that follows the
 * reader, an outline that marks the current section, headings you can link
 * to, the author at the end and three related posts. Built only from the
 * Free blocks; the footer carries the newsletter.
 */
export function BlogPostTemplate({
  brand,
  nav,
  signIn,
  primary,
  post,
  related = [],
  next,
  footer,
  className,
}: {
  brand: string;
  nav?: readonly BlockNavLink[];
  signIn?: BlockAction;
  primary?: BlockAction;
  post: BlogArticle;
  related?: readonly BlogArticleRelated[];
  /** A closing action under the article, e.g. "Try the close checklist". */
  next?: BlockAction;
  footer?: TemplateFooter;
  className?: string;
}) {
  const [article, setArticle] = useState<HTMLElement | null>(null);
  const progress = useReadingProgress(article);
  const active = useScrollSpy(post.sections.map((section) => section.id));
  const url = post.url ?? "";

  return (
    <TemplatePage brand={brand} nav={nav} signIn={signIn} primary={primary} footer={footer} className={className}>
      <div data-slot="reading-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
      <article ref={setArticle}>
        <BlockRoot as="div" innerClassName="!pb-10">
          <div data-slot="article-layout">
          <span aria-hidden="true" />
          <header className="grid min-w-0 gap-6">
            <BlockEyebrow className="flex-wrap">
              <span className="whitespace-nowrap">{post.category}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={post.date} className="whitespace-nowrap">{formatDate(post.date)}</time>
              <span aria-hidden="true">·</span>
              <span className="whitespace-nowrap">{post.readingMinutes} min read</span>
            </BlockEyebrow>
            <BlockTitle as="h1" size={2} className="max-w-[18ch]">{post.title}</BlockTitle>
            <BlockLead className="!max-w-[56ch]">{post.lead}</BlockLead>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--k-line)] pt-5">
              <span className="flex items-center gap-3">
                <BlockInitials name={post.author.name} size={40} tone={1} />
                <span className="grid">
                  <span className="text-sm font-medium">{post.author.name}</span>
                  <span className="text-[13px] text-[var(--k-muted)]">{post.author.role}</span>
                </span>
              </span>
              {url && (
                <CopyButton value={url} label="Copy link to this article" display="Link copied" variant="secondary">
                  <Link2 aria-hidden="true" />
                  Copy link
                </CopyButton>
              )}
            </div>
          </header>
          </div>
        </BlockRoot>
        {post.cover && (
          <BlockRoot width="default" as="div" innerClassName="!py-0">
            <figure className="m-0 grid gap-3">
              <BlockStage title={post.coverTitle}>{post.cover}</BlockStage>
              {post.coverCaption && <figcaption className="text-[13px] text-[var(--k-muted)]">{post.coverCaption}</figcaption>}
            </figure>
          </BlockRoot>
        )}
        <BlockRoot width="default" as="div" innerClassName="!pb-[clamp(48px,7cqi,88px)]">
          <div data-slot="article-layout">
            <TemplateOutline items={post.sections} active={active} />
            <div data-slot="article-body">
              {post.sections.map((section) => (
                <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`}>
                  <h2 id={`${section.id}-title`} data-slot="article-heading">
                    {section.title}
                    <a href={`#${section.id}`} data-slot="article-anchor" aria-label={`Link to “${section.title}”`}>
                      <Link2 aria-hidden="true" />
                    </a>
                  </h2>
                  <div data-slot="article-prose">{section.body}</div>
                </section>
              ))}
              <aside data-slot="article-author" aria-label="About the author">
                <BlockInitials name={post.author.name} size={56} tone={1} />
                <div className="grid gap-1">
                  <p className="m-0 text-[15px] font-medium">
                    {post.author.href ? <a href={post.author.href} className="underline-offset-4 hover:underline">{post.author.name}</a> : post.author.name}
                  </p>
                  <p className="m-0 text-[13px] text-[var(--k-muted)]">{post.author.role}</p>
                  {post.author.bio && <p className="m-0 mt-2 max-w-[56ch] text-[15px] leading-relaxed text-[var(--k-muted)]">{post.author.bio}</p>}
                </div>
              </aside>
              {next && (
                <a data-slot="article-next" href={next.href} onClick={next.onClick}>
                  {next.label}
                  <ArrowRight aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </BlockRoot>
      </article>
      {related.length > 0 && (
        <BlockRoot tone="sunken" aria-labelledby="related-title">
          <h2 id="related-title" data-slot="block-title" data-size="3" className="!mb-8">Keep reading</h2>
          <ul data-slot="article-related">
            {related.slice(0, 3).map((item) => (
              <li key={item.href}>
                <a href={item.href}>
                  {(item.category || item.date) && (
                    <span className="text-[12px] uppercase tracking-[0.08em] text-[var(--k-muted)]">
                      {item.category}
                      {item.category && item.date && " · "}
                      {item.date && <time dateTime={item.date}>{formatDate(item.date)}</time>}
                    </span>
                  )}
                  <span data-slot="article-related-title">{item.title}</span>
                  {item.excerpt && <span className="text-[15px] leading-relaxed text-[var(--k-muted)]">{item.excerpt}</span>}
                </a>
              </li>
            ))}
          </ul>
        </BlockRoot>
      )}
    </TemplatePage>
  );
}
