"use client";

import React from "react";

export type VoteButtonProps = {
  voted?: boolean;
  icon?: string;
  onClick?: (e: React.MouseEvent) => void;
};

export function VoteButton({
  voted = false,
  icon = "how_to_vote",
  onClick,
}: VoteButtonProps) {
  const base =
    "w-tap-target-min h-tap-target-min flex items-center justify-center rounded-full transition-opacity";
  const activeClass = "bg-primary-container text-on-primary shadow-lg";
  const inactiveClass = "text-on-surface-variant opacity-40 hover:opacity-100";

  return (
    <button
      type="button"
      className={`${base} ${voted ? activeClass : inactiveClass}`}
      onClick={onClick}
    >
      <span
        className="material-symbols-outlined"
        style={
          voted
            ? { fontVariationSettings: "'FILL' 1" }
            : undefined
        }
      >
        {icon}
      </span>
    </button>
  );
}
