"use client";

import React from "react";

export type InitialsAvatarProps = {
  initials: string;
  size?: "xs" | "sm" | "md" | "lg";
  color?: string;
  avatarUrl?: string;
  statusColor?: string;
};

const sizeClasses = {
  xs: "w-8 h-8 text-[10px]",
  sm: "w-10 h-10 text-sm",
  md: "w-14 h-14 text-lg",
  lg: "w-20 h-20 text-2xl",
} as const;

const dotSizeClasses = {
  xs: "w-2.5 h-2.5 -bottom-0.5 -right-0.5 border",
  sm: "w-3 h-3 -bottom-1 -right-1 border-2",
  md: "w-3.5 h-3.5 -bottom-1 -right-1 border-2",
  lg: "w-4 h-4 -bottom-1 -right-1 border-2",
} as const;

export function InitialsAvatar({
  initials,
  size = "lg",
  color = "#0D9488",
  avatarUrl,
  statusColor,
}: InitialsAvatarProps) {
  const avatar = avatarUrl ? (
    <img
      src={avatarUrl}
      alt={initials}
      className={`${sizeClasses[size]} rounded-full object-cover shadow-lg`}
    />
  ) : (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );

  if (!statusColor) return avatar;

  return (
    <div className="relative">
      {avatar}
      <div
        className={`absolute ${dotSizeClasses[size]} rounded-full border-surface-container-high`}
        style={{ backgroundColor: statusColor }}
      />
    </div>
  );
}
