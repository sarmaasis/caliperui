import type { ReactNode } from "react";
import { cn } from "./lib/cn";
import { BlockActions, BlockEyebrow, BlockRoot, BlockTitle, type BlockAction } from "./block-concept";
import "./cta-block.css";

/**
 * The closing call to action: the hero's promise again at poster size, one
 * specific next step and a reassurance line. `tone="ink"` sets it on an ink
 * panel that inverts its actions; `tone="page"` leaves it on the page.
 */
export function CtaBlock({
  eyebrow,
  title,
  reassurance,
  primary,
  secondary,
  action,
  tone = "ink",
  className,
}: {
  eyebrow?: string;
  title: string;
  /** e.g. "14 days free · no card · import your September close". */
  reassurance?: string;
  primary?: BlockAction;
  secondary?: BlockAction;
  /** Custom content in place of the actions, e.g. an install command. */
  action?: ReactNode;
  tone?: "ink" | "page";
  className?: string;
}) {
  const ink = tone === "ink";
  // An ink panel that inverts its actions.
  return (
    <BlockRoot className={className}>
      <div
        data-slot={ink ? "cta-band" : "cta-page"}
        className={cn(
          "relative grid justify-items-center gap-8 overflow-hidden text-center",
          ink ? "rounded-[var(--k-radius-xl)] bg-[var(--k-ink)] px-[clamp(20px,5cqi,80px)] py-[clamp(56px,9cqi,120px)] text-[var(--k-bg)]" : "py-[clamp(40px,8cqi,104px)]",
        )}
      >
        {ink && <div aria-hidden="true" data-slot="block-dots" />}
        {eyebrow && <BlockEyebrow className={cn("relative", ink && "!text-current opacity-80")}>{eyebrow}</BlockEyebrow>}
        <BlockTitle size={1} className={cn("relative max-w-[18ch]", ink && "!text-current")}>{title}</BlockTitle>
        {action ? (
          <div className="relative w-full max-w-[620px] text-left">{action}</div>
        ) : (
          <BlockActions primary={primary} secondary={secondary} className="relative justify-center" block />
        )}
        {reassurance && <p className={cn("relative text-sm", ink ? "opacity-80" : "text-[var(--k-muted)]")}>{reassurance}</p>}
      </div>
    </BlockRoot>
  );
}
