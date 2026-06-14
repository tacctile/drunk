"use client";

import { useState } from "react";
import { contrastColor, getInitials } from "@/lib/colors";

interface AvatarProps {
  voter: {
    display_name: string | null;
    name: string;
    pin_color: string;
    avatar_url?: string | null;
  };
  size: number;
  className?: string;
}

export function Avatar({ voter, size, className = "" }: AvatarProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const displayName = voter.display_name ?? voter.name;
  const hasImage = Boolean(voter.avatar_url) && !errored;

  return (
    <span
      className={`relative flex flex-none items-center justify-center rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      <span
        className="flex h-full w-full items-center justify-center rounded-full font-bold"
        style={{
          background: voter.pin_color,
          color: contrastColor(voter.pin_color),
          fontSize: Math.max(size * 0.3, 10),
          opacity: hasImage && loaded ? 0 : 1,
        }}
      >
        {getInitials(displayName)}
      </span>
      {hasImage && (
        <img
          src={voter.avatar_url!}
          alt=""
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className="absolute inset-0 h-full w-full rounded-full object-cover"
          style={{ opacity: loaded ? 1 : 0 }}
        />
      )}
    </span>
  );
}
