"use client";

import React from "react";

export type AvatarChipColor =
  | "primary"
  | "secondary"
  | "tertiary"
  | "error"
  | "primary-fixed";

export type AvatarChipProps = {
  name: string;
  initials?: string;
  color?: AvatarChipColor;
  active?: boolean;
  invite?: boolean;
  icon?: string;
  onClick?: () => void;
};

const colorMap: Record<
  AvatarChipColor,
  { bg: string; text: string; border: string }
> = {
  primary: {
    bg: "bg-primary/20",
    text: "text-primary",
    border: "border-primary",
  },
  secondary: {
    bg: "bg-secondary/20",
    text: "text-secondary",
    border: "border-secondary",
  },
  tertiary: {
    bg: "bg-tertiary/20",
    text: "text-tertiary",
    border: "border-tertiary",
  },
  error: {
    bg: "bg-error/20",
    text: "text-error",
    border: "border-error",
  },
  "primary-fixed": {
    bg: "bg-primary-fixed/20",
    text: "text-primary-fixed",
    border: "border-primary-fixed",
  },
};

export function AvatarChip({
  name,
  initials,
  color = "primary",
  active = false,
  invite = false,
  icon = "add",
  onClick,
}: AvatarChipProps) {
  const scheme = colorMap[color];

  const Wrapper = onClick ? "button" : "div";
  const wrapperProps = onClick
    ? { type: "button" as const, onClick }
    : {};

  if (invite) {
    return (
      <Wrapper
        className="flex flex-col items-center gap-2"
        {...wrapperProps}
      >
        <div className="w-[44px] h-[44px] rounded-full bg-surface-container-highest flex items-center justify-center border-2 border-dashed border-outline">
          <span className="material-symbols-outlined text-on-surface-variant">
            {icon}
          </span>
        </div>
        <p className="font-meta-xs text-meta-xs text-on-surface-variant">
          {name}
        </p>
      </Wrapper>
    );
  }

  return (
    <Wrapper
      className="flex flex-col items-center gap-2"
      {...wrapperProps}
    >
      <div
        className={`w-[44px] h-[44px] rounded-full ${scheme.bg} border-2 ${active ? scheme.border : "border-transparent"} flex items-center justify-center font-bold ${scheme.text} text-sm`}
      >
        {initials}
      </div>
      <p className="font-meta-xs text-meta-xs text-on-surface">{name}</p>
    </Wrapper>
  );
}
