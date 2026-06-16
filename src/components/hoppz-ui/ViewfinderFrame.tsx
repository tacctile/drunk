"use client";

import React from "react";

export type ViewfinderFrameProps = {
  src?: string;
  alt?: string;
  children?: React.ReactNode;
  className?: string;
};

export function ViewfinderFrame({
  src,
  alt = "Camera viewfinder",
  children,
  className = "",
}: ViewfinderFrameProps) {
  return (
    <div className={`relative h-screen w-screen overflow-hidden ${className}`}>
      <div className="absolute inset-0 z-0">
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-black" />
        )}
      </div>
      <div className="relative z-10 h-full w-full flex flex-col justify-between pointer-events-none">
        {children}
      </div>
    </div>
  );
}
