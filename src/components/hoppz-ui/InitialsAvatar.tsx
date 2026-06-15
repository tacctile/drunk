"use client";

import React from "react";

export type InitialsAvatarProps = {
  initials: string;
  size?: "sm" | "md" | "lg";
  color?: string;
  avatarUrl?: string;
};

const sizeClasses = {
  sm: "w-10 h-10 text-sm",
  md: "w-14 h-14 text-lg",
  lg: "w-20 h-20 text-2xl",
} as const;

export function InitialsAvatar({
  initials,
  size = "lg",
  color = "#0D9488",
  avatarUrl,
}: InitialsAvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={initials}
        className={`${sizeClasses[size]} rounded-full object-cover shadow-lg`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}
