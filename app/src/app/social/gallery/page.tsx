"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { BottomSheet } from "@/components/BottomSheet";
import { ImageViewer } from "@/components/ImageViewer";
import { Toast } from "@/components/Toast";
import { StickyDateHeader, PhotoGrid, PhotoGridItem, Fab, FloatingPill } from '@hoppz-ui';
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

  if (loading) {
    return (
      <div className="px-0">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h1 className="text-title font-bold text-ink">Photos</h1>
        </div>
        <div className="grid grid-cols-3 gap-0.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-square bg-surface-raised" />
          ))}
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex h-[calc(100dvh-3.5rem-64px-env(safe-area-inset-bottom))] flex-col items-center justify-center gap-3 text-center">
        <Icon name="photo" size={48} className="text-ink-dim" />
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
        <button
          type="button"
          onClick={() => uploadInputRef.current?.click()}
          disabled={uploading}
          className={`btn-ghost rounded-btn h-11 px-4 flex items-center gap-2 ${uploading ? "animate-pulse opacity-50" : ""}`}
        >
          <Icon name="add_photo_alternate" size={20} />
          Upload
        </button>
        {toastMsg && (
          <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-3.5rem-64px-env(safe-area-inset-bottom))] overflow-y-auto">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h1 className="text-title font-bold text-ink">Photos</h1>
        <button
          type="button"
          onClick={() => void handleRefresh()}
          aria-label="Refresh gallery"
          className="flex h-11 w-11 items-center justify-center text-ink-muted"
        >
          <Icon name="refresh" size={24} />
        </button>
      </div>

      {days.map((day) => (
        <div key={day.key} id={`gallery-day-${day.key}`}>
          <StickyDateHeader label={formatDayDivider(day.iso)} />
          <PhotoGrid columns={3} gap={2}>
            {day.items.map((img) => (
              <PhotoGridItem key={img.id} src={img.image_url} onClick={() => setViewerUrl(img.image_url)} />
            ))}
          </PhotoGrid>
        </div>
      ))}

      {loadingMore && (
        <div className="flex justify-center py-4">
          <Icon name="progress_activity" size={24} className="animate-spin text-ink-dim" />
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />

      {/* Upload button — bottom-left */}
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
      <Fab icon="add_photo_alternate" ariaLabel="Upload" onClick={() => uploadInputRef.current?.click()} className="!left-4 !right-auto !bottom-[calc(80px+env(safe-area-inset-bottom))]" />

      {/* Jump to date pill — bottom-right */}
      <FloatingPill icon="calendar_month" label="Jump to date" onClick={() => setJumpSheetOpen(true)} className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] right-4 z-20" />

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
              className="flex h-11 w-full items-center justify-between px-1"
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
