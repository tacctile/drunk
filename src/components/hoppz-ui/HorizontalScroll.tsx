"use client";

import React from "react";

export type HorizontalScrollProps = {
  children: React.ReactNode;
  className?: string;
};

export function HorizontalScroll({
  children,
  className = "",
}: HorizontalScrollProps) {
  return (
    <div
      className={`flex gap-md overflow-x-auto pb-md -mx-margin-mobile px-margin-mobile scrollbar-hide ${className}`}
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {children}
    </div>
  );
}
