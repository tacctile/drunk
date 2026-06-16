"use client";

import React from "react";

export type MapHeroProps = {
  imageUrl: string;
  imageAlt?: string;
  height?: number;
  grayscale?: boolean;
  opacity?: number;
  children?: React.ReactNode;
};

export function MapHero({
  imageUrl,
  imageAlt = "Map",
  height = 280,
  grayscale = true,
  opacity = 0.6,
  children,
}: MapHeroProps) {
  return (
    <section
      className="relative w-full bg-surface-container overflow-hidden"
      style={{ height }}
    >
      <div
        className={`absolute inset-0 ${grayscale ? "grayscale" : ""}`}
        style={{ opacity }}
      >
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-full object-cover"
        />
      </div>
      {children}
    </section>
  );
}
