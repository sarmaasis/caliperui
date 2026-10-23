import type { ComponentProps, CSSProperties } from "react";
import { cn } from "./lib/cn";

const variants = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-brand-subtle text-[color-mix(in_srgb,var(--accent-text)_82%,var(--foreground))]",
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  error: "bg-destructive-subtle text-destructive",
};

/* Status survives without colour: each variant has its own shape. */
const shapes = {
  neutral: <path d="M2 5h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />,
  info: <circle cx="5" cy="5" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.6" />,
  success: <circle cx="5" cy="5" r="4" fill="currentColor" />,
  warning: (
    <>
      <path d="M5 1a4 4 0 0 1 0 8z" fill="currentColor" />
      <circle cx="5" cy="5" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </>
  ),
  error: <path d="M2 2l6 6M8 2 2 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />,
};

/* Categorical hues for labels that name a kind, not a status (a deal stage, a team, a type): OKLCH hue angles.
   Lightness and chroma come per theme from tokens.css (--tone-*), so the text holds 4.5:1 on its wash in both. */
const tones = { blue: 255, violet: 295, rose: 2, orange: 50, amber: 82, green: 150, teal: 195, slate: 260 } as const;
export type BadgeTone = keyof typeof tones;

export type BadgeProps = ComponentProps<"span"> & {
  variant?: keyof typeof variants;
  /** A categorical hue with a dot, for kinds rather than statuses. Overrides the variant's colour. */
  tone?: BadgeTone;
  /** The status shape before the word. On for status variants, off for neutral labels and counts. */
  shape?: boolean;
};

export function Badge({
  className,
  variant = "neutral",
  tone,
  shape = variant !== "neutral" && !tone,
  children,
  style,
  ...props
}: BadgeProps) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      data-tone={tone}
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-xs leading-4 font-medium [&_svg]:size-3",
        (shape || tone) && "pl-[7px]",
        tone
          ? "bg-[oklch(var(--tone-bg-l)_var(--tone-bg-c)_var(--tone-h))] text-[oklch(var(--tone-fg-l)_var(--tone-fg-c)_var(--tone-h))]"
          : variants[variant],
        className,
      )}
      style={tone ? ({ "--tone-h": tones[tone], ...style } as CSSProperties) : style}
      {...props}
    >
      {tone && <span data-slot="badge-dot" aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />}
      {shape && (
        <svg data-slot="badge-shape" viewBox="0 0 10 10" aria-hidden="true" className="!size-2.5">
          {shapes[variant]}
        </svg>
      )}
      {children}
    </span>
  );
}
