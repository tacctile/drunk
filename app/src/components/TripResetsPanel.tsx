"use client";

import { useState } from "react";
import { Dialog } from "@/components/Dialog";
import { getSupabase } from "@/lib/supabase";

const ALL_ROWS = "1970-01-01";

function ConfirmResetDialog({
  title,
  body,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open onClose={onCancel} title={title}>
      <p className="text-base font-normal text-ink-muted">{body}</p>
      <div className="mt-4 flex gap-3">
        <button type="button" className="btn-ghost flex-1" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="btn flex-1 bg-red text-bg hover:brightness-110"
          onClick={onConfirm}
        >
          Reset
        </button>
      </div>
    </Dialog>
  );
}

export function TripResetsPanel() {
  const [confirmReset, setConfirmReset] = useState<"votes" | "availability" | null>(null);

  const resetVotes = async () => {
    setConfirmReset(null);
    const sb = getSupabase();
    if (!sb) return;
    try {
      await sb.from("v2_city_votes").delete().gte("updated_at", ALL_ROWS);
      await sb.from("v2_hotel_votes").delete().gte("updated_at", ALL_ROWS);
    } catch {
      // silent
    }
  };

  const resetAvailability = async () => {
    setConfirmReset(null);
    const sb = getSupabase();
    if (!sb) return;
    try {
      await sb.from("v2_availability").delete().gte("updated_at", ALL_ROWS);
    } catch {
      // silent
    }
  };

  return (
    <>
      <section className="flex flex-col gap-3">
        <h2 className="label">Trip resets</h2>
        <button
          type="button"
          onClick={() => setConfirmReset("votes")}
          className="btn w-full border bg-raised text-red"
        >
          Reset All Votes
        </button>
        <button
          type="button"
          onClick={() => setConfirmReset("availability")}
          className="btn w-full border bg-raised text-red"
        >
          Reset All Availability
        </button>
      </section>

      {confirmReset === "votes" && (
        <ConfirmResetDialog
          title="Reset all votes?"
          body="This clears every city and hotel vote. Cannot be undone."
          onCancel={() => setConfirmReset(null)}
          onConfirm={() => void resetVotes()}
        />
      )}
      {confirmReset === "availability" && (
        <ConfirmResetDialog
          title="Reset all availability?"
          body="This clears all availability dates for everyone. Cannot be undone."
          onCancel={() => setConfirmReset(null)}
          onConfirm={() => void resetAvailability()}
        />
      )}
    </>
  );
}
