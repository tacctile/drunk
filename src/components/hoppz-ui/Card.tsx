"use client";

import React from "react";

export type CardProps = {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
};

export function Card({ children, className = "", glass = false }: CardProps) {
  const base = glass
    ? "bg-[rgba(41,42,45,0.8)] backdrop-blur-[8px] border-t border-white/[0.07]"
    : "border-t border-white/[0.07] bg-surface-container-high";

  return (
    <div
      className={`${base} rounded-xl p-md shadow-[0_2px_8px_rgba(0,0,0,0.35)] ${className}`}
    >
      {children}
    </div>
  );
}
