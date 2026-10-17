"use client";

import { useState, type ComponentProps } from "react";
import { cn } from "./lib/cn";
import "./avatar.css";

export type AvatarProps = Omit<ComponentProps<"span">, "children"> & {
  name: string;
  src?: string;
  alt?: string;
  /** Shown as a shape at the corner: filled, half, dash or ring. */
  presence?: "online" | "away" | "busy" | "offline";
};

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
  presence,
  className,
  ...props
}: AvatarProps) {
  const words = name.trim().normalize("NFC").split(/\s+/u);
  const initials =
    (Array.from(words[0] ?? "")[0] ?? "?") +
    (words.length > 1 ? (Array.from(words[words.length - 1]!)[0] ?? "") : "");

  return (
    <span
      data-slot="avatar"
      data-tone={avatarTone(name)}
      className={cn(
        "relative inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        className,
      )}
      {...props}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={!alt || undefined}
    >
      <AvatarContent
        key={src ?? ""}
        src={src}
        initials={initials.toUpperCase()}
      />
      {presence && <span data-slot="avatar-presence" data-presence={presence} aria-hidden="true" />}
    </span>
  );
}
