"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { setLastWing, type Wing } from "@/lib/auth";

/**
 * The wing picker — shown on every authenticated cold open. Uses the AppShell
 * header (wordmark + avatar); no bottom nav. Two big cards fill the area below
 * the header, one per wing.
 */
export default function HomePage() {
  const router = useRouter();

  const go = (wing: Wing) => {
    setLastWing(wing);
    router.push(wing === "plan" ? "/plan" : "/social");
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-2xl flex-col px-4 pb-6">
      <h1 className="pt-6 text-display text-ink">Where to?</h1>

      <div className="flex flex-1 flex-col justify-center gap-4 py-4">
        {/* Trip Planning */}
        <button
          type="button"
          onClick={() => go("plan")}
          className="flex min-h-[160px] flex-1 flex-col justify-center gap-2 rounded-card border bg-surface p-5 text-left transition hover:bg-raised"
        >
          <Icon name="map" size={40} className="text-accent" />
          <span className="text-title font-bold text-ink">Plan a Trip</span>
          <span className="text-meta font-normal text-ink-muted">
            Vote on cities, hotels, and dates
          </span>
        </button>

        {/* Hopp — placeholder */}
        <button
          type="button"
          onClick={() => go("social")}
          className="flex min-h-[160px] flex-1 flex-col justify-center gap-2 rounded-card border bg-surface p-5 text-left opacity-60 transition hover:bg-raised"
        >
          <Icon name="local_bar" size={40} className="text-ink-muted" />
          <span className="text-title font-bold text-ink">Hopp</span>
          <span className="text-meta font-normal text-ink-dim">Coming soon</span>
        </button>
      </div>
    </div>
  );
}
