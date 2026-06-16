"use client";

import React from "react";

export type InfoCardProps = {
  label: string;
  value: string;
};

export function InfoCard({ label, value }: InfoCardProps) {
  return (
    <div className="bg-surface-container rounded-xl p-md">
      <p className="font-meta-xs text-meta-xs text-on-surface-variant mb-1">
        {label}
      </p>
      <p className="font-title-md text-title-md text-on-surface">{value}</p>
    </div>
  );
}
