"use client";

import React from "react";

export type SlidingPanelProps = {
  title: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  open?: boolean;
  onToggle?: () => void;
  width?: number;
};

export function SlidingPanel({
  title,
  headerRight,
  children,
  footer,
  open = true,
  onToggle,
  width = 280,
}: SlidingPanelProps) {
  return (
    <aside
      className="absolute top-0 right-0 h-full z-40 transition-transform duration-300 ease-out flex"
      style={{
        width: `${width}px`,
        transform: open ? "translateX(0)" : `translateX(${width}px)`,
      }}
    >
      {onToggle && (
        <button
          type="button"
          className="h-16 w-8 bg-surface-container-high/90 backdrop-blur-xl self-center rounded-l-xl flex items-center justify-center border-y border-l border-white/10 text-on-surface-variant hover:text-on-surface min-h-tap-target-min"
          onClick={onToggle}
        >
          <span className="material-symbols-outlined">
            {open ? "chevron_right" : "chevron_left"}
          </span>
        </button>
      )}
      <div className="flex-grow bg-surface-dim/[0.88] backdrop-blur-xl border-l border-white/10 flex flex-col p-md overflow-hidden">
        <div className="flex items-center justify-between mb-lg">
          <h2 className="font-title-md text-title-md text-on-surface">
            {title}
          </h2>
          {headerRight}
        </div>
        <div className="flex-grow overflow-y-auto pr-xs">{children}</div>
        {footer && (
          <div className="mt-lg border-t border-white/5 pt-md">{footer}</div>
        )}
      </div>
    </aside>
  );
}
