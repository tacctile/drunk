"use client";

import React from "react";

export type CardHeaderProps = {
  icon: string;
  title: string;
  rightIcon?: string;
  rightIconClassName?: string;
  onRightIconClick?: () => void;
};

export function CardHeader({
  icon,
  title,
  rightIcon,
  rightIconClassName = "text-on-surface-variant",
  onRightIconClick,
}: CardHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-sm">
        <span className="material-symbols-outlined text-primary">{icon}</span>
        <h3 className="font-title-md text-title-md text-on-surface">{title}</h3>
      </div>
      {rightIcon &&
        (onRightIconClick ? (
          <button
            type="button"
            className={`w-tap-target-min h-tap-target-min flex items-center justify-center ${rightIconClassName}`}
            onClick={onRightIconClick}
          >
            <span className="material-symbols-outlined">{rightIcon}</span>
          </button>
        ) : (
          <span className={`material-symbols-outlined ${rightIconClassName}`}>
            {rightIcon}
          </span>
        ))}
    </div>
  );
}
