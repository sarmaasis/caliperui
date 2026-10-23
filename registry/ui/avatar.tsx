"use client";

import { createContext, useContext, useState, type ComponentProps } from "react";
import { cn } from "./lib/cn";
import "./avatar.css";

export type AvatarProps = Omit<ComponentProps<"span">, "children"> & {
  name: string;
  src?: string;
  alt?: string;
  /** "square" for a company, workspace or integration: a coloured mark instead of a person's orb or photo. */
  shape?: "circle" | "square";
  /** Shown as a shape at the corner: filled, half, dash or ring. */
  presence?: "online" | "away" | "busy" | "offline";
};

/** Resolves a person's photo from their name when an Avatar has no `src`: your user directory, or sample faces in a demo.
    Return undefined for anyone without one and they keep their orb. */
export const AvatarPhotos = createContext<((name: string) => string | undefined) | null>(null);

/** The same name always gets the same orb (six glass orbs; the first follows the accent). */
export function avatarTone(name: string) {
  let hash = 7;
  for (const char of name.trim().toLowerCase()) hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
  return hash % 6;
}

function AvatarContent({ src, initials }: { src?: string; initials: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <>
      <span aria-hidden="true">{initials}</span>
      {src && !failed && (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          width={32}
          height={32}
          decoding="async"
          className="absolute inset-0 size-full object-cover"
          ref={(image) => {
            // A cached or pre-hydration failure may precede the error listener.
            if (image?.complete && image.naturalWidth === 0) setFailed(true);
          }}
          onError={() => setFailed(true)}
        />
      )}
    </>
  );
}

export function Avatar({
  name,
  src,
  alt = name,
  shape = "circle",
  presence,
  className,
  ...props
}: AvatarProps) {
  const resolve = useContext(AvatarPhotos);
  const photo = src ?? (shape === "circle" ? resolve?.(name) : undefined);
  const words = name.trim().normalize("NFC").split(/\s+/u);
  const initials =
    (Array.from(words[0] ?? "")[0] ?? "?") +
    (words.length > 1 ? (Array.from(words[words.length - 1]!)[0] ?? "") : "");

  return (
    <span
      data-slot="avatar"
      data-tone={avatarTone(name)}
      data-shape={shape === "square" ? "square" : undefined}
      className={cn(
        "relative inline-flex size-8 shrink-0 items-center justify-center text-xs font-semibold",
        shape === "square" ? "rounded-[8px]" : "rounded-full",
        className,
      )}
      {...props}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={!alt || undefined}
    >
      <AvatarContent
        key={photo ?? ""}
        src={photo}
        initials={initials.toUpperCase()}
      />
      {presence && <span data-slot="avatar-presence" data-presence={presence} aria-hidden="true" />}
    </span>
  );
}
