"use client";

import React from "react";
import { InitialsAvatar } from "./InitialsAvatar";

export type ProfileHeroProps = {
  initials: string;
  name: string;
  subtitle: string;
  avatarColor?: string;
  avatarUrl?: string;
  onEditPhoto?: () => void;
};

export function ProfileHero({
  initials,
  name,
  subtitle,
  avatarColor,
  avatarUrl,
  onEditPhoto,
}: ProfileHeroProps) {
  return (
    <div className="flex items-center space-x-md py-sm">
      <div className="relative flex flex-col items-center">
        <InitialsAvatar
          initials={initials}
          size="lg"
          color={avatarColor}
          avatarUrl={avatarUrl}
        />
        {onEditPhoto && (
          <button
            type="button"
            className="mt-2 font-label-sm text-label-sm text-primary"
            onClick={onEditPhoto}
          >
            Edit photo
          </button>
        )}
      </div>
      <div className="flex flex-col">
        <h2 className="font-display-lg text-display-lg text-on-surface leading-tight">
          {name}
        </h2>
        <span className="font-meta-xs text-meta-xs text-on-surface-variant">
          {subtitle}
        </span>
      </div>
    </div>
  );
}
