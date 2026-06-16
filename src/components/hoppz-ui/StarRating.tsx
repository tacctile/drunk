"use client";

import React from "react";

export type StarRatingProps = {
  rating: number;
  max?: number;
  size?: number;
  colorClassName?: string;
};

export function StarRating({
  rating,
  max = 5,
  size = 14,
  colorClassName = "text-primary-container",
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-xs">
      {Array.from({ length: max }, (_, i) => {
        const filled = i < rating;
        return (
          <span
            key={i}
            className={`material-symbols-outlined ${colorClassName}`}
            style={{
              fontSize: size,
              fontVariationSettings: filled
                ? "'FILL' 1"
                : "'FILL' 0",
            }}
          >
            star
          </span>
        );
      })}
    </div>
  );
}
