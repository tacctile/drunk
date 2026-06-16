"use client";

import React from "react";
import { GradeBadge } from "./GradeBadge";
import type { GradeBadgeColorScheme } from "./GradeBadge";

export type WalkScoreDisplayProps = {
  score: number;
  grade: string;
  colorScheme?: GradeBadgeColorScheme;
};

const scoreColorMap: Record<GradeBadgeColorScheme, string> = {
  secondary: "text-secondary",
  tertiary: "text-tertiary",
  error: "text-error",
};

export function WalkScoreDisplay({
  score,
  grade,
  colorScheme = "secondary",
}: WalkScoreDisplayProps) {
  return (
    <div className="flex flex-col items-center">
      <span className={`font-display-lg text-display-lg ${scoreColorMap[colorScheme]}`}>
        {score}
      </span>
      <GradeBadge grade={grade} colorScheme={colorScheme} pill />
    </div>
  );
}
