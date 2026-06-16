"use client";

import React from "react";

export type StickyDateHeaderProps = {
  label: string;
  topOffset?: string;
  className?: string;
};

export function StickyDateHeader({
  label,
  topOffset = "56px",
  className = "",
}: StickyDateHeaderProps) {
  return (
    <div
      className={`sticky z-40 bg-background/95 backdrop-blur-md px-margin-mobile py-sm border-b border-outline-variant/10 ${className}`}
      style={{ top: topOffset }}
    >
      <h2 className="text-[12px] font-bold tracking-widest text-on-surface-variant uppercase">
        {label}
      </h2>
    </div>
  );
}
