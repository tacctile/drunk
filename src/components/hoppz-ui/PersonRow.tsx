"use client";

import React from "react";

export type PersonRowProps = {
  initials: string;
  name: string;
  subtitle?: string;
  avatarColor?: string;
  avatarUrl?: string;
  statusColor?: string;
  trailingIcon?: string;
  onClick?: () => void;
};

export function PersonRow({
  initials,
  name,
  subtitle,
  avatarColor = "#0D9488",
  avatarUrl,
  statusColor,
  trailingIcon,
  onClick,
}: PersonRowProps) {
  return (
    <button
      type="button"
      className="flex items-center justify-between w-full p-sm rounded-xl hover:bg-white/5 cursor-pointer transition-colors min-h-tap-target-min"
      onClick={onClick}
    >
      <div className="flex items-center gap-sm">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={initials}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: avatarColor }}
            >
              {initials}
            </div>
          )}
          {statusColor && (
            <div
              className="absolute -bottom-1 -right-1 w-3 h-3 border-2 border-surface-container-high rounded-full"
              style={{ backgroundColor: statusColor }}
            />
          )}
        </div>
        <div className="text-left">
          <p className="font-title-md text-title-md text-white">{name}</p>
          {subtitle && (
            <p className="text-meta-xs text-on-surface-variant">{subtitle}</p>
          )}
        </div>
      </div>
      {trailingIcon && (
        <span className="material-symbols-outlined text-on-surface-variant text-sm">
          {trailingIcon}
        </span>
      )}
    </button>
  );
}
