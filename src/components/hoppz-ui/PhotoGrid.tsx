"use client";

import React from "react";

export type PhotoGridProps = {
  columns?: 2 | 3 | 4;
  gap?: string;
  children: React.ReactNode;
  className?: string;
};

const colClasses = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
} as const;

export function PhotoGrid({
  columns = 3,
  gap = "gap-[2px]",
  children,
  className = "",
}: PhotoGridProps) {
  return (
    <div className={`grid ${colClasses[columns]} ${gap} ${className}`}>
      {children}
    </div>
  );
}
