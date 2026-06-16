"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { GlassIconButton } from "@/components/ui/GlassIconButton";
import { useCamera } from "@/hooks/useCamera";
import { uploadChatImage } from "@/lib/storage";

function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  const u8arr = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
  return new File([u8arr], filename, { type: mime });
}

function saveToDevice(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function touchDist(a: Touch, b: Touch): number {
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function CameraPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-black" />}>
      <CameraInner />
    </Suspense>
  );
}

function CameraInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromChat = searchParams.get("from") === "chat";

  const {
    stream,
    facingMode,
    capturedImage,
    permissionDenied,
    error,
    videoRef,
    startCamera,
    stopCamera,
    flipCamera,
    capturePhoto,
    retake,
  } = useCamera();

  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [galleryImage, setGalleryImage] = useState<string | null>(null);
  const [showTray, setShowTray] = useState(false);
  const [trayMessage, setTrayMessage] = useState("");
  const [zoomDisplay, setZoomDisplay] = useState<number | null>(null);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);

  const capturedFacingRef = useRef(facingMode);
  const galleryFileRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchOverlayRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(1);
  const zoomRangeRef = useRef({ min: 1, max: 1 });
  const pinchDistRef = useRef(0);
  const pinchZoomRef = useRef(1);
  const wasPinchingRef = useRef(false);
  const zoomTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const activeImage = capturedImage || galleryImage;

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      setHasMultipleCameras(videoInputs.length > 1);
    });
  }, []);

  useEffect(() => {
    if (!capturedImage) {
      capturedFacingRef.current = facingMode;
    }
  }, [capturedImage, facingMode]);

  // Set continuous autofocus and detect zoom range when stream changes
  useEffect(() => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    try {
      const caps = track.getCapabilities() as any;

      if (caps.focusMode?.includes("continuous")) {
        track.applyConstraints({ focusMode: "continuous" } as any);
      }

      if (caps.zoom) {
        zoomRangeRef.current = { min: caps.zoom.min, max: caps.zoom.max };
      } else {
        zoomRangeRef.current = { min: 1, max: 1 };
      }
    } catch {
      zoomRangeRef.current = { min: 1, max: 1 };
    }

    zoomRef.current = 1;
    setZoomDisplay(null);
  }, [stream]);

  // Pinch-to-zoom via native listeners (need non-passive touchmove)
  useEffect(() => {
    const el = touchOverlayRef.current;
    if (!el) return;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        wasPinchingRef.current = true;
        pinchDistRef.current = touchDist(e.touches[0], e.touches[1]);
        pinchZoomRef.current = zoomRef.current;
      }
    };

    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || pinchDistRef.current === 0) return;
      e.preventDefault();
      const dist = touchDist(e.touches[0], e.touches[1]);
      const scale = dist / pinchDistRef.current;
      const next = pinchZoomRef.current * scale;
      const { min, max } = zoomRangeRef.current;
      if (min === max) return;
      const clamped = Math.max(min, Math.min(max, next));
      if (Math.abs(clamped - zoomRef.current) < 0.02) return;

      const s = videoRef.current?.srcObject as MediaStream | null;
      if (!s) return;
      const track = s.getVideoTracks()[0];
      if (!track) return;
      try {
        track.applyConstraints({ advanced: [{ zoom: clamped } as any] });
        zoomRef.current = clamped;
        setZoomDisplay(clamped);
        clearTimeout(zoomTimerRef.current);
        zoomTimerRef.current = setTimeout(() => setZoomDisplay(null), 1000);
      } catch {}
    };

    const onEnd = () => {
      pinchDistRef.current = 0;
      setTimeout(() => {
        wasPinchingRef.current = false;
      }, 200);
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, [videoRef]);

  // Tap to focus
  const handleViewfinderTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (wasPinchingRef.current) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;

      setFocusPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setTimeout(() => setFocusPoint(null), 800);

      const s = videoRef.current?.srcObject as MediaStream | null;
      if (!s) return;
      const track = s.getVideoTracks()[0];
      if (!track) return;
      try {
        const caps = track.getCapabilities() as any;
        if (caps.focusMode) {
          track.applyConstraints({
            focusMode: "single-shot",
            pointsOfInterest: [{ x: nx, y: ny }],
          } as any);
          setTimeout(() => {
            try {
              if (caps.focusMode?.includes("continuous")) {
                track.applyConstraints({ focusMode: "continuous" } as any);
              }
            } catch {}
          }, 1500);
        }
      } catch {}
    },
    [videoRef]
  );

  const handleCapture = useCallback(() => {
    capturedFacingRef.current = facingMode;
    setShowFlash(true);
    capturePhoto();
    setTimeout(() => setShowFlash(false), 300);
  }, [capturePhoto, facingMode]);

  const handleGalleryPick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      galleryFileRef.current = file;
      const reader = new FileReader();
      reader.onload = () => setGalleryImage(reader.result as string);
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    []
  );

  const handleSend = useCallback(async () => {
    if (!activeImage) return;
    setSending(true);
    setSendError(null);

    let file: File;
    if (galleryFileRef.current && galleryImage) {
      file = galleryFileRef.current;
    } else if (capturedImage) {
      file = dataUrlToFile(capturedImage, `camera-${Date.now()}.jpg`);
    } else {
      return;
    }

    const result = await uploadChatImage(file);
    if (!result.ok) {
      setSending(false);
      setSendError("Couldn't send. Try again.");
      return;
    }

    if (capturedImage) {
      saveToDevice(capturedImage, `hoppz-${Date.now()}.jpg`);
      setTrayMessage("Image sent and saved to device");
    } else {
      setTrayMessage("Image sent to chat");
    }
    setShowTray(true);

    const url = result.url;
    setTimeout(() => {
      stopCamera();
      router.push(`/social?pendingImage=${encodeURIComponent(url)}`);
    }, 2000);
  }, [activeImage, galleryImage, capturedImage, stopCamera, router]);

  const handleRetake = useCallback(() => {
    retake();
    setGalleryImage(null);
    galleryFileRef.current = null;
    setSendError(null);
  }, [retake]);

  if (permissionDenied) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-bg px-8 text-center">
        <Icon name="no_photography" size={48} className="text-ink-dim" />
        <h1 className="text-title font-bold text-ink">Camera access denied</h1>
        <p className="text-meta font-normal text-ink-muted">
          Enable camera access in your browser settings to use this feature.
        </p>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-ghost mt-4"
        >
          Go back
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-bg px-8 text-center">
        <Icon name="error_outline" size={48} className="text-ink-dim" />
        <h1 className="text-title font-bold text-ink">{error}</h1>
        <button
          type="button"
          onClick={() => {
            void startCamera(facingMode);
          }}
          className="btn-ghost mt-2"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-ghost"
        >
          Go back
        </button>
      </div>
    );
  }

  const mirrorCapture = capturedFacingRef.current === "user";

  return (
    <main className="fixed inset-0 z-50 overflow-hidden bg-black">
      {/* Viewfinder feed — always running */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
          style={facingMode === "user" ? { transform: "scaleX(-1)" } : undefined}
        />
      </div>

      {/* Pre-capture UI */}
      {!activeImage && (
        <>
          {/* Touch overlay — pinch to zoom, tap to focus */}
          <div
            ref={touchOverlayRef}
            className="absolute inset-0 z-[5]"
            style={{ touchAction: "none" }}
            onClick={handleViewfinderTap}
          />

          {/* Focus ring indicator */}
          {focusPoint && (
            <div
              className="absolute z-[15] pointer-events-none"
              style={{
                left: focusPoint.x - 24,
                top: focusPoint.y - 24,
                width: 48,
                height: 48,
              }}
            >
              <div className="h-full w-full rounded border-2 border-white/80 anim-focus" />
            </div>
          )}

          {/* Zoom level indicator */}
          {zoomDisplay !== null && zoomDisplay > 1.05 && (
            <div className="absolute left-1/2 top-1/2 z-[15] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="rounded-full bg-black/50 px-4 py-2 text-title font-bold text-white backdrop-blur-sm">
                {zoomDisplay.toFixed(1)}×
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="absolute inset-0 z-10 flex h-full w-full flex-col justify-between pointer-events-none">
            {/* Top */}
            <header
              className="w-full px-4 flex items-center justify-between pointer-events-auto"
              style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
            >
              <GlassIconButton
                icon="arrow_back"
                onClick={() => router.back()}
                ariaLabel="Go back"
              />
              <div className="h-11 w-11" />
            </header>

            {/* Bottom */}
            <footer
              className="w-full px-4 pointer-events-auto"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)" }}
            >
              <div className="flex w-full items-center justify-between">
                <GlassIconButton
                  icon="photo_library"
                  iconSize={28}
                  label="Gallery"
                  onClick={() => fileInputRef.current?.click()}
                  ariaLabel="Pick from gallery"
                />

                {/* Shutter */}
                <button
                  type="button"
                  onClick={handleCapture}
                  aria-label="Take photo"
                  className="group relative flex h-[84px] w-[84px] items-center justify-center pointer-events-auto"
                >
                  <div className="absolute inset-0 rounded-full border-[5px] border-white transition-transform group-active:scale-105" />
                  <div className="h-[66px] w-[66px] rounded-full bg-white shadow-inner" />
                </button>

                {hasMultipleCameras ? (
                  <GlassIconButton
                    icon="flip_camera_ios"
                    iconSize={28}
                    label="Flip"
                    onClick={flipCamera}
                    ariaLabel="Flip camera"
                  />
                ) : (
                  <div className="w-12" />
                )}
              </div>
            </footer>
          </div>
        </>
      )}

      {/* Post-capture review overlay */}
      {activeImage && (
        <div className="absolute inset-0 z-40">
          <div className="relative h-full w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage}
              alt=""
              className="h-full w-full object-cover"
              style={
                capturedImage && mirrorCapture
                  ? { transform: "scaleX(-1)" }
                  : undefined
              }
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

            {/* Back button */}
            <div
              className="absolute top-0 w-full px-4 flex items-center"
              style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
            >
              <GlassIconButton
                icon="arrow_back"
                onClick={() => router.back()}
                ariaLabel="Go back"
              />
            </div>

            {/* Action buttons — two matching themed buttons */}
            <div
              className="absolute bottom-0 w-full px-4 flex flex-col items-center gap-3"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)" }}
            >
              <div className="flex w-full max-w-sm gap-3">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="btn-ghost flex-1"
                >
                  Retake Picture
                </button>
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={sending}
                  className="btn-accent flex-1"
                >
                  {sending ? "Sending…" : "Send to Chat"}
                </button>
              </div>
              {sendError && (
                <p className="text-base font-semibold text-white drop-shadow-md">
                  {sendError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for device gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleGalleryPick}
      />

      {/* Capture flash */}
      {showFlash && (
        <div className="fixed inset-0 z-50 bg-white pointer-events-none anim-flash" />
      )}

      {/* Slide-down tray notification */}
      {showTray && (
        <div
          className="fixed left-0 right-0 z-[60] flex justify-center px-4 anim-tray"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
        >
          <div className="rounded-btn border bg-surface px-5 py-3 text-base font-semibold text-ink shadow-overlay">
            {trayMessage}
          </div>
        </div>
      )}
    </main>
  );
}
