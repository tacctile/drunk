"use client";

import React from "react";

export type DateTileProps = {
  month: string;
  day: number;
  highlight?: boolean;
};

export function DateTile({
  month,
  day,
  highlight = false,
}: DateTileProps) {
  const bg = highlight
    ? "bg-secondary/10 border-secondary/20"
    : "bg-surface-variant/20 border-outline-variant/20";
  const monthColor = highlight ? "text-secondary" : "text-on-surface-variant";

  return (
    <div
      className={`w-10 h-10 rounded-lg ${bg} border flex flex-col items-center justify-center`}
    >
      <span
        className={`text-[10px] font-bold ${monthColor} uppercase leading-none`}
      >
        {month}
      </span>
      <span className="text-sm font-extrabold text-on-surface">{day}</span>
    </div>
  );
}
