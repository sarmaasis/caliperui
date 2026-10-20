"use client";

import { Link2, Printer } from "lucide-react";
import type { ReactNode } from "react";
import { BlockEyebrow, BlockLead, BlockRoot, BlockTitle, type BlockAction } from "./block-concept";
import type { BlockNavLink } from "./block-nav";
import { Button } from "./button";
import { TemplateOutline, TemplatePage, useScrollSpy, type TemplateFooter } from "./template-page";
import "./shared/article-prose.css";
import "./legal-template.css";

export type LegalSection = { id: string; title: string; body: ReactNode };
export type LegalVersion = { date: string; summary: string; href?: string };

const formatDate = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

/**
 * A policy people can actually read: the short version first, numbered
 * sections with an outline that follows the reader, linkable clauses, the
 * dates it changed and what changed, a print layout and who to ask.
 * Built only from the Free blocks.
 */
export function LegalTemplate({
  brand,
  nav,
  signIn,
  primary,
  eyebrow = "Legal",
  title,
  lead,
  updated,
  effective,
  summary = [],
  sections,
  versions = [],
  contact,
  footer,
  className,
}: {
  brand: string;
  nav?: readonly BlockNavLink[];
  signIn?: BlockAction;
  primary?: BlockAction;
  eyebrow?: string;
  title: string;
  lead?: string;
  /** ISO date of the last change. */
  updated: string;
  /** ISO date the current text applies from, if different. */
  effective?: string;
  /** The short version, in plain sentences. */
  summary?: readonly string[];
  sections: readonly LegalSection[];
  /** Earlier versions, newest first. */
  versions?: readonly LegalVersion[];
  /** Who answers questions, e.g. { label: "privacy@halden.app", href: "mailto:privacy@halden.app" }. */
  contact?: { label: string; href: string };
  footer?: TemplateFooter;
  className?: string;
}) {
  const active = useScrollSpy(sections.map((section) => section.id));
  return (
    <TemplatePage brand={brand} nav={nav} signIn={signIn} primary={primary} footer={footer} className={className}>
      <BlockRoot width="default" as="div" innerClassName="!pb-10">
        <header data-slot="legal-header">
          <div className="grid gap-5">
            <BlockEyebrow>{eyebrow}</BlockEyebrow>
            <BlockTitle as="h1" size={2}>{title}</BlockTitle>
            {lead && <BlockLead>{lead}</BlockLead>}
          </div>
          <div data-slot="legal-dates">
            <p className="m-0">
              <span className="text-[var(--k-muted)]">Last updated </span>
              <time dateTime={updated}>{formatDate(updated)}</time>
            </p>
            {effective && (
              <p className="m-0">
                <span className="text-[var(--k-muted)]">In effect from </span>
                <time dateTime={effective}>{formatDate(effective)}</time>
              </p>
            )}
            <Button variant="secondary" size="sm" onClick={() => window.print()} data-print-hide="">
              <Printer aria-hidden="true" />
              Print or save as PDF
            </Button>
          </div>
        </header>
      </BlockRoot>
      <BlockRoot width="default" as="div" innerClassName="!pt-0">
        <div data-slot="article-layout">
          <TemplateOutline items={sections} active={active} label="Sections" numbered />
          <div data-slot="article-body">
            {summary.length > 0 && (
              <section data-slot="legal-summary" aria-labelledby="legal-summary-title">
                <h2 id="legal-summary-title" className="m-0 text-[17px] font-medium">The short version</h2>
                <ul>
                  {summary.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <p className="m-0 text-[13px] text-[var(--k-muted)]">This summary helps you read the policy; the numbered sections below are what applies.</p>
              </section>
            )}
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`}>
                <h2 id={`${section.id}-title`} data-slot="article-heading">
                  <span data-slot="legal-number">{index + 1}.</span>
                  {section.title}
                  <a href={`#${section.id}`} data-slot="article-anchor" aria-label={`Link to section ${index + 1}, ${section.title}`}>
                    <Link2 aria-hidden="true" />
                  </a>
                </h2>
                <div data-slot="article-prose">{section.body}</div>
              </section>
            ))}
            {versions.length > 0 && (
              <section aria-labelledby="legal-history" data-slot="legal-history">
                <h2 id="legal-history" className="m-0 text-[17px] font-medium">Version history</h2>
                <ol>
                  {versions.map((version) => (
                    <li key={version.date}>
                      <time dateTime={version.date}>{formatDate(version.date)}</time>
                      <span>
                        {version.summary}
                        {version.href && (
                          <>
                            {" "}
                            <a href={version.href} className="underline underline-offset-4">Read that version</a>
                          </>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
            {contact && (
              <p className="m-0 border-t border-[var(--k-line)] pt-6 text-[15px] text-[var(--k-muted)]">
                Questions about this policy? Write to <a href={contact.href} className="text-[var(--k-ink)] underline underline-offset-4">{contact.label}</a>.
              </p>
            )}
          </div>
        </div>
      </BlockRoot>
    </TemplatePage>
  );
}
