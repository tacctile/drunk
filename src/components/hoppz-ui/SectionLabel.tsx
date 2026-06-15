"use client";

import React from "react";

export type SectionLabelProps = {
  children: React.ReactNode;
};

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
      {children}
    </h3>
  );
}
