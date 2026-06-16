"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { RoleBadge } from "@/components/RoleBadge";
import { VoterProfileSheet } from "@/components/VoterProfileSheet";
import { useHopperz, type HopperzVoter } from "@/hooks/useHopperz";
import { setLastWing } from "@/lib/auth";
import { lsGet, lsSet } from "@/lib/storage";

type ViewMode = "list" | "grid";
const VIEW_KEY = "bh2-hopperz-view";

function readView(): ViewMode {
  const v = lsGet(VIEW_KEY);
  return v === "grid" ? "grid" : "list";
}

export default function HopperzPage() {
  const { voters, loading } = useHopperz();
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("list");
  const [selectedVoter, setSelectedVoter] = useState<HopperzVoter | null>(null);

  useEffect(() => {
    setView(readView());
  }, []);

  const toggleView = () => {
    const next: ViewMode = view === "list" ? "grid" : "list";
    setView(next);
    lsSet(VIEW_KEY, next);
  };

  const handleLocate = useCallback((voterId: string) => {
    setLastWing("social");
    router.push(`/social/locate?focus=${voterId}`);
  }, [router]);

  if (loading) return null;

  return (
    <>
      <div className="mx-auto max-w-2xl">
        <div className="flex items-start justify-between px-4 pt-4">
          <div>
            <h1 className="text-title font-bold text-ink">Hopperz</h1>
            <p className="text-meta text-ink-muted">{voters.length} member{voters.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            type="button"
            onClick={toggleView}
            className="flex h-11 w-11 items-center justify-center text-ink-muted"
          >
            <Icon name={view === "list" ? "grid_view" : "list"} size={24} />
          </button>
        </div>

        {voters.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 pt-16 text-center">
            <Icon name="group" size={48} className="text-ink-dim" />
            <h2 className="text-title font-bold text-ink">No crew yet</h2>
            <p className="text-meta text-ink-muted">Registered users will appear here</p>
          </div>
        ) : view === "list" ? (
          <div className="mt-2 pb-32">
            {voters.map((v) => (
              <button
                key={v.voter_id}
                type="button"
                onClick={() => setSelectedVoter(v)}
                className={`flex w-full min-h-[72px] items-center gap-3 border-b border-border px-4 text-left ${
                  v.isYou ? "bg-raised" : ""
                }`}
              >
                <Avatar
                  voter={{
                    display_name: v.display_name,
                    name: v.display_name,
                    pin_color: v.pin_color,
                    avatar_url: v.avatar_url,
                  }}
                  size={44}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-title text-ink">{v.display_name}</span>
                    {v.isYou && <span className="text-meta text-ink-dim">You</span>}
                    {v.role && <RoleBadge role={v.role} size="sm" />}
                  </div>
                  {v.noteCount > 0 && (
                    <p className="text-meta text-ink-muted">{v.noteCount} note{v.noteCount !== 1 ? "s" : ""}</p>
                  )}
                  {v.isSharing && (
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-green" />
                      <span className="text-meta text-green">Sharing location</span>
                    </div>
                  )}
                  {v.tripStatus === "remote" && (
                    <div className="flex items-center gap-1.5">
                      <Icon name="wifi" size={16} className="text-accent" />
                      <span className="text-meta text-accent">Remote</span>
                    </div>
                  )}
                  {v.tripStatus === "out" && (
                    <span className="mt-1 inline-flex rounded-full bg-raised px-2 text-meta text-ink-dim">
                      Out
                    </span>
                  )}
                </div>
                <Icon name="chevron_right" size={20} className="flex-none text-ink-dim" />
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 px-4 pb-32 pt-4">
            {voters.map((v) => (
              <button
                key={v.voter_id}
                type="button"
                onClick={() => setSelectedVoter(v)}
                className={`flex flex-col items-center gap-2 rounded-card border bg-surface p-3 ${
                  v.tripStatus === "out" ? "opacity-50" : ""
                }`}
              >
                <Avatar
                  voter={{
                    display_name: v.display_name,
                    name: v.display_name,
                    pin_color: v.pin_color,
                    avatar_url: v.avatar_url,
                  }}
                  size={56}
                />
                <span className="max-w-full truncate text-center text-meta font-semibold text-ink">
                  {v.display_name}
                </span>
                {v.role && <RoleBadge role={v.role} size="sm" />}
                {v.isSharing && <span className="h-2 w-2 rounded-full bg-green" />}
                {v.tripStatus === "remote" && (
                  <Icon name="wifi" size={16} className="text-accent" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <VoterProfileSheet
        voter={selectedVoter}
        onClose={() => setSelectedVoter(null)}
        onLocate={handleLocate}
      />
    </>
  );
}
