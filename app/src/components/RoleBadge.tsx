"use client";

import type { UserRole } from "@/lib/roles";
import { ROLE_BADGE_ICONS, ROLE_LABELS } from "@/lib/roles";
import { StatusPill } from "@hoppz-ui";

interface RoleBadgeProps {
  role: UserRole;
  size?: "sm" | "md";
}

export function RoleBadge({ role, size = "sm" }: RoleBadgeProps) {
  if (!role) return null;

  const variant = role === "super_admin" ? "active" : "default";

  return (
    <StatusPill
      icon={ROLE_BADGE_ICONS[role]}
      label={ROLE_LABELS[role]}
      size={size}
      variant={variant}
    />
  );
}
