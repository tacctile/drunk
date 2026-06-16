"use client";

import { useEffect, useState } from "react";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scrollLock";
import { Icon } from "./Icon";

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

      <button
        type="button"
        onClick={onClose}
        className="fixed left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-white drop-shadow-lg"
      >
        <Icon name="close" size={28} />
      </button>

      <button
        type="button"
        onClick={handleDownload}
        className="fixed bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full text-white drop-shadow-lg"
      >
        <Icon name="download" size={28} />
      </button>
    </div>
  );
}
