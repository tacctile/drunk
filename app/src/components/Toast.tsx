"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, onDismiss, duration = 3000 }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 160);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div
      className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] left-4 right-4 z-40 flex justify-center transition-opacity duration-[160ms]"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div className="rounded-xl border border-border bg-surface-raised px-4 py-3 text-base text-ink shadow-overlay">
        {message}
      </div>
    </div>
  );
}
