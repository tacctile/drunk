"use client";

import React from "react";

export type DayDividerProps = {
  label: string;
};

export function DayDivider({ label }: DayDividerProps) {
  return (
    <div className="flex justify-center my-lg">
      <span className="bg-surface-variant text-on-surface-variant font-label-sm text-label-sm px-4 py-1 rounded-full">
        {label}
      </span>
    </div>
  );
}
