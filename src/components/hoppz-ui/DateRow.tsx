"use client";

import React from "react";
import { DateTile } from "./DateTile";
import { GhostButton } from "./GhostButton";

export type DateRowProps = {
  month: string;
  day: number;
  dateRange: string;
  freeCount: number;
  freeLabel?: string;
  highlight?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

export function DateRow({
  month,
  day,
  dateRange,
  freeCount,
  freeLabel = "free",
  highlight = false,
  actionLabel,
  onAction,
}: DateRowProps) {
  const countColor = highlight ? "text-secondary" : "text-on-surface-variant";
  const btnColor = highlight ? "text-secondary" : "text-on-surface-variant";

  return (
    <div className="space-y-sm">
      <div className="flex items-center gap-sm">
        <DateTile month={month} day={day} highlight={highlight} />
        <div className="flex flex-col">
          <span className="font-label-sm text-label-sm">{dateRange}</span>
          <span className={`font-meta-xs text-meta-xs ${countColor}`}>
            {freeCount} {freeLabel}
          </span>
        </div>
      </div>
      {actionLabel && (
        <GhostButton
          label={actionLabel}
          colorClassName={btnColor}
          onClick={onAction}
        />
      )}
    </div>
  );
}
