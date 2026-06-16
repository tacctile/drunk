"use client";

import { getInitials } from "@/lib/colors";
import { InitialsAvatar } from "@hoppz-ui";

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

function toSizeToken(px: number): "xs" | "sm" | "md" | "lg" {
  if (px <= 28) return "xs";
  if (px <= 38) return "sm";
  if (px <= 50) return "md";
  return "lg";
}

export function Avatar({ voter, size, className = "" }: AvatarProps) {
  const displayName = voter.display_name ?? voter.name;

  return (
    <span className={className}>
      <InitialsAvatar
        initials={getInitials(displayName)}
        size={toSizeToken(size)}
        color={voter.pin_color}
        avatarUrl={voter.avatar_url ?? undefined}
      />
    </span>
  );
}
