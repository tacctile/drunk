"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type FacingMode = "environment" | "user";

interface CameraState {
  stream: MediaStream | null;
  facingMode: FacingMode;
  capturedImage: string | null;
  permissionDenied: boolean;
  error: string | null;
}

export function useCamera() {
  const [state, setState] = useState<CameraState>({
    stream: null,
    facingMode: "environment",
    capturedImage: null,
    permissionDenied: false,
    error: null,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const facingRef = useRef<FacingMode>("environment");

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setState((s) => ({ ...s, stream: null }));
  }, []);

  const startCamera = useCallback(
    async (facing: FacingMode) => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        streamRef.current = stream;
        facingRef.current = facing;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setState((s) => ({
          ...s,
          stream,
          facingMode: facing,
          permissionDenied: false,
          error: null,
        }));
      } catch (err: unknown) {
        if (
          err instanceof DOMException &&
          err.name === "NotAllowedError"
        ) {
          setState((s) => ({
            ...s,
            permissionDenied: true,
            error: null,
            stream: null,
          }));
        } else {
          setState((s) => ({
            ...s,
            error: "Couldn't access camera. Try again.",
            permissionDenied: false,
            stream: null,
          }));
        }
      }
    },
    []
  );

  const flipCamera = useCallback(() => {
    const next: FacingMode =
      facingRef.current === "environment" ? "user" : "environment";
    void startCamera(next);
  }, [startCamera]);

  const capturePhoto = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    if (facingRef.current === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    // Stream stays active — video keeps running under the captured image overlay
    setState((s) => ({ ...s, capturedImage: dataUrl }));
    return dataUrl;
  }, []);

  const retake = useCallback(() => {
    // Video element was never unmounted — stream is still active
    setState((s) => ({ ...s, capturedImage: null }));
  }, []);

  useEffect(() => {
    void startCamera("environment");
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...state,
    videoRef,
    startCamera,
    stopCamera,
    flipCamera,
    capturePhoto,
    retake,
  };
}
