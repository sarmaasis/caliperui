"use client";

import { Slot, Slottable } from "@radix-ui/react-slot";
import { LoaderCircle } from "lucide-react";
import {
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "./lib/cn";
import "./shared/loading-indicator.css";
import "./button.css";

/* Colour, material and press live in button.css keyed on data-variant, so a
   consumer's utility classes still override them. Raised to press: the
   button sinks 1px into an inner shade instead of scaling. */
const variants = {
  default: "",
  secondary: "",
  ghost: "",
  destructive: "",
};

const sizes = {
  sm: "h-8 gap-1.5 rounded-full px-3 text-[13px] max-md:min-h-11 [@media(pointer:coarse)]:min-h-11",
  md: "h-[var(--control-height)] gap-2 rounded-full px-3.5 text-sm",
  lg: "h-11 gap-2 rounded-full px-[18px] text-[15px]",
  icon: "size-[var(--control-height)] rounded-full p-0",
};

export type ButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  asChild?: boolean;
  /** Shows a spinner over the label and swallows clicks while keeping focus and width. */
  loading?: boolean;
  /** Animate a meaningful label/icon change, such as saving → saved. */
  feedbackKey?: string;
};

export function Button({
  className,
  variant = "default",
  size = "md",
  asChild = false,
  loading = false,
  feedbackKey,
  disabled,
  "aria-disabled": ariaDisabled,
  children,
  onClick,
  onClickCapture,
  tabIndex,
  type = "button",
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";
  const nativeDisabled = Boolean(disabled);
  const blocked =
    nativeDisabled ||
    loading ||
    ariaDisabled === true ||
    ariaDisabled === "true";

  return (
    <Component
      data-slot="button"
      data-variant={variant}
      data-size={size}
      type={asChild ? undefined : type}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center whitespace-nowrap border border-transparent font-medium tracking-[-0.006em] outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none aria-disabled:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={asChild ? undefined : nativeDisabled}
      aria-disabled={nativeDisabled || ariaDisabled ? true : undefined}
      aria-busy={loading || undefined}
      tabIndex={asChild && nativeDisabled ? -1 : tabIndex}
      {...props}
      onKeyDown={(event) => {
        if (blocked && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
        }
        props.onKeyDown?.(event);
      }}
      onClickCapture={(event) => {
        if (blocked) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        onClickCapture?.(event);
      }}
      onClick={onClick}
    >
      {loading && asChild && (
        <LoaderCircle data-slot="loading-indicator" aria-hidden="true" />
      )}
      {loading && !asChild && feedbackKey === undefined && (
        <span data-slot="button-busy" aria-hidden="true">
          <LoaderCircle data-slot="loading-indicator" />
        </span>
      )}
      <Slottable>
        {loading && !asChild && feedbackKey === undefined ? (
          <span data-slot="button-label" data-hidden="true">
            {children}
          </span>
        ) : feedbackKey !== undefined && !asChild ? (
          <ButtonFeedback stateKey={feedbackKey}>
            {loading && (
              <LoaderCircle data-slot="loading-indicator" aria-hidden="true" />
            )}
            {children}
          </ButtonFeedback>
        ) : (
          children
        )}
      </Slottable>
    </Component>
  );
}

function ButtonFeedback({
  stateKey,
  children,
}: {
  stateKey: string;
  children: ReactNode;
}) {
  const content = useRef<HTMLSpanElement>(null);
  const [initialKey] = useState(stateKey);
  const [width, setWidth] = useState<number>();
  useLayoutEffect(() => {
    const element = content.current;
    if (!element) return;
    const measure = () => setWidth(element.offsetWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [stateKey]);
  return (
    <span data-slot="button-feedback" style={{ width }}>
      <span
        key={stateKey}
        ref={content}
        data-slot="button-feedback-label"
        data-enter={stateKey !== initialKey}
      >
        {children}
      </span>
    </span>
  );
}
