"use client";

import React from "react";

export type TripHeroCardProps = {
  label: string;
  destination: string;
  countdownValue: string | number;
  countdownLabel: string;
  dateRange?: string;
  dateIcon?: string;
  accentClassName?: string;
  className?: string;
};

export function TripHeroCard({
  label,
  destination,
  countdownValue,
  countdownLabel,
  dateRange,
  dateIcon = "calendar_today",
  accentClassName = "border-primary",
  className = "",
}: TripHeroCardProps) {
  return (
    <section
      className={`relative w-full rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.35)] border-t border-white/[0.07] bg-surface-container-high border-l-4 ${accentClassName} ${className}`}
    >
      <div className="p-lg flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider mb-1">
              {label}
            </p>
            <h2 className="font-display-lg text-display-lg text-on-surface">
              {destination}
            </h2>
          </div>
          <div className="text-right">
            <p className="font-display-lg text-display-lg text-primary">
              {countdownValue}
            </p>
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase">
              {countdownLabel}
            </p>
          </div>
        </div>
        {dateRange && (
          <div className="mt-4 flex items-center gap-2 text-on-surface-variant">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20 }}
            >
              {dateIcon}
            </span>
            <p className="font-body-md text-body-md">{dateRange}</p>
          </div>
        )}
      </div>
    </section>
  );
}
