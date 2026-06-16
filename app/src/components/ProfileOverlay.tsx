"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scrollLock";
import { Icon } from "./Icon";
import { ProfileBody } from "./profile";

const SWIPE_CLOSE_PX = 70;

interface ProfileOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileOverlay({ open, onClose }: ProfileOverlayProps) {
  const router = useRouter();
  const dragY = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    window.history.pushState({ profile: true }, "");
    const handlePop = () => onCloseRef.current();
    window.addEventListener("popstate", handlePop);
    return () => {
      window.removeEventListener("popstate", handlePop);
    };
  }, [open]);

  const requestClose = useCallback(() => {
    if (window.history.state?.profile) {
      window.history.back();
    } else {
      onCloseRef.current();
    }
  }, []);

  const navTo = useCallback(
    (path: string) => {
      onCloseRef.current();
      if (window.history.state?.profile) router.replace(path);
      else router.push(path);
    },
    [router],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKey);
    lockBodyScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      unlockBodyScroll();
    };
  }, [open, requestClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Profile"
      className="anim-sheet fixed inset-0 z-50 flex flex-col bg-bg"
    >
      <header
        className="flex h-14 flex-none items-center justify-between border-b bg-bg px-2"
        style={{ touchAction: "none" }}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          dragY.current = e.clientY;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (dragY.current !== null && e.clientY - dragY.current > SWIPE_CLOSE_PX) {
            dragY.current = null;
            requestClose();
          }
        }}
        onPointerUp={() => {
          dragY.current = null;
        }}
        onPointerCancel={() => {
          dragY.current = null;
        }}
      >
        <button
          type="button"
          aria-label="Close profile"
          onClick={requestClose}
          className="flex h-11 w-11 items-center justify-center text-ink"
        >
          <Icon name="arrow_back" size={24} />
        </button>
        <h1 className="text-title text-ink">Profile</h1>
        <span className="h-11 w-11" aria-hidden="true" />
      </header>

      <ProfileBody onClose={requestClose} onNavigate={navTo} />
    </div>
  );
}
