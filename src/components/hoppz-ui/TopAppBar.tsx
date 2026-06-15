"use client";

import React from "react";

export type TopAppBarProps = {
  title: string;
  leadingIcon?: string;
  leadingIconClassName?: string;
  centerSlot?: React.ReactNode;
  actions?: React.ReactNode;
};

export function TopAppBar({
  title,
  leadingIcon,
  leadingIconClassName = "text-primary",
  centerSlot,
  actions,
}: TopAppBarProps) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between h-[56px] px-margin-mobile bg-surface-container-high border-b border-outline-variant shadow-sm">
      <div className="flex items-center gap-3">
        {leadingIcon && (
          <span className={`material-symbols-outlined ${leadingIconClassName}`}>
            {leadingIcon}
          </span>
        )}
        <h1 className="font-title-md text-title-md font-extrabold text-on-surface">
          {title}
        </h1>
      </div>
      {centerSlot}
      {actions && <div className="flex items-center gap-md">{actions}</div>}
    </header>
  );
}
