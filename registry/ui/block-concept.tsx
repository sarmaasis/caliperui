import { ArrowRight } from "lucide-react";
import type { ComponentProps, ElementType, ReactNode } from "react";
import { cn } from "./lib/cn";
import { StageScope } from "./stage-scope";
import "./block-concept.css";

/**
 * Marketing blocks share one voice: monochrome from the system tokens, Geist
 * display with two-tone titles, ink actions, ruled sections and ember only for
 * focus. Blocks follow the page theme, and the Caliper UI controls inside them too.
 */

export type BlockAction = { label: string; href?: string; onClick?: () => void };

/**
 * A full-bleed band. The section is the container, so everything inside lays
 * out by the block's own width; `block-inner` holds the measure and rhythm.
 * `backdrop` paints behind the content edge to edge (grid lines, a tone).
 */
export function BlockRoot({
  as: Tag = "section",
  width = "default",
  backdrop,
  tone,
  className,
  innerClassName,
  children,
  ...props
}: Omit<ComponentProps<"section">, "ref"> & {
  /** The band's element; a site footer is a footer. */
  as?: "section" | "footer" | "div";
  /** default 1240px · narrow 960px · wide 1440px. */
  width?: "default" | "narrow" | "wide";
  backdrop?: ReactNode;
  /** A band tone: the page colour or the sunken colour. */
  tone?: "page" | "sunken" | "ink";
  innerClassName?: string;
}) {
  return (
    <Tag data-slot="block" data-tone={tone} className={cn("@container relative isolate overflow-clip", className)} {...props}>
      {backdrop}
      <div data-slot="block-inner" data-width={width} className={innerClassName}>
        {children}
      </div>
    </Tag>
  );
}

export function BlockEyebrow({ className, ...props }: ComponentProps<"p">) {
  return <p data-slot="block-eyebrow" className={className} {...props} />;
}

/** A display heading in the block face. size 1 is the hero headline. */
export function BlockTitle({
  as: Tag = "h2",
  size = 2,
  className,
  ...props
}: ComponentProps<"h2"> & { as?: "h1" | "h2" | "h3"; size?: 1 | 2 | 3 }) {
  return <Tag data-slot="block-title" data-size={size} className={className} {...props} />;
}

/** The second tone of a title: these words land in grey. */
export function BlockEm({ className, ...props }: ComponentProps<"em">) {
  return <em data-slot="block-em" className={className} {...props} />;
}

export function BlockLead({ className, ...props }: ComponentProps<"p">) {
  return <p data-slot="block-lead" className={className} {...props} />;
}

/**
 * The section opening every block shares: eyebrow, title and lead. `split`
 * sets the lead beside the title on wide blocks; `center` stacks it centred.
 */
export function BlockHeader({
  eyebrow,
  title,
  lead,
  align = "start",
  aside,
  headingLevel = 2,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  align?: "start" | "center" | "split";
  /** 1 when the block opens the page, e.g. a pricing page. */
  headingLevel?: 1 | 2;
  /** Sits at the end of the header row, e.g. a period toggle. */
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <header data-slot="block-header" data-align={align} className={className}>
      <div data-slot="block-header-title">
        {eyebrow && <BlockEyebrow>{eyebrow}</BlockEyebrow>}
        <BlockTitle as={headingLevel === 1 ? "h1" : "h2"}>{title}</BlockTitle>
      </div>
      {(lead || aside) && (
        <div data-slot="block-header-aside">
          {lead && <BlockLead>{lead}</BlockLead>}
          {aside}
        </div>
      )}
    </header>
  );
}

export function BlockActions({
  primary,
  secondary,
  className,
  block = false,
}: {
  primary?: BlockAction;
  secondary?: BlockAction;
  className?: string;
  /** Full-width actions, e.g. on phones. */
  block?: boolean;
}) {
  if (!primary && !secondary) return null;
  return (
    <div data-slot="block-actions" className={cn("flex flex-wrap gap-3", block && "@max-[520px]:grid @max-[520px]:grid-cols-1", className)}>
      {primary && <BlockButton action={primary} kind="primary" arrow />}
      {secondary && <BlockButton action={secondary} kind="secondary" />}
    </div>
  );
}

export function BlockButton({ action, kind = "primary", arrow = false, link: Link = "a" }: { action: BlockAction; kind?: "primary" | "secondary"; arrow?: boolean; /** The element for a link action, e.g. your router's Link. */ link?: ElementType }) {
  const shared = { "data-slot": "block-button", "data-kind": kind } as const;
  const content = (
    <>
      {action.label}
      {arrow && <ArrowRight aria-hidden="true" data-slot="block-button-arrow" className="size-4" />}
    </>
  );
  return action.href ? (
    <Link href={action.href} {...shared}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={action.onClick} {...shared}>
      {content}
    </button>
  );
}

export function BlockCard({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="block-card" className={className} {...props} />;
}

export function BlockChip({ className, ...props }: ComponentProps<"span">) {
  return <span data-slot="block-chip" className={className} {...props} />;
}

/**
 * A product artefact on a stage: a dotted tonal panel holding a framed window, with an optional floating note that overlaps the
 * window's corner on wide blocks and sits beneath it on narrow ones.
 */
export function BlockStage({
  title,
  floating,
  bare = false,
  className,
  children,
}: {
  /** Shown in the window bar, e.g. "halden.app/close". */
  title?: string;
  floating?: ReactNode;
  /** No window frame: the children bring their own surfaces. */
  bare?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div data-slot="block-stage" className={className}>
      {bare ? (
        <StageScope>{children}</StageScope>
      ) : (
        <div data-slot="block-window">
          <div data-slot="block-window-bar" aria-hidden={title ? undefined : true}>
            <span data-slot="block-window-dots" aria-hidden="true"><i /><i /><i /></span>
            {title && <span data-slot="block-window-title">{title}</span>}
          </div>
          <div data-slot="block-window-body"><StageScope>{children}</StageScope></div>
        </div>
      )}
      {floating && <div data-slot="block-float">{floating}</div>}
    </div>
  );
}

/** Company names set as type in a quiet row; swap in SVG marks in production. */
export function BlockLogos({ label, logos, className }: { label?: string; logos: readonly string[]; className?: string }) {
  return (
    <div data-slot="block-logos" className={className}>
      {label && <p data-slot="block-logos-label">{label}</p>}
      <ul aria-label={label ?? "Customers"}>
        {logos.map((logo) => (
          <li key={logo}>{logo}</li>
        ))}
      </ul>
    </div>
  );
}

/** Initials from a name, in the block's highlight tones. */
export function BlockInitials({ name, size = 36, tone, className }: { name: string; size?: number; tone?: number; className?: string }) {
  const words = name.trim().split(/\s+/u);
  const initials = ((words[0]?.[0] ?? "") + (words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "")).toUpperCase();
  return (
    <span data-slot="block-initials" data-tone={tone === undefined ? undefined : tone % 4} aria-hidden="true" className={className} style={{ width: size, height: size, fontSize: Math.round(size / 2.8) }}>
      {initials}
    </span>
  );
}

export type BlockStat = { value: ReactNode; label: string };
