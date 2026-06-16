"use client";

import React from "react";

export type VenueListCardProps = {
  name: string;
  address?: string;
  imageUrl?: string;
  imageAlt?: string;
  price?: string;
  tags?: React.ReactNode;
  rating?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
};

export function VenueListCard({
  name,
  address,
  imageUrl,
  imageAlt = "",
  price,
  tags,
  rating,
  action,
  onClick,
}: VenueListCardProps) {
  const hasImage = !!imageUrl;

  return (
    <div
      className={`bg-surface-container-high rounded-xl p-md shadow-[0_2px_8px_rgba(0,0,0,0.35)] border-t border-white/[0.07] flex ${hasImage ? "flex-row gap-md" : "flex-col gap-sm"}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {hasImage && (
        <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
          <img
            src={imageUrl}
            alt={imageAlt}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {hasImage ? (
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex justify-between items-start gap-sm">
              <h3 className="font-title-md text-title-md text-on-surface truncate">
                {name}
              </h3>
              {price && (
                <span className="font-label-sm text-label-sm text-primary-container shrink-0">
                  {price}
                </span>
              )}
            </div>
            {address && (
              <p className="font-meta-xs text-meta-xs text-on-surface-variant mb-1">
                {address}
              </p>
            )}
            {rating}
          </div>
          {action}
        </div>
      ) : (
        <div className="flex justify-between items-start gap-sm">
          <div className="min-w-0">
            <h3 className="font-title-md text-title-md text-on-surface truncate">
              {name}
            </h3>
            {address && (
              <p className="font-meta-xs text-meta-xs text-on-surface-variant">
                {address}
              </p>
            )}
          </div>
          {tags && <div className="flex gap-1 shrink-0">{tags}</div>}
        </div>
      )}
    </div>
  );
}
