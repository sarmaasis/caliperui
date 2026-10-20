"use client";

import type { ComponentProps, ReactNode } from "react";
import { BlockEyebrow, BlockHeader, BlockLead, BlockRoot, BlockTitle, type BlockAction, type BlockStat } from "./block-concept";
import type { BlockNavLink } from "./block-nav";
import { CtaBlock } from "./cta-block";
import { TeamBlock } from "./team-block";
import { TemplatePage, type TemplateFooter } from "./template-page";
import "./shared/block-figure.css";
import "./shared/article-prose.css";
import "./about-template.css";

type Without<T> = Omit<T, "className">;

export type AboutMilestone = { year: string; title: string; detail?: string };
export type AboutValue = { title: string; detail: string };

/**
 * Who is behind the product, in the order a buyer or a candidate checks:
 * what you believe, how you got here, the numbers that prove it, how you
 * work, the people, and where to go next. Built only from the Free blocks.
 */
export function AboutTemplate({
  brand,
  nav,
  signIn,
  primary,
  intro,
  story,
  stats = [],
  values = [],
  team,
  cta,
  footer,
  className,
}: {
  brand: string;
  nav?: readonly BlockNavLink[];
  signIn?: BlockAction;
  primary?: BlockAction;
  intro: { eyebrow?: string; title: ReactNode; lead: string };
  /** A few paragraphs and the dates that mattered. */
  story?: { title: string; body: ReactNode; milestones?: readonly AboutMilestone[] };
  /** Figures with what they count, e.g. { value: "1,900", label: "finance teams close with us" }. */
  stats?: readonly BlockStat[];
  values?: readonly AboutValue[];
  team?: Without<ComponentProps<typeof TeamBlock>>;
  cta?: Without<ComponentProps<typeof CtaBlock>>;
  footer?: TemplateFooter;
  className?: string;
}) {
  return (
    <TemplatePage brand={brand} nav={nav} signIn={signIn} primary={primary} footer={footer} className={className}>
      <BlockRoot innerClassName="!pb-[clamp(40px,6cqi,72px)]">
        <div className="grid gap-6">
          {intro.eyebrow && <BlockEyebrow>{intro.eyebrow}</BlockEyebrow>}
          <BlockTitle as="h1" size={1} className="max-w-[13ch]">{intro.title}</BlockTitle>
          <BlockLead>{intro.lead}</BlockLead>
        </div>
      </BlockRoot>

      {stats.length > 0 && (
        <BlockRoot as="div" innerClassName="!py-0">
          <dl data-slot="about-stats">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt>{stat.label}</dt>
                <dd data-slot="block-figure" data-size="sm">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </BlockRoot>
      )}

      {story && (
        <BlockRoot aria-labelledby="about-story">
          <div data-slot="about-story">
            <div className="grid content-start gap-5">
              <BlockTitle id="about-story">{story.title}</BlockTitle>
              <div data-slot="article-prose">{story.body}</div>
            </div>
            {story.milestones && story.milestones.length > 0 && (
              <ol data-slot="about-milestones" aria-label="Milestones">
                {story.milestones.map((milestone) => (
                  <li key={milestone.year + milestone.title}>
                    <span data-slot="about-year">{milestone.year}</span>
                    <span className="grid gap-1">
                      <span className="text-[17px] font-medium">{milestone.title}</span>
                      {milestone.detail && <span className="text-[15px] leading-relaxed text-[var(--k-muted)]">{milestone.detail}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </BlockRoot>
      )}

      {values.length > 0 && (
        <BlockRoot tone="sunken" aria-labelledby="about-values">
          <BlockHeader title={<span id="about-values">How we work</span>} align="split" lead="The habits we hire for and hold each other to." />
          <ol data-slot="about-values">
            {values.map((value, index) => (
              <li key={value.title}>
                <span data-slot="about-value-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="m-0 text-[20px] font-medium tracking-[-0.01em]">{value.title}</h3>
                <p className="m-0 text-[15px] leading-relaxed text-[var(--k-muted)]">{value.detail}</p>
              </li>
            ))}
          </ol>
        </BlockRoot>
      )}

      {team && <TeamBlock {...team} />}
      {cta && <CtaBlock {...cta} />}
    </TemplatePage>
  );
}
