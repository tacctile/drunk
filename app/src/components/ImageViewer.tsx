"use client";

import { useEffect, useState } from "react";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scrollLock";
import { Icon } from "./Icon";
import { Toast } from "./Toast";

interface ImageViewerProps {
  url: string;
  onClose: () => void;
}

export function ImageViewer({ url, onClose }: ImageViewerProps) {
  const [visible, setVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

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

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = url.split("/").pop()?.split("?")[0] ?? "image";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      setDownloadToast("Image saved to device");
    } catch {
      setDownloadToast("Download failed. Try again.");
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

      {downloadToast && (
        <Toast message={downloadToast} onDismiss={() => setDownloadToast(null)} />
      )}
    </div>
  );
}
