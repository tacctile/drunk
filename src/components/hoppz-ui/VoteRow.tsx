"use client";

import React from "react";
import { ProgressBar } from "./ProgressBar";
import { GhostButton } from "./GhostButton";

export type VoteRowProps = {
  label: string;
  count: number;
  countLabel?: string;
  percentage: number;
  highlight?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

export function VoteRow({
  label,
  count,
  countLabel = "votes",
  percentage,
  highlight = false,
  actionLabel,
  onAction,
}: VoteRowProps) {
  const countColor = highlight ? "text-sky-blue" : "text-on-surface-variant";
  const barColor = highlight ? "bg-sky-blue" : "bg-surface-container-highest";
  const btnColor = highlight ? "text-sky-blue" : "text-on-surface-variant";

  return (
    <div className="space-y-sm">
      <div className="flex flex-col gap-xs">
        <div className="flex justify-between items-end">
          <span className="font-label-sm text-label-sm">{label}</span>
          <span className={`font-meta-xs text-meta-xs ${countColor}`}>
            {count} {countLabel}
          </span>
        </div>
        <ProgressBar value={percentage} colorClassName={barColor} />
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
