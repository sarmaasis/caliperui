"use client";

import { useLayoutEffect, useState } from "react";
import "./glide-highlight.css";

export type GlideBox = {
  active: boolean;
  left: number;
  top: number;
  width: number;
  height: number;
};

export function glideBox(target: HTMLElement): GlideBox {
  return {
    active: true,
    left: target.offsetLeft,
    top: target.offsetTop,
    width: target.offsetWidth,
    height: target.offsetHeight,
  };
}

export function useHighlightedGlide(
  root: HTMLElement | null,
  selector = "[data-highlighted]",
  /** Attributes whose change can move the target, e.g. data-state for an open trigger. */
  attributes: readonly string[] = ["data-highlighted"],
) {
  const [box, setBox] = useState<GlideBox | null>(null);

  useLayoutEffect(() => {
    const element = root;
    if (!element) return;
    const update = () => {
      const target = element.querySelector<HTMLElement>(selector);
      setBox((current) =>
        target ? glideBox(target) : current ? { ...current, active: false } : null,
      );
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(element, {
      subtree: true,
      attributes: true,
      attributeFilter: [...attributes],
    });
    return () => observer.disconnect();
    // The attribute list is fixed per call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, selector]);

  return box;
}

export function GlideHighlight({ box }: { box: GlideBox | null }) {
  if (!box) return null;
  return (
    <span
      aria-hidden="true"
      data-slot="glide-highlight"
      data-active={box.active}
      style={{
        width: box.width,
        height: box.height,
        transform: `translate(${box.left}px, ${box.top}px)`,
      }}
    />
  );
}
