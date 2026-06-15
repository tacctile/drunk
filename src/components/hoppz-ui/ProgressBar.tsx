"use client";

import React from "react";

export type ProgressBarProps = {
  value: number;
  colorClassName?: string;
};

export function ProgressBar({
  value,
  colorClassName = "bg-sky-blue",
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
      <div
        className={`${colorClassName} h-full rounded-full transition-all`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
