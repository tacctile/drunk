"use client";

import { useEffect, useState } from "react";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scrollLock";
import { GlassIconButton } from "@hoppz-ui";

interface ImageViewerProps {
  url: string;
  onClose: () => void;
}

export function ImageViewer({ url, onClose }: ImageViewerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    lockBodyScroll();
    requestAnimationFrame(() => setVisible(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      unlockBodyScroll();
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-[160ms]"
      style={{ opacity: visible ? 1 : 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="max-h-full max-w-full object-contain"
      />

      <GlassIconButton
        icon="close"
        ariaLabel="Close"
        onClick={onClose}
        className="fixed left-4 top-4"
      />

      <GlassIconButton
        icon="download"
        ariaLabel="Download"
        onClick={handleDownload}
        className="fixed bottom-4 right-4"
      />
    </div>
  );
}
