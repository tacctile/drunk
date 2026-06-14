"use client";

import { useState } from "react";
import type { LocationsValue } from "@/hooks/useLocations";
import { plural } from "@/lib/format";
import { Switch } from "@/components/Switch";

export function LocationCard({ locations }: { locations: LocationsValue }) {
  const { isSharing, amDisabled, myLocation, now, toggleSharing } = locations;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const hoursLeft = myLocation
    ? Math.max(1, Math.ceil((new Date(myLocation.expires_at).getTime() - now) / 3_600_000))
    : null;

  const handleToggle = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    const result = await toggleSharing();
    if (result === "denied") {
      setError("Location permission denied. Enable it in your browser settings.");
    } else if (result === "error") {
      setError("Couldn't get your location. Try again.");
    }
    setBusy(false);
  };

  return (
    <section>
      <h2 className="label">Location sharing</h2>
      <div className="card mt-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-base text-ink">Share my location</p>
          <span style={amDisabled ? { pointerEvents: "none", opacity: 0.4 } : undefined}>
            <Switch
              checked={isSharing}
              disabled={busy || amDisabled}
              onToggle={() => void handleToggle()}
              ariaLabel="Share my location"
            />
          </span>
        </div>
        {amDisabled && (
          <p className="text-meta font-normal text-ink-dim">
            Location sharing disabled by admin.
          </p>
        )}
        <p className={`text-meta font-normal ${isSharing ? "text-green" : "text-ink-dim"}`}>
          {isSharing && hoursLeft !== null
            ? `Sharing · expires in ${plural(hoursLeft, "hr")}`
            : "Not sharing"}
        </p>
        {error && (
          <p className="mt-1 text-meta font-medium text-red" role="alert">
            {error}
          </p>
        )}
        <p className="mt-1 text-meta font-normal text-ink-dim">This only affects Hoppz.</p>
      </div>
    </section>
  );
}
