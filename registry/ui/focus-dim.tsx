"use client";
import type { ComponentProps, ElementType } from "react";
import { cn } from "./lib/cn";
import "./focus-dim.css";

export type FocusDimProps = ComponentProps<"div"> & {
  /** The element to render, e.g. "ul" or "nav". Its children are the items that dim. */
  as?: ElementType;
  /** How far the others fall back. */
  strength?: "soft" | "medium" | "strong";
};

/**
 * A group whose other children quietly step back while one is hovered or has keyboard focus, so the one in use
 * stands out: a row of links, a team, a set of logos or plans. It is only a stylesheet rule; it adds no script,
 * no wrapper per item and no change to the markup's meaning. Touch screens have no hover, so nothing dims
 * there, and keyboard focus works everywhere. The dimmed items stay fully readable and clickable.
 */
export function FocusDim({ as: Tag = "div", strength = "medium", className, ...props }: FocusDimProps) {
  return <Tag data-slot="focus-dim" data-strength={strength} className={cn(className)} {...props} />;
}
