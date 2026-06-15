"use client";

import React from "react";
import { RatingPill } from "./RatingPill";

export type HotelCardProps = {
  imageUrl: string;
  imageAlt?: string;
  rating?: number;
  name: string;
  subtitle: string;
  preferenceCount?: number;
  preferenceLabel?: string;
  price?: string;
  priceUnit?: string;
  onClick?: () => void;
};

export function HotelCard({
  imageUrl,
  imageAlt = "",
  rating,
  name,
  subtitle,
  preferenceCount,
  preferenceLabel = "prefers",
  price,
  priceUnit = "/nt",
  onClick,
}: HotelCardProps) {
  return (
    <div
      className="flex-shrink-0 w-64 bg-[rgba(41,42,45,0.8)] backdrop-blur-[8px] border-t border-white/[0.07] rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.35)] active:scale-[0.98] transition-transform"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="h-40 w-full relative">
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-full object-cover"
        />
        {rating != null && (
          <div className="absolute top-sm right-sm">
            <RatingPill rating={rating} />
          </div>
        )}
      </div>
      <div className="p-md space-y-sm">
        <div>
          <h4 className="font-label-sm text-label-sm truncate">{name}</h4>
          <p className="text-on-surface-variant text-meta-xs font-meta-xs">
            {subtitle}
          </p>
        </div>
        {(preferenceCount != null || price) && (
          <div className="flex items-center justify-between border-t border-outline-variant/30 pt-sm">
            {preferenceCount != null && (
              <div className="flex items-center gap-xs text-sky-blue font-bold">
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  favorite
                </span>
                <span className="text-xs">
                  {preferenceCount} {preferenceLabel}
                </span>
              </div>
            )}
            {price && (
              <span className="text-xs font-extrabold text-on-surface">
                {price}
                <span className="font-normal text-on-surface-variant">
                  {priceUnit}
                </span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
