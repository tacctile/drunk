"use client";

import React from "react";
import { WalkScoreDisplay } from "./WalkScoreDisplay";
import { VoteButton } from "./VoteButton";
import type { GradeBadgeColorScheme } from "./GradeBadge";

export type CityListRowProps = {
  cityName: string;
  stateCode: string;
  district?: string;
  walkScore: number;
  grade: string;
  gradeColor?: GradeBadgeColorScheme;
  distance: string;
  driveTime: string;
  voted?: boolean;
  onVote?: () => void;
  onClick?: () => void;
};

export function CityListRow({
  cityName,
  stateCode,
  district,
  walkScore,
  grade,
  gradeColor = "secondary",
  distance,
  driveTime,
  voted = false,
  onVote,
  onClick,
}: CityListRowProps) {
  const votedBg = voted ? "bg-primary/5 border-l-[4px] border-primary-container" : "";
  const borderBottom = voted ? "" : "border-b border-outline-variant/10";

  return (
    <div
      className={`relative min-h-[80px] px-margin-mobile py-md flex items-center justify-between transition-all active:scale-[0.98] duration-150 ${votedBg} ${borderBottom} ${!voted ? "hover:bg-surface-container/50" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="w-[35%] flex flex-col">
        <div className="flex items-baseline gap-xs">
          <span className="font-title-md text-title-md text-on-surface">
            {cityName}
          </span>
          <span className="font-label-sm text-[11px] text-on-surface-variant">
            {stateCode}
          </span>
        </div>
        {district && (
          <span className="font-meta-xs text-meta-xs text-on-surface-variant opacity-70">
            {district}
          </span>
        )}
      </div>

      <div className="w-[20%]">
        <WalkScoreDisplay
          score={walkScore}
          grade={grade}
          colorScheme={gradeColor}
        />
      </div>

      <div className="w-[25%] flex flex-col items-end">
        <span className="font-title-md text-title-md text-on-surface">
          {distance}
        </span>
        <span className="font-meta-xs text-meta-xs text-on-surface-variant">
          {driveTime}
        </span>
      </div>

      <div className="w-[15%] flex justify-end">
        <VoteButton
          voted={voted}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onVote?.();
          }}
        />
      </div>
    </div>
  );
}
