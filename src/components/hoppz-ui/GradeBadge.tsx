"use client";

import React from "react";

export type GradeBadgeColorScheme = "secondary" | "tertiary" | "error";

export type GradeBadgeProps = {
  grade: string;
  colorScheme?: GradeBadgeColorScheme;
  pill?: boolean;
};

const colorClasses: Record<GradeBadgeColorScheme, string> = {
  secondary: "bg-secondary/10 text-secondary border-secondary/20",
  tertiary: "bg-tertiary/10 text-tertiary border-tertiary/20",
  error: "bg-error/10 text-error border-error/20",
};

export function GradeBadge({
  grade,
  colorScheme = "secondary",
  pill = false,
}: GradeBadgeProps) {
  const shape = pill ? "rounded-full" : "rounded";
  return (
    <div
      className={`px-2 py-0.5 font-label-sm text-label-sm border ${shape} ${colorClasses[colorScheme]}`}
    >
      {grade}
    </div>
  );
}
