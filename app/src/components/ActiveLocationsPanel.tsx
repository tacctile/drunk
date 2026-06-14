"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { getSupabase, safeSelect, type LocationRow } from "@/lib/supabase";

const LOCATION_COLUMNS =
  "voter_id,display_name,lat,lng,pin_color,sharing_since,expires_at,updated_at,muted_ids,session_id";

function hoursAgo(iso: string, nowMs: number): string {
  const hrs = Math.floor((nowMs - new Date(iso).getTime()) / 3_600_000);
  if (hrs < 1) return "less than an hour ago";
  return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
}

function hoursLeft(iso: string, nowMs: number): string {
  const hrs = Math.max(0, Math.ceil((new Date(iso).getTime() - nowMs) / 3_600_000));
  return `${hrs} hour${hrs === 1 ? "" : "s"}`;
}

export function ActiveLocationsPanel() {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const nowMs = Date.now();

  const fetchLocations = useCallback(async () => {
    const data = await safeSelect<LocationRow>("v2_locations", LOCATION_COLUMNS);
    if (data) setLocations(data);
  }, []);

  useEffect(() => {
    void fetchLocations();
  }, [fetchLocations]);

  const activeLocations = useMemo(
    () => locations.filter((l) => new Date(l.expires_at).getTime() > nowMs),
    [locations, nowMs],
  );

  const forceExpire = async (voterId: string) => {
    const nowIso = new Date().toISOString();
    setLocations((prev) =>
      prev.map((l) => (l.voter_id === voterId ? { ...l, expires_at: nowIso } : l)),
    );
    try {
      await getSupabase()
        ?.from("v2_locations")
        .update({ expires_at: nowIso })
        .eq("voter_id", voterId);
    } catch {
      // refetch restores truth
    }
    void fetchLocations();
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="label">Active locations</h2>
        <button
          type="button"
          aria-label="Refresh locations"
          onClick={() => void fetchLocations()}
          className="flex h-11 w-11 flex-none items-center justify-center rounded-btn text-ink-dim transition hover:bg-raised hover:text-ink"
        >
          <Icon name="refresh" size={22} />
        </button>
      </div>
      {activeLocations.length === 0 && (
        <p className="text-meta font-normal text-ink-dim">No active locations.</p>
      )}
      {activeLocations.map((loc) => (
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
