"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionHeader, PersonRow, MemberCard } from "@hoppz-ui";
import { Icon } from "@/components/Icon";
import { RoleBadge } from "@/components/RoleBadge";
import { VoterProfileSheet } from "@/components/VoterProfileSheet";
import { useHopperz, type HopperzVoter } from "@/hooks/useHopperz";
import { setLastWing } from "@/lib/auth";
import { getInitials } from "@/lib/colors";
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
          <SectionHeader
            title="Hopperz"
            actionLabel={`${voters.length} member${voters.length !== 1 ? "s" : ""}`}
            actionClassName="text-on-surface-variant"
          />
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
              <PersonRow
                key={v.voter_id}
                initials={getInitials(v.display_name)}
                name={v.display_name}
                subtitle={v.noteCount > 0 ? `${v.noteCount} note${v.noteCount !== 1 ? "s" : ""}` : undefined}
                avatarColor={v.pin_color}
                avatarUrl={v.avatar_url ?? undefined}
                statusColor={v.isSharing ? "var(--green)" : undefined}
                trailingIcon="chevron_right"
                onClick={() => setSelectedVoter(v)}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 px-4 pb-32 pt-4">
            {voters.map((v) => (
              <MemberCard
                key={v.voter_id}
                initials={getInitials(v.display_name)}
                name={v.display_name}
                avatarColor={v.pin_color}
                avatarUrl={v.avatar_url ?? undefined}
                statusDotColor={v.isSharing ? "var(--green)" : v.tripStatus === "remote" ? "var(--accent)" : undefined}
                statusText={v.tripStatus === "remote" ? "Remote" : v.tripStatus === "out" ? "Out" : undefined}
                badge={v.role ? <RoleBadge role={v.role} size="sm" /> : undefined}
                onClick={() => setSelectedVoter(v)}
              />
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
