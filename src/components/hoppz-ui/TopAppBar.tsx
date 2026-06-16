"use client";

import React from "react";

export type TopAppBarProps = {
  title: string;
  subtitle?: string;
  leadingIcon?: string;
  leadingIconClassName?: string;
  onLeadingAction?: () => void;
  centerSlot?: React.ReactNode;
  actions?: React.ReactNode;
  position?: "sticky" | "fixed";
  glass?: boolean;
};

export function TopAppBar({
  title,
  subtitle,
  leadingIcon,
  leadingIconClassName = "text-primary",
  onLeadingAction,
  centerSlot,
  actions,
  position = "sticky",
  glass = false,
}: TopAppBarProps) {
  const bg = glass
    ? "bg-[rgba(32,33,36,0.85)] backdrop-blur-[12px] border-b border-white/[0.07]"
    : "bg-surface-container-high border-b border-outline-variant shadow-sm";

  const leadingIconEl = leadingIcon && (
    <span className={`material-symbols-outlined ${leadingIconClassName}`}>
      {leadingIcon}
    </span>
  );

  return (
    <header className={`${position} top-0 z-50 flex items-center justify-between h-[56px] px-margin-mobile ${bg}`}>
      <div className="flex items-center gap-md">
        {leadingIcon && onLeadingAction ? (
          <button
            type="button"
            aria-label="Back"
            className="w-tap-target-min h-tap-target-min flex items-center justify-center active:scale-95 transition-transform"
            onClick={onLeadingAction}
          >
            {leadingIconEl}
          </button>
        ) : (
          leadingIconEl
        )}
        <div className="flex flex-col">
          <h1 className="font-title-md text-title-md font-extrabold text-on-surface leading-tight">
            {title}
          </h1>
          {subtitle && (
            <span className="font-meta-xs text-meta-xs text-on-surface-variant">
              {subtitle}
            </span>
          )}
        </div>
      </div>
      {centerSlot}
      {actions && <div className="flex items-center gap-md">{actions}</div>}
    </header>
  );
}
