"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { RoleBadge } from "@/components/RoleBadge";
import { VoterProfileSheet } from "@/components/VoterProfileSheet";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusChip } from "@/components/ui/StatusChip";
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
      <div className="mx-auto max-w-2xl px-4 pt-4">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <h1 className="text-display font-extrabold text-ink">Crew Roster</h1>
          <button
            type="button"
            onClick={toggleView}
            className="flex h-11 w-11 items-center justify-center text-ink-muted"
          >
            <Icon name={view === "list" ? "grid_view" : "list"} size={24} />
          </button>
        </div>

        {voters.length === 0 ? (
          <div className="flex flex-col items-center gap-3 pt-16 text-center">
            <Icon name="group" size={48} className="text-ink-dim" />
            <h2 className="text-title font-bold text-ink">No crew yet</h2>
            <p className="text-meta text-ink-muted">Registered users will appear here</p>
          </div>
        ) : view === "list" ? (
          <div className="flex flex-col gap-2 pb-32">
            {voters.map((v) => (
              <button
                key={v.voter_id}
                type="button"
                onClick={() => setSelectedVoter(v)}
                className="w-full text-left transition-transform active:scale-[0.98]"
              >
                <GlassCard className="flex items-center gap-4 p-4">
                  <div className="relative flex-none">
                    <Avatar
                      voter={{
                        display_name: v.display_name,
                        name: v.display_name,
                        pin_color: v.pin_color,
                        avatar_url: v.avatar_url,
                      }}
                      size={44}
                    />
                    <div
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface ${
                        v.isSharing ? "bg-green" : "bg-ink-dim"
                      }`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex min-w-0 flex-col items-start">
                        <span className="flex items-center gap-2 text-title text-ink">
                          <span className="truncate">{v.display_name}</span>
                          {v.isYou && (
                            <span className="flex-none text-meta text-ink-dim">You</span>
                          )}
                          {v.role && <RoleBadge role={v.role} size="sm" />}
                        </span>
                        {v.isSharing && (
                          <p className="mt-0.5 flex items-center gap-1 text-meta text-green">
                            <span className="h-2 w-2 flex-none rounded-full bg-green" />
                            Sharing location
                          </p>
                        )}
                        {!v.isSharing && v.noteCount > 0 && (
                          <p className="mt-0.5 text-meta text-ink-muted">
                            {v.noteCount} note{v.noteCount !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>

                      {v.tripStatus === "remote" && (
                        <StatusChip label="Remote" variant="active" icon="wifi" />
                      )}
                      {v.tripStatus === "out" && (
                        <StatusChip label="Out" variant="muted" />
                      )}
                    </div>
                  </div>
                </GlassCard>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 pb-32">
            {voters.map((v) => (
              <button
                key={v.voter_id}
                type="button"
                onClick={() => setSelectedVoter(v)}
                className="transition-transform active:scale-[0.98]"
              >
                <GlassCard
                  className={`flex flex-col items-center gap-2 p-3 ${
                    v.tripStatus === "out" ? "opacity-50" : ""
                  }`}
                >
                  <div className="relative">
                    <Avatar
                      voter={{
                        display_name: v.display_name,
                        name: v.display_name,
                        pin_color: v.pin_color,
                        avatar_url: v.avatar_url,
                      }}
                      size={56}
                    />
                    <div
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface ${
                        v.isSharing ? "bg-green" : "bg-ink-dim"
                      }`}
                    />
                  </div>
                  <span className="max-w-full truncate text-center text-meta font-semibold text-ink">
                    {v.display_name}
                  </span>
                  {v.role && <RoleBadge role={v.role} size="sm" />}
                  {v.tripStatus === "remote" && (
                    <StatusChip label="Remote" variant="active" icon="wifi" />
                  )}
                </GlassCard>
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
