"use client";
import { useEffect, useState, type ComponentProps, type CSSProperties } from "react";
import { cn } from "./lib/cn";
import { diffLines, type DiffOp } from "./lib/diff-lines";
import "./diff-text.css";

/** Word-level changes from one text to another; spaces are their own tokens, so a change never eats its neighbours. */
export function diffWords(before: string, after: string): DiffOp[] {
  const words = (text: string) => text.split(/(\s+)/).filter(Boolean);
  return diffLines(words(before), words(after));
}

export type DiffTextProps = Omit<ComponentProps<"span">, "children"> & {
  /** The text to show. When it changes, the change plays out in place. */
  value: string;
  /** Leaves removed words struck through and added words marked, for review, instead of settling to plain text. */
  keep?: boolean;
  /** The text to compare with when `keep` is on and nothing has changed yet. */
  previous?: string;
};

/**
 * Shows a change to a piece of text where it stands: removed words are struck through and close up, added words grow
 * in with a brief tint, and then it settles to plain text. With `keep` the marks stay for review. For AI edits,
 * suggested rewrites and changelog lines. Under reduced motion the change is marked, then the text swaps.
 */
export function DiffText({ value, keep = false, previous, className, ...props }: DiffTextProps) {
  const [frame, setFrame] = useState(() => ({ value, ops: previous !== undefined ? diffWords(previous, value) : null, run: 0 }));
  if (frame.value !== value) setFrame({ value, ops: diffWords(frame.value, value), run: frame.run + 1 });
  const [settled, setSettled] = useState(-1);

  useEffect(() => {
    if (keep || frame.run === 0) return;
    const timer = window.setTimeout(() => setSettled(frame.run), 1500);
    return () => window.clearTimeout(timer);
  }, [frame.run, keep]);

  const ops = frame.ops && (keep || settled !== frame.run) ? frame.ops : null;
  let removed = 0,
    added = 0;
  return (
    <span data-slot="diff-text" data-keep={keep ? "" : undefined} className={cn(className)} {...props}>
      {ops
        ? ops.map((op, i) => {
            if (op.type === "eq") return op.text;
            const del = op.type === "del";
            const order = del ? removed++ : added++;
            const Tag = del ? "del" : "ins";
            const start = keep && (ops[i - 1]?.type !== op.type);
            return (
              <Tag key={`${frame.run}-${i}`} data-slot={del ? "dt-del" : "dt-ins"} style={{ "--dt-i": order } as CSSProperties}>
                {start && <span className="sr-only">{del ? "removed: " : "added: "}</span>}
                <span>{op.text}</span>
              </Tag>
            );
          })
        : frame.value}
    </span>
  );
}
