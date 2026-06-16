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
  const capturedFacingRef = useRef(facingMode);

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

  const handleCapture = useCallback(() => {
    capturedFacingRef.current = facingMode;
    setShowFlash(true);
    capturePhoto();
    setTimeout(() => setShowFlash(false), 300);
  }, [capturePhoto, facingMode]);

  const handleSend = useCallback(async () => {
    if (!capturedImage) return;
    setSending(true);
    setSendError(null);
    const file = dataUrlToFile(capturedImage, `camera-${Date.now()}.jpg`);
    const result = await uploadChatImage(file);
    if (!result.ok) {
      setSending(false);
      setSendError("Couldn't send. Try again.");
      return;
    }
    saveToDevice(capturedImage, `hoppz-${Date.now()}.jpg`);
    stopCamera();
    router.push(`/social?pendingImage=${encodeURIComponent(result.url)}`);
  }, [capturedImage, stopCamera, router]);

  const handleRetake = useCallback(() => {
    retake();
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

      {/* Pre-capture UI overlay */}
      {!capturedImage && (
        <div className="relative z-10 flex h-full w-full flex-col justify-between pointer-events-none">
          {/* Top controls */}
          <header
            className="w-full px-4 pt-2 flex items-center justify-between pointer-events-auto"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
          >
            <GlassIconButton
              icon="arrow_back"
              onClick={() => router.back()}
              ariaLabel="Go back"
            />
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-4 py-1 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-red animate-pulse" />
              <span className="text-[12px] font-semibold uppercase tracking-widest text-white">
                Live
              </span>
            </div>
            <div className="h-11 w-11" />
          </header>

          {/* Bottom controls */}
          <footer
            className="w-full px-4 pointer-events-auto"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)" }}
          >
            <div className="flex w-full items-center justify-between">
              <GlassIconButton
                icon="photo_library"
                iconSize={28}
                label="Gallery"
                onClick={() => router.push("/social/gallery")}
                ariaLabel="Gallery"
              />

              {/* Shutter button */}
              <button
                type="button"
                onClick={handleCapture}
                aria-label="Take photo"
                className="group relative flex h-[84px] w-[84px] items-center justify-center"
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
      )}

      {/* Post-capture review overlay */}
      {capturedImage && (
        <div className="absolute inset-0 z-40">
          <div className="relative h-full w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capturedImage}
              alt=""
              className="h-full w-full object-cover"
              style={mirrorCapture ? { transform: "scaleX(-1)" } : undefined}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

            {/* Review top controls */}
            <div
              className="absolute top-0 w-full px-4 flex items-center gap-2"
              style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
            >
              <GlassIconButton
                icon="arrow_back"
                onClick={() => router.back()}
                ariaLabel="Go back"
              />
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center gap-1 rounded-full border border-white/10 bg-black/60 px-4 py-2 shadow-2xl backdrop-blur-xl transition-transform active:scale-95"
              >
                <Icon name="close" size={24} className="text-white" />
                <span className="text-title font-bold text-white">Retake</span>
              </button>
            </div>

            {/* Review bottom controls */}
            <div
              className="absolute bottom-0 w-full px-4 flex flex-col items-center gap-2"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)" }}
            >
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sending}
                className="flex h-11 w-full max-w-sm items-center justify-center gap-2 rounded-full border border-white/20 bg-accent text-bg shadow-[0_4px_24px_rgba(255,140,66,0.5)] transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <span className="text-title font-bold">
                  {sending ? "Sending…" : "Post to Hopp"}
                </span>
              </button>
              {sendError && (
                <p className="text-base font-semibold text-white drop-shadow-md">
                  {sendError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Capture flash overlay */}
      {showFlash && (
        <div className="fixed inset-0 z-50 bg-white pointer-events-none anim-flash" />
      )}
    </main>
  );
}
