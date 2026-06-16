"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { BottomSheet } from "@/components/BottomSheet";
import { ImageViewer } from "@/components/ImageViewer";
import { Toast } from "@/components/Toast";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { getSupabase } from "@/lib/supabase";
import { uploadChatImage } from "@/lib/storage";
import { useGroupData } from "@/hooks/useGroupData";
import { formatDayDivider, GALLERY_PAGE_SIZE } from "@/lib/chat";

interface GalleryImage {
  id: string;
  image_url: string;
  created_at: string;
}

function dateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function groupByDay(images: GalleryImage[]): { key: string; iso: string; items: GalleryImage[] }[] {
  const map = new Map<string, { iso: string; items: GalleryImage[] }>();
  for (const img of images) {
    const k = dateKey(img.created_at);
    const existing = map.get(k);
    if (existing) {
      existing.items.push(img);
    } else {
      map.set(k, { iso: img.created_at, items: [img] });
    }
  }
  return Array.from(map.entries()).map(([key, val]) => ({
    key,
    iso: val.iso,
    items: val.items,
  }));
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [jumpSheetOpen, setJumpSheetOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const { voterId } = useGroupData();

  const fetchImages = useCallback(async (before?: string) => {
    const sb = getSupabase();
    if (!sb) return [];
    try {
      let query = sb
        .from("v2_messages")
        .select("id,image_url,created_at")
        .not("image_url", "is", null)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(GALLERY_PAGE_SIZE);
      if (before) {
        query = query.lt("created_at", before);
      }
      const { data } = await query;
      return (data as GalleryImage[] | null) ?? [];
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await fetchImages();
      if (cancelled) return;
      setImages(data);
      setHasMore(data.length === GALLERY_PAGE_SIZE);
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [fetchImages]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const oldest = images[images.length - 1];
    if (!oldest) {
      setLoadingMore(false);
      return;
    }
    const data = await fetchImages(oldest.created_at);
    setImages((prev) => [...prev, ...data]);
    setHasMore(data.length === GALLERY_PAGE_SIZE);
    setLoadingMore(false);
  }, [loadingMore, hasMore, images, fetchImages]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    const data = await fetchImages();
    setImages(data);
    setHasMore(data.length === GALLERY_PAGE_SIZE);
    setLoading(false);
  }, [fetchImages]);

  const handleUpload = useCallback(async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setToastMsg("Image must be under 10MB");
      return;
    }
    setUploading(true);
    const result = await uploadChatImage(file);
    if (!result.ok) {
      setUploading(false);
      setToastMsg("Couldn't upload image. Try again.");
      return;
    }
    const sb = getSupabase();
    if (sb && voterId) {
      try {
        await sb.from("v2_messages").insert({
          voter_id: voterId,
          content: null,
          image_url: result.url,
          reply_to_id: null,
          is_deleted: false,
          created_at: new Date().toISOString(),
        });
      } catch {
        // silent
      }
    }
    setUploading(false);
    void handleRefresh();
  }, [voterId, handleRefresh]);

  const days = groupByDay(images);

  // Loading skeleton
  if (loading) {
    return (
      <div>
        <div className="sticky top-0 z-10 flex items-center justify-between bg-bg px-4 py-2">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-ink-muted">
            Photos
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-[2px]">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-square bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (images.length === 0) {
    return (
      <div className="flex h-[calc(100dvh-3.5rem-64px-env(safe-area-inset-bottom))] flex-col items-center justify-center gap-3 text-center px-4">
        <Icon name="photo_library" size={48} className="text-ink-dim" />
        <h2 className="text-title font-bold text-ink">No photos yet</h2>
        <p className="text-meta font-normal text-ink-muted">
          Photos shared in chat will appear here
        </p>
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*,.heic,.heif,.webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUpload(file);
            e.target.value = "";
          }}
        />
        <FloatingActionButton
          icon="add_photo_alternate"
          onClick={() => uploadInputRef.current?.click()}
          ariaLabel="Upload photo"
          disabled={uploading}
          className={`mt-4 ${uploading ? "animate-pulse" : ""}`}
        />
        {toastMsg && (
          <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-3.5rem-64px-env(safe-area-inset-bottom))] overflow-y-auto pb-32">
      {days.map((day) => (
        <section key={day.key} id={`gallery-day-${day.key}`}>
          <div className="sticky top-0 z-10 flex items-center justify-between bg-bg px-4 py-2">
            <h2 className="text-[12px] font-bold uppercase tracking-widest text-ink-muted">
              {formatDayDivider(day.iso)}
            </h2>
            {day === days[0] && (
              <button
                type="button"
                onClick={() => void handleRefresh()}
                aria-label="Refresh gallery"
                className="flex h-11 w-11 items-center justify-center text-ink-muted"
              >
                <Icon name="refresh" size={24} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-[2px]">
            {day.items.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setViewerUrl(img.image_url)}
                className="aspect-square overflow-hidden bg-surface transition-transform duration-100 active:scale-[0.98]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.image_url}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-opacity duration-300"
                />
              </button>
            ))}
          </div>
        </section>
      ))}

      {loadingMore && (
        <div className="flex justify-center py-4">
          <Icon name="progress_activity" size={24} className="animate-spin text-ink-dim" />
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />

      {/* Hidden file input for upload */}
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*,.heic,.heif,.webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleUpload(file);
          e.target.value = "";
        }}
      />

      {/* Upload FAB — bottom right */}
      <FloatingActionButton
        icon="add_photo_alternate"
        onClick={() => uploadInputRef.current?.click()}
        ariaLabel="Upload photo"
        disabled={uploading}
        className={`fixed right-6 bottom-24 z-40 ${uploading ? "animate-pulse" : ""}`}
      />

      {/* Jump to date — bottom left */}
      <button
        type="button"
        onClick={() => setJumpSheetOpen(true)}
        className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] left-4 z-20 flex h-11 items-center gap-1.5 rounded-full border bg-surface px-3 text-[12px] font-semibold uppercase tracking-widest text-ink-muted shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
      >
        <Icon name="calendar_month" size={18} />
        Jump
      </button>

      <BottomSheet
        open={jumpSheetOpen}
        onClose={() => setJumpSheetOpen(false)}
        label="Jump to date"
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-title font-bold text-ink">Jump to date</h2>
          <button
            type="button"
            onClick={() => setJumpSheetOpen(false)}
            aria-label="Close"
            className="flex h-11 w-11 flex-none items-center justify-center text-ink-muted"
          >
            <Icon name="close" size={22} />
          </button>
        </div>
        <div className="space-y-0">
          {days.map((day) => (
            <button
              key={day.key}
              type="button"
              onClick={() => {
                setJumpSheetOpen(false);
                setTimeout(() => {
                  document
                    .getElementById(`gallery-day-${day.key}`)
                    ?.scrollIntoView({ behavior: "smooth" });
                }, 200);
              }}
              className="flex h-11 w-full items-center justify-between px-1 active:scale-[0.98] transition-transform"
            >
              <span className="text-base text-ink">
                {formatDayDivider(day.iso)}
              </span>
              <span className="text-meta text-ink-muted">
                {day.items.length} {day.items.length === 1 ? "photo" : "photos"}
              </span>
            </button>
          ))}
        </div>
      </BottomSheet>

      {viewerUrl && (
        <ImageViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />
      )}

      {toastMsg && (
        <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />
      )}
    </div>
  );
}
