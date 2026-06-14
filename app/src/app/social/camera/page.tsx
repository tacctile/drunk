"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
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
  const [showStandaloneOptions, setShowStandaloneOptions] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
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

  const handleSendToChat = useCallback(
    async (imageDataUrl: string) => {
      setSending(true);
      setSendError(null);
      const file = dataUrlToFile(
        imageDataUrl,
        `camera-${Date.now()}.jpg`
      );
      const result = await uploadChatImage(file);
      if (!result.ok) {
        setSending(false);
        setSendError("Couldn't send. Try again.");
        return;
      }
      stopCamera();
      router.push(`/social?pendingImage=${encodeURIComponent(result.url)}`);
    },
    [stopCamera, router]
  );

  const handleSend = useCallback(() => {
    if (!capturedImage) return;
    if (fromChat) {
      void handleSendToChat(capturedImage);
    } else {
      setShowStandaloneOptions(true);
    }
  }, [capturedImage, fromChat, handleSendToChat]);

  const handleSaveToDevice = useCallback(() => {
    if (!capturedImage) return;
    const a = document.createElement("a");
    a.href = capturedImage;
    a.download = `hoppz-${Date.now()}.jpg`;
    a.click();
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1500);
  }, [capturedImage]);

  const handleRetake = useCallback(() => {
    retake();
    setShowStandaloneOptions(false);
    setSendError(null);
    setSavedFeedback(false);
  }, [retake]);

  // Permission denied state
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

  // Error state
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

  // Post-capture view
  if (capturedImage) {
    const mirrorCapture = capturedFacingRef.current === "user";
    return (
      <div className="fixed inset-0 z-50 bg-black">
        {/* Captured image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={capturedImage}
          alt=""
          className="h-full w-full object-cover"
          style={mirrorCapture ? { transform: "scaleX(-1)" } : undefined}
        />

        {/* Bottom scrim + controls */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: 140,
            background:
              "linear-gradient(to bottom, transparent, rgba(0,0,0,0.6))",
          }}
        />
        <div
          className="absolute left-0 right-0 flex flex-col items-center gap-4"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)",
          }}
        >
          {sendError && (
            <p
              className="text-base font-semibold text-white"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}
            >
              {sendError}
            </p>
          )}

          {savedFeedback && (
            <p
              className="text-base font-semibold text-white"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}
            >
              Saved!
            </p>
          )}

          {!showStandaloneOptions ? (
            <div className="flex items-center justify-center gap-12">
              <button
                type="button"
                onClick={handleRetake}
                className="flex flex-col items-center gap-1"
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                >
                  <Icon name="refresh" size={24} className="text-white" />
                </span>
                <span className="text-meta font-semibold text-white">
                  Retake
                </span>
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="flex flex-col items-center gap-1"
                style={sending ? { opacity: 0.5 } : undefined}
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                >
                  <Icon name="send" size={24} className="text-white" />
                </span>
                <span className="text-meta font-semibold text-white">
                  Send
                </span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (capturedImage) void handleSendToChat(capturedImage);
                }}
                disabled={sending}
                className="btn-accent min-w-[180px]"
                style={sending ? { opacity: 0.5 } : undefined}
              >
                Send to Chat
              </button>
              <button
                type="button"
                onClick={handleSaveToDevice}
                className="btn-ghost min-w-[180px] text-white"
              >
                Save to Device
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Pre-capture viewfinder
  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Video viewfinder */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
        style={
          facingMode === "user" ? { transform: "scaleX(-1)" } : undefined
        }
      />

      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="absolute left-4 flex h-11 w-11 items-center justify-center"
        style={{
          top: "env(safe-area-inset-top, 16px)",
          filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))",
        }}
      >
        <Icon name="arrow_back" size={28} className="text-white" />
      </button>

      {/* Bottom scrim + controls */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: 140,
          background:
            "linear-gradient(to bottom, transparent, rgba(0,0,0,0.6))",
        }}
      />
      <div
        className="absolute left-0 right-0 flex items-center justify-center gap-8"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)",
        }}
      >
        {/* Shutter button */}
        <button
          type="button"
          onClick={handleCapture}
          className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-[3px] border-white active:bg-white/20"
        >
          <span className="block h-14 w-14 rounded-full active:bg-white" />
        </button>

        {/* Flip button */}
        {hasMultipleCameras && (
          <button
            type="button"
            onClick={flipCamera}
            className="flex h-11 w-11 items-center justify-center"
            style={{
              filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))",
            }}
          >
            <Icon
              name="cameraswitch"
              size={28}
              className="text-white"
            />
          </button>
        )}
      </div>
    </div>
  );
}
