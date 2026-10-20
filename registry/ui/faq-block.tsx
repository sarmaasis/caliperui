"use client";

import { Search } from "lucide-react";
import { useId, useState } from "react";
import { BlockEyebrow, BlockLead, BlockRoot, BlockTitle } from "./block-concept";
import "./faq-block.css";

export type BlockFaq = { question: string; answer: string; doc?: { label: string; href: string } };

/**
 * Questions buyers actually ask, searchable, one open at a time, each answer
 * linking to the exact doc. With no match it offers to ask, carrying the
 * query. On wide blocks the heading, search and contact hold the left column
 * while the questions run down the right.
 */
export function FaqBlock({
  eyebrow,
  title,
  lead,
  items,
  searchable = true,
  ask,
  className,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  items: readonly BlockFaq[];
  searchable?: boolean;
  /** Where unanswered questions go, e.g. { label: "Ask us", href: "mailto:help@halden.app" }. */
  ask?: { label: string; href: string };
  className?: string;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(0);
  const needle = query.trim().toLowerCase();
  const visible = items.map((item, index) => ({ item, index })).filter(({ item }) => !needle || `${item.question} ${item.answer}`.toLowerCase().includes(needle));
  const askHref = (text: string) => (ask ? `${ask.href}${ask.href.startsWith("mailto:") && text ? `?subject=${encodeURIComponent(text)}` : ""}` : undefined);

  return (
    <BlockRoot tone="sunken" className={className}>
      <div className="grid gap-[clamp(32px,5cqi,80px)] @[900px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="grid content-start justify-items-start gap-6 @[900px]:sticky @[900px]:top-8 @[900px]:self-start">
          {eyebrow && <BlockEyebrow>{eyebrow}</BlockEyebrow>}
          <BlockTitle>{title}</BlockTitle>
          {lead && <BlockLead>{lead}</BlockLead>}
          {searchable && (
            <label className="flex h-12 w-full max-w-[340px] items-center gap-2.5 rounded-[var(--k-btn-radius)] bg-[var(--k-surface)] px-4 shadow-[inset_0_0_0_1px_var(--k-line-strong)] focus-within:shadow-[inset_0_0_0_2px_var(--k-focus)]">
              <Search aria-hidden="true" className="size-4 text-[var(--k-muted)]" />
              <input
                type="search"
                aria-label="Search answers"
                placeholder="Search answers"
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                className="min-w-0 flex-1 bg-transparent text-[15px] text-[var(--k-ink)] outline-none placeholder:text-[var(--k-muted)]"
              />
            </label>
          )}
          {ask && !needle && (
            <p className="text-sm text-[var(--k-muted)]">
              Not here? <a href={ask.href} className="text-[var(--k-ink)] underline underline-offset-4 hover:text-[var(--k-hi)]">{ask.label}</a>
            </p>
          )}
        </div>
        <div>
          <p className="sr-only" aria-live="polite">{needle ? `${visible.length} ${visible.length === 1 ? "answer" : "answers"}` : ""}</p>
          <ul className="border-b border-[var(--k-line-strong)]">
            {visible.map(({ item, index }) => {
              const expanded = open === index || (needle !== "" && visible.length === 1);
              const panel = `${id}-answer-${index}`;
              return (
                <li key={item.question} className="border-t border-[var(--k-line-strong)]">
                  <h3 className="m-0">
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={panel}
                      onClick={() => setOpen(expanded ? -1 : index)}
                      className="flex w-full items-center justify-between gap-6 py-6 text-left font-[family-name:var(--k-display-font)] text-[clamp(18px,1.9cqi,23px)] leading-[1.25] font-normal tracking-[-0.01em] outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-focus)]"
                    >
                      {item.question}
                      <span data-slot="faq-marker" aria-hidden="true" />
                    </button>
                  </h3>
                  <div id={panel} data-slot="faq-answer" hidden={!expanded} className="max-w-[60ch] pb-6 pr-12 text-[15px] leading-[25px] text-[var(--k-muted)]">
                    {item.answer}{" "}
                    {item.doc && <a href={item.doc.href} className="text-[var(--k-ink)] underline decoration-[var(--k-hi)] underline-offset-4">{item.doc.label}</a>}
                  </div>
                </li>
              );
            })}
          </ul>
          {needle && visible.length === 0 && (
            <p role="status" className="py-6 text-[15px] text-[var(--k-muted)]">
              No answer mentions “{query.trim()}”.{" "}
              {ask && <a href={askHref(query.trim())} className="text-[var(--k-hi)] underline underline-offset-4">{ask.label}</a>}
            </p>
          )}
        </div>
      </div>
    </BlockRoot>
  );
}
