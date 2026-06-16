"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { ShutterButton, GlassIconButton, ViewfinderFrame } from '@hoppz-ui';
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
    capturePhoto();
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

  const dropShadow = { filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.8))" };
  const textShadow = "[text-shadow:0_1px_3px_rgba(0,0,0,0.8)]";

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
    <ViewfinderFrame className="fixed inset-0 z-50">
      {/* Video always mounted — stream never interrupted */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
        style={facingMode === "user" ? { transform: "scaleX(-1)" } : undefined}
      />
      {/* Captured image overlays video — video keeps running beneath */}
      {capturedImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={capturedImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={mirrorCapture ? { transform: "scaleX(-1)" } : undefined}
        />
      )}

      {/* Back button */}
      <GlassIconButton icon="arrow_back" ariaLabel="Go back" onClick={() => router.back()} className="absolute left-4 top-[env(safe-area-inset-top,16px)]" />

      {/* Bottom scrim */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: 160,
          background:
            "linear-gradient(to bottom, transparent, rgba(0,0,0,0.6))",
        }}
      />

      {/* Controls container */}
      <div
        className="absolute left-0 right-0"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)",
        }}
      >
        {capturedImage ? (
          <>
            {/* Post-capture: Retake (left) + Send (right) */}
            <GlassIconButton icon="replay" ariaLabel="Retake" onClick={handleRetake} className="absolute left-8 bottom-0" />

            <GlassIconButton icon="send" ariaLabel="Send" onClick={() => void handleSend()} className={`absolute right-8 bottom-0 ${sending ? "animate-pulse" : ""}`} />

            {sendError && (
              <p
                className={`absolute left-0 right-0 text-center text-base font-semibold text-white ${textShadow}`}
                style={{ bottom: -32 }}
              >
                {sendError}
              </p>
            )}
          </>
        ) : (
          <>
            {/* Pre-capture: Shutter (center) + Flip (right) */}
            <ShutterButton onClick={handleCapture} className="absolute left-1/2 -translate-x-1/2 bottom-0" />

            {hasMultipleCameras && (
              <GlassIconButton icon="cameraswitch" ariaLabel="Flip camera" onClick={flipCamera} className="absolute right-8 bottom-3" />
            )}
          </>
        )}
      </div>
    </ViewfinderFrame>
  );
}
