import { Icon } from "@/components/Icon";

/** Hopp → Camera — placeholder. */
export default function CameraPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-2xl flex-col items-center justify-center gap-3 px-6 text-center">
      <Icon name="photo_camera" size={48} className="text-ink-dim" />
      <h1 className="text-title font-bold text-ink">Camera</h1>
      <p className="max-w-xs text-meta font-normal text-ink-muted">Camera coming soon</p>
    </div>
  );
}
