"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface AvatarCropperProps {
  imageFile: File;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

const OUTPUT_SIZE = 400;
const MIN_SCALE = 1;
const MAX_SCALE = 4;
const CIRCLE_PADDING = 24;

export function AvatarCropper({ imageFile, onConfirm, onCancel }: AvatarCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const objUrlRef = useRef<string>("");

  const [imgLoaded, setImgLoaded] = useState(false);
  const scaleRef = useRef(MIN_SCALE);
  const offsetRef = useRef({ x: 0, y: 0 });
  const circleSizeRef = useRef(300);

  const lastTouchDist = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    objUrlRef.current = url;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const clampOffset = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const circleR = circleSizeRef.current / 2;
    const s = scaleRef.current;
    const iw = img.naturalWidth * s;
    const ih = img.naturalHeight * s;
    const maxX = Math.max(0, (iw - circleR * 2) / 2);
    const maxY = Math.max(0, (ih - circleR * 2) / 2);
    offsetRef.current.x = Math.max(-maxX, Math.min(maxX, offsetRef.current.x));
    offsetRef.current.y = Math.max(-maxY, Math.min(maxY, offsetRef.current.y));
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const container = containerRef.current;
    if (!canvas || !img || !container) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    canvas.width = cw;
    canvas.height = ch;

    const circleD = Math.min(cw, ch) - CIRCLE_PADDING * 2;
    circleSizeRef.current = circleD;
    const cx = cw / 2;
    const cy = ch / 2;
    const circleR = circleD / 2;

    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, cw, ch);

    const fitScale = Math.max(circleD / img.naturalWidth, circleD / img.naturalHeight);
    const s = fitScale * scaleRef.current;
    const iw = img.naturalWidth * s;
    const ih = img.naturalHeight * s;
    const ix = cx - iw / 2 + offsetRef.current.x;
    const iy = cy - ih / 2 + offsetRef.current.y;

    ctx.drawImage(img, ix, iy, iw, ih);

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.beginPath();
    ctx.rect(0, 0, cw, ch);
    ctx.arc(cx, cy, circleR, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, circleR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, []);

  useEffect(() => {
    if (!imgLoaded) return;
    scaleRef.current = MIN_SCALE;
    offsetRef.current = { x: 0, y: 0 };
    draw();
  }, [imgLoaded, draw]);

  useEffect(() => {
    if (!imgLoaded) return;
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [imgLoaded, draw]);

  const requestDraw = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  }, [draw]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "touch") return;
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        ox: offsetRef.current.x,
        oy: offsetRef.current.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragStart.current || e.pointerType === "touch") return;
      offsetRef.current.x = dragStart.current.ox + (e.clientX - dragStart.current.x);
      offsetRef.current.y = dragStart.current.oy + (e.clientY - dragStart.current.y);
      clampOffset();
      requestDraw();
    },
    [clampOffset, requestDraw],
  );

  const handlePointerUp = useCallback(() => {
    dragStart.current = null;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      dragStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        ox: offsetRef.current.x,
        oy: offsetRef.current.y,
      };
    } else if (e.touches.length === 2) {
      dragStart.current = null;
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
      lastTouchCenter.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && dragStart.current) {
        offsetRef.current.x = dragStart.current.ox + (e.touches[0].clientX - dragStart.current.x);
        offsetRef.current.y = dragStart.current.oy + (e.touches[0].clientY - dragStart.current.y);
        clampOffset();
        requestDraw();
      } else if (e.touches.length === 2 && lastTouchDist.current !== null) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ratio = dist / lastTouchDist.current;
        scaleRef.current = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scaleRef.current * ratio));
        lastTouchDist.current = dist;
        clampOffset();
        requestDraw();
      }
    },
    [clampOffset, requestDraw],
  );

  const handleTouchEnd = useCallback(() => {
    dragStart.current = null;
    lastTouchDist.current = null;
    lastTouchCenter.current = null;
  }, []);

  const handleConfirm = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const circleD = circleSizeRef.current;
    const container = containerRef.current;
    if (!container) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const cx = cw / 2;
    const cy = ch / 2;
    const circleR = circleD / 2;

    const fitScale = Math.max(circleD / img.naturalWidth, circleD / img.naturalHeight);
    const s = fitScale * scaleRef.current;
    const iw = img.naturalWidth * s;
    const ih = img.naturalHeight * s;
    const ix = cx - iw / 2 + offsetRef.current.x;
    const iy = cy - ih / 2 + offsetRef.current.y;

    const offscreen = document.createElement("canvas");
    offscreen.width = OUTPUT_SIZE;
    offscreen.height = OUTPUT_SIZE;
    const octx = offscreen.getContext("2d")!;

    const scaleOut = OUTPUT_SIZE / circleD;
    const srcX = (ix - (cx - circleR)) * scaleOut;
    const srcY = (iy - (cy - circleR)) * scaleOut;
    const srcW = iw * scaleOut;
    const srcH = ih * scaleOut;

    octx.drawImage(img, srcX, srcY, srcW, srcH);

    offscreen.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      "image/jpeg",
      0.88,
    );
  }, [onConfirm]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <header className="flex h-14 flex-none items-center justify-between bg-black px-4">
        <button type="button" onClick={onCancel} className="text-base text-white">
          Cancel
        </button>
        <h2 className="text-title text-white">Crop Photo</h2>
        <button
          type="button"
          onClick={handleConfirm}
          className="text-base font-semibold text-accent"
        >
          Use Photo
        </button>
      </header>
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden"
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>
    </div>
  );
}
