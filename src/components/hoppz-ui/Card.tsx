"use client";

import React from "react";

export type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`border-t border-white/[0.07] bg-surface-container-high rounded-xl p-md shadow-[0_2px_8px_rgba(0,0,0,0.35)] ${className}`}
    >
      {children}
    </div>
  );
}
