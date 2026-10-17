import type { ComponentProps, ReactNode } from "react";
import { cn } from "./lib/cn";
import "./aspect-ratio.css";

export function AspectRatio({
  ratio = 1,
  animated = true,
  children,
  className,
  ...props
}: Omit<ComponentProps<"div">, "children"> & {
  ratio?: number;
  animated?: boolean;
  children?: ReactNode;
}) {
  const safe = Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
  return (
    <div
      data-slot="aspect-ratio"
      data-animated={animated}
      className={cn("relative w-full overflow-hidden", className)}
      style={{ aspectRatio: String(safe) }}
      {...props}
    >
      {children}
    </div>
  );
}

export function AspectRatioImage({
  alt,
  className,
  ...props
}: ComponentProps<"img"> & { alt: string }) {
  return (
    <img
      alt={alt}
      data-slot="aspect-ratio-image"
      className={cn("absolute inset-0 size-full object-cover", className)}
      {...props}
    />
  );
}
