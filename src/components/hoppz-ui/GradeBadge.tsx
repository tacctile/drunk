"use client";

import React from "react";

export type GradeBadgeProps = {
  grade: string;
};

export function GradeBadge({ grade }: GradeBadgeProps) {
  return (
    <div className="px-2 py-0.5 bg-secondary/20 text-secondary rounded font-label-sm text-label-sm border border-secondary/30">
      {grade}
    </div>
  );
}
