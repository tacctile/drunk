"use client";

import React from "react";

export type TopAppBarProps = {
  title: string;
  actions?: React.ReactNode;
};

export function TopAppBar({ title, actions }: TopAppBarProps) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between h-[56px] px-margin-mobile bg-surface-container-high border-b border-outline-variant shadow-sm">
      <h1 className="font-title-md text-title-md font-extrabold text-on-surface">
        {title}
      </h1>
      {actions && <div className="flex items-center gap-md">{actions}</div>}
    </header>
  );
}
