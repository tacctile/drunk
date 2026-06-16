"use client";

import React from "react";

export type PageTitleProps = {
  children: React.ReactNode;
};

export function PageTitle({ children }: PageTitleProps) {
  return (
    <h2 className="font-display-lg text-display-lg text-on-surface">
      {children}
    </h2>
  );
}
