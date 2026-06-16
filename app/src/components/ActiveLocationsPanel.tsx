"use client";

import { getSupabase, type LocationRow } from "@/lib/supabase";

function hoursAgo(iso: string, nowMs: number): string {
  const hrs = Math.floor((nowMs - new Date(iso).getTime()) / 3_600_000);
  if (hrs < 1) return "less than an hour ago";
  return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
}

function hoursLeft(iso: string, nowMs: number): string {
  const hrs = Math.max(0, Math.ceil((new Date(iso).getTime() - nowMs) / 3_600_000));
  return `${hrs} hour${hrs === 1 ? "" : "s"}`;
}

interface ActiveLocationsPanelProps {
  locations: LocationRow[];
}

export function ActiveLocationsPanel({ locations }: ActiveLocationsPanelProps) {
  const nowMs = Date.now();

  const forceExpire = async (voterId: string) => {
    const nowIso = new Date().toISOString();
    try {
      await getSupabase()
        ?.from("v2_locations")
        .update({ expires_at: nowIso })
        .eq("voter_id", voterId);
    } catch {
      // realtime subscription restores truth
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="label">Active locations</h2>
      {locations.length === 0 && (
        <p className="text-meta font-normal text-ink-dim">No active locations.</p>
      )}
      {locations.map((loc) => (
        <div
          key={loc.voter_id}
          className="flex min-h-[56px] items-center justify-between gap-3 rounded-card border bg-surface px-4 py-2"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-title text-ink">{loc.display_name}</p>
            <p className="text-meta font-normal text-ink-dim">
              Sharing since {hoursAgo(loc.sharing_since, nowMs)} · expires in{" "}
              {hoursLeft(loc.expires_at, nowMs)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void forceExpire(loc.voter_id)}
            className="h-11 flex-none rounded-btn border bg-raised px-3 text-meta font-semibold text-red transition hover:brightness-110"
          >
            Force expire
          </button>
        </div>
      ))}
    </section>
  );
}
