import type { ComponentProps } from "react";
import { cn } from "./lib/cn";
import "./prose.css";

export type ProseProps = ComponentProps<"div"> & {
  /** Product text is 14/22 for docs and release notes. Reading is 17/1.7 for long articles. */
  size?: "product" | "reading";
};

/**
 * Styles long-form content you do not control the markup of: headings, paragraphs, lists,
 * quotes, links and inline code from a Markdown renderer or a CMS. It sets spacing and a
 * readable measure; links stay underlined so colour is never the only cue.
 */
export function Prose({ size = "product", className, ...props }: ProseProps) {
  return <div data-slot="prose" data-size={size} className={cn(className)} {...props} />;
}
