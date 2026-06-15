"use client";

import React from "react";

export type BottomNavProps = {
  children: React.ReactNode;
  className?: string;
};

export function BottomNav({ children, className = "" }: BottomNavProps) {
  return (
    <div
      className={`flex items-center justify-around h-[72px] bg-[#202124] border-t border-white/5 px-4 pb-[env(safe-area-inset-bottom)] ${className}`}
    >
      {children}
    </div>
  );
}
