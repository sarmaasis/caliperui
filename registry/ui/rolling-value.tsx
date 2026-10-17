"use client";

import { useState } from "react";
import "./rolling-value.css";

export function RollingValue({
  value,
  direction,
}: {
  value: string;
  direction: "up" | "down" | "none";
}) {
  const [frame, setFrame] = useState({ value, prior: value });
  if (frame.value !== value) setFrame({ value, prior: frame.value });
  const prior = frame.prior;
  const glyphs = [...value];

  return (
    <span className="inline-flex items-center font-medium tabular-nums" aria-hidden="true">
      {glyphs.map((glyph, index) => {
        const changed = prior.length !== glyphs.length || prior[index] !== glyph;
        return (
          <span key={`${index}-${glyph}`} className="inline-block h-[1.2em] overflow-hidden">
            <span
              data-slot="number-digit"
              data-direction={changed ? direction : "none"}
              className="block"
            >
              {glyph === " " ? "\u00A0" : glyph}
            </span>
          </span>
        );
      })}
    </span>
  );
}
