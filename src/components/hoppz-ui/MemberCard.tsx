"use client";

import React from "react";

export type MemberCardProps = {
  initials: string;
  name: string;
  avatarColor?: string;
  avatarUrl?: string;
  statusDotColor?: string;
  statusText?: string;
  badge?: React.ReactNode;
  onClick?: () => void;
};

export function MemberCard({
  initials,
  name,
  avatarColor = "#0D9488",
  avatarUrl,
  statusDotColor,
  statusText,
  badge,
  onClick,
}: MemberCardProps) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className="bg-[rgba(41,42,45,0.6)] backdrop-blur-[12px] border-t border-white/[0.07] p-md rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.35)] flex items-center gap-md active:scale-[0.98] transition-transform cursor-pointer"
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="relative">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={initials}
            className="w-11 h-11 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </div>
        )}
        {statusDotColor && (
          <div
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface-container-high"
            style={{ backgroundColor: statusDotColor }}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between">
          <div className="flex flex-col min-w-0">
            <span className="font-title-md text-title-md text-on-surface truncate">
              {name}
            </span>
            {statusText && (
              <p className="font-meta-xs text-meta-xs text-secondary flex items-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                {statusText}
              </p>
            )}
          </div>
          {badge}
        </div>
      </div>
    </div>
  );
}
