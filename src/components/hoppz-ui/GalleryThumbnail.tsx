"use client";

import React from "react";

export type GalleryThumbnailProps = {
  src: string;
  alt?: string;
  onClick?: () => void;
  className?: string;
};

export function GalleryThumbnail({
  src,
  alt = "Gallery preview",
  onClick,
  className = "",
}: GalleryThumbnailProps) {
  return (
    <button
      type="button"
      className={`flex flex-col items-center group ${className}`}
      onClick={onClick}
    >
      <div className="w-[56px] h-[56px] rounded-lg border-2 border-white/20 overflow-hidden bg-surface-container-high shadow-xl active:scale-95 transition-transform">
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </div>
    </button>
  );
}
