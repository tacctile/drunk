"use client";

import React from "react";

export type RatingPillProps = {
  rating: number;
  icon?: string;
};

export function RatingPill({ rating, icon = "star" }: RatingPillProps) {
  return (
    <div className="px-xs py-[2px] bg-black/40 backdrop-blur-md rounded-full flex items-center gap-xs">
      <span
        className="material-symbols-outlined text-secondary text-[14px]"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {icon}
      </span>
      <span className="text-xs font-bold text-on-surface">{rating}</span>
    </div>
  );
}
