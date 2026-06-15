"use client";

import React from "react";

export type OverlayHeaderProps = {
  title: string;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
};

export function OverlayHeader({ title, onBack, rightSlot }: OverlayHeaderProps) {
  return (
    <header className="flex items-center justify-between h-[56px] px-margin-mobile border-b border-white/5 bg-[#202124] z-10">
      <button
        type="button"
        className="w-tap-target-min h-tap-target-min flex items-center justify-start text-on-surface hover:opacity-80 transition-opacity active:scale-95"
        onClick={onBack}
        aria-label="Go back"
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </button>
      <h1 className="font-title-md text-title-md text-on-surface">{title}</h1>
      {rightSlot ?? <div className="w-tap-target-min h-tap-target-min" />}
    </header>
  );
}
