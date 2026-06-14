"use client";

import type { UserRole } from "@/lib/roles";
import { ROLE_BADGE_ICONS, ROLE_LABELS } from "@/lib/roles";
import { Icon } from "./Icon";

interface RoleBadgeProps {
  role: UserRole;
  size?: "sm" | "md";
}

export function RoleBadge({ role, size = "sm" }: RoleBadgeProps) {
  if (!role) return null;

  const isSA = role === "super_admin";
  const bgClass = isSA ? "bg-accent-dim" : "bg-green-dim";
  const textClass = isSA ? "text-accent" : "text-green";
  const iconSize = size === "sm" ? 14 : 16;
  const textSize = size === "sm" ? "text-[11px]" : "text-[13px]";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${bgClass} ${textClass}`}
    >
      <Icon name={ROLE_BADGE_ICONS[role]} size={iconSize} />
      <span className={`${textSize} font-semibold`}>{ROLE_LABELS[role]}</span>
    </span>
  );
}
