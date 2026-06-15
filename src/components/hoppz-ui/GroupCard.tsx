"use client";

import React from "react";

export type GroupCardProps = {
  icon: string;
  name: string;
  status: string;
  statusClassName?: string;
  iconBgClassName?: string;
  iconClassName?: string;
  onClick?: () => void;
};

export function GroupCard({
  icon,
  name,
  status,
  statusClassName = "text-secondary font-bold",
  iconBgClassName = "bg-secondary-container text-on-secondary-container",
  iconClassName,
  onClick,
}: GroupCardProps) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      className="bg-surface-container-low p-sm rounded-xl flex items-center gap-sm w-full min-h-tap-target-min"
      onClick={onClick}
    >
      <div
        className={`w-10 h-10 flex items-center justify-center rounded-lg ${iconBgClassName}`}
      >
        <span className={`material-symbols-outlined ${iconClassName ?? ""}`}>
          {icon}
        </span>
      </div>
      <div className="text-left">
        <p className="font-title-md text-title-md text-white">{name}</p>
        <p className={`text-meta-xs ${statusClassName}`}>{status}</p>
      </div>
    </Wrapper>
  );
}
