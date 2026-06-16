"use client";

import React from "react";

export type BottomNavProps = {
  children: React.ReactNode;
  className?: string;
  height?: number;
  elevated?: boolean;
  fixed?: boolean;
};

export function BottomNav({
  children,
  className = "",
  height = 72,
  elevated = false,
  fixed = false,
}: BottomNavProps) {
  const shadow = elevated
    ? "shadow-[0_-2px_16px_rgba(0,0,0,0.4)]"
    : "";
  const fixedClass = fixed
    ? "fixed bottom-0 left-0 w-full z-50"
    : "";
  return (
    <div
      className={`flex items-center justify-around bg-surface-container-high border-t border-white/5 px-2 pb-[env(safe-area-inset-bottom)] ${shadow} ${fixedClass} ${className}`}
      style={{ height }}
    >
      {children}
    </div>
  );
}
