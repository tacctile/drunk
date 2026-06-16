"use client";

import React from "react";

export type ColumnHeader = {
  label: string;
  width: string;
  align?: "left" | "center" | "right";
};

export type ColumnHeadersProps = {
  columns: ColumnHeader[];
  sticky?: boolean;
  topOffset?: number;
};

const alignClass: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function ColumnHeaders({
  columns,
  sticky = true,
  topOffset = 56,
}: ColumnHeadersProps) {
  const positionClass = sticky ? "sticky z-40" : "";
  return (
    <div
      className={`${positionClass} bg-surface/95 backdrop-blur-md px-margin-mobile py-sm flex items-center justify-between border-b border-outline-variant/30`}
      style={sticky ? { top: topOffset } : undefined}
    >
      {columns.map((col) => (
        <div
          key={col.label}
          className={`flex flex-col ${alignClass[col.align ?? "left"]}`}
          style={{ width: col.width }}
        >
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
            {col.label}
          </span>
        </div>
      ))}
    </div>
  );
}
