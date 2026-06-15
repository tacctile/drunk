"use client";

import React from "react";

export type ReactionPillProps = {
  emoji: string;
  count: number;
  active?: boolean;
  onClick?: () => void;
};

export function ReactionPill({
  emoji,
  count,
  active = false,
  onClick,
}: ReactionPillProps) {
  const activeClass = active
    ? "bg-primary/10 border-primary/30"
    : "bg-white/5 border-white/10";

  return (
    <button
      type="button"
      className={`flex items-center gap-1 px-2 py-1 rounded-[20px] ${activeClass} min-h-tap-target-min min-w-tap-target-min transition-colors`}
      onClick={onClick}
    >
      <span className="text-xs">{emoji}</span>
      <span className="font-label-sm text-label-sm text-on-surface-variant">
        {count}
      </span>
    </button>
  );
}
