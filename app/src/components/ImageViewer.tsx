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
  const [downloading, setDownloading] = useState(false);
  const [showTray, setShowTray] = useState(false);

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

  useEffect(() => {
    if (!showTray) return;
    const t = setTimeout(() => setShowTray(false), 2000);
    return () => clearTimeout(t);
  }, [showTray]);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const filename = url.split("/").pop()?.split("?")[0] ?? "image.jpg";
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      setShowTray(true);
    } catch {
      // silent fail — no error UI
    } finally {
      setDownloading(false);
    }
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
        className="fixed right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-white drop-shadow-lg"
      >
        {downloading ? (
          <Icon name="progress_activity" size={24} className="animate-spin" />
        ) : (
          <Icon name="download" size={24} />
        )}
      </button>

      {showTray && (
        <div
          className="fixed left-0 right-0 z-[60] flex justify-center px-4 anim-tray"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
        >
          <div className="rounded-btn border bg-surface px-5 py-3 text-base font-semibold text-ink shadow-overlay">
            Image saved
          </div>
        </div>
      )}
    </div>
  );
}
