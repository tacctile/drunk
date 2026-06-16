"use client";

import React from "react";

export type PhotoGridItemProps = {
  src?: string;
  alt?: string;
  onClick?: () => void;
  className?: string;
};

export function PhotoGridItem({
  src,
  alt = "Photo",
  onClick,
  className = "",
}: PhotoGridItemProps) {
  return (
    <button
      type="button"
      className={`aspect-square overflow-hidden bg-surface-container active:scale-[0.98] transition-transform duration-100 ${className}`}
      onClick={onClick}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : null}
    </button>
  );
}
