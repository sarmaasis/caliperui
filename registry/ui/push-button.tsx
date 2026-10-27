"use client";
import type { ComponentProps } from "react";
import { cn } from "./lib/cn";
import "./push-button.css";

export type PushButtonProps = ComponentProps<"button"> & {
  /** Ink for the main action, accent for the one moment that should stand out, neutral for the rest. */
  variant?: "default" | "accent" | "secondary";
  size?: "sm" | "md" | "lg";
};

/**
 * A chunky button with visible depth: the face sits on its own edge, lifts a pixel on hover and travels down onto
 * the edge when pressed, springing back when let go. For playful, game-like flows (onboarding, lessons, rewards);
 * use `Button` for ordinary product actions.
 */
export function PushButton({ variant = "default", size = "md", className, children, type = "button", ...props }: PushButtonProps) {
  return (
    <button data-slot="push-button" data-variant={variant} data-size={size} type={type} className={cn("group", className)} {...props}>
      <span data-slot="pb-edge" aria-hidden="true" />
      <span data-slot="pb-face">{children}</span>
    </button>
  );
}
