"use client";

import { useGroupData } from "@/hooks/useGroupData";
import { useTripData } from "@/hooks/useTripData";
import type { TripMemberStatus } from "@/lib/supabase";

export function TripStatusCard() {
  const { voterId } = useGroupData();
  const { members, setMemberStatus, effectiveStatus } = useTripData();
  const myStatus = members.find((m) => m.voter_id === voterId)?.trip_status ?? "on_trip";

  return (
    <section>
      <h2 className="label">Trip Status</h2>
      <div className="card mt-2">
        <p className="text-meta font-normal text-ink-muted mb-3">
          {effectiveStatus === "active"
            ? "The trip is happening now."
            : effectiveStatus === "upcoming"
              ? "The trip is coming up."
              : "No trip scheduled yet."}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(["on_trip", "remote", "out"] as TripMemberStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void setMemberStatus(voterId, s)}
              className={`btn text-[13px] px-2 ${
                myStatus === s
                  ? s === "on_trip"
                    ? "bg-green-dim border-green text-green"
                    : s === "remote"
                      ? "bg-accent-dim border-accent text-accent"
                      : "bg-raised border-border text-ink-dim"
                  : "btn-ghost"
              }`}
            >
              {s === "on_trip" ? "Going" : s === "remote" ? "Remote" : "Out"}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
