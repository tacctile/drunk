"use client";

import { Avatar } from "@/components/Avatar";
import { BottomSheet } from "@/components/BottomSheet";
import { Icon } from "@/components/Icon";
import { RoleBadge } from "@/components/RoleBadge";
import { Switch } from "@/components/Switch";
import { useGroupData } from "@/hooks/useGroupData";
import { useTripData } from "@/hooks/useTripData";
import { useVoterNotes } from "@/hooks/useVoterNotes";
import { isSuperAdmin, getRoleForVoter } from "@/lib/roles";
import type { TripMemberStatus } from "@/lib/supabase";
import type { HopperzVoter } from "@/hooks/useHopperz";

interface VoterProfileSheetProps {
  voter: HopperzVoter | null;
  onClose: () => void;
  onLocate?: (voterId: string) => void;
}

const TRIP_STATUS_CONFIG: Record<TripMemberStatus, { icon: string; color: string; label: string }> = {
  on_trip: { icon: "check_circle", color: "var(--green)", label: "On the trip" },
  remote: { icon: "wifi", color: "var(--accent)", label: "Joining remotely" },
  out: { icon: "cancel", color: "var(--ink-dim)", label: "Not on this trip" },
};

function TripStatusButtons({
  current,
  onChange,
}: {
  current: TripMemberStatus;
  onChange: (s: TripMemberStatus) => void;
}) {
  const statuses: { key: TripMemberStatus; label: string }[] = [
    { key: "on_trip", label: "On Trip" },
    { key: "remote", label: "Remote" },
    { key: "out", label: "Out" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {statuses.map((s) => {
        const active = current === s.key;
        const cls = active
          ? s.key === "on_trip"
            ? "border bg-green-dim border-green text-green"
            : s.key === "remote"
              ? "border bg-accent-dim border-accent text-accent"
              : "border bg-raised border-border text-ink-dim"
          : "btn-ghost";
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onChange(s.key)}
            className={`btn text-[13px] px-2 ${cls}`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

export function VoterProfileSheet({ voter, onClose, onLocate }: VoterProfileSheetProps) {
  const { voterId, setModeratorRole, voters: groupVoters } = useGroupData();
  const { members, setMemberStatus } = useTripData();
  const { notes, loading: notesLoading } = useVoterNotes(voter?.voter_id ?? null);
  const viewerIsSuperAdmin = isSuperAdmin(voterId);
  const viewerRow = groupVoters.find((v) => v.voter_id === voterId);
  const viewerRole = getRoleForVoter(voterId, viewerRow?.role ?? null);
  const canManageTrip = viewerRole === "super_admin" || viewerRole === "moderator";

  if (!voter) return null;

  const isMod = voter.role === "moderator";

  const handleToggleMod = () => {
    void setModeratorRole(voter.voter_id, !isMod);
  };

  return (
    <BottomSheet open={!!voter} onClose={onClose} label={`${voter.display_name} profile`}>
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Avatar
          voter={{
            display_name: voter.display_name,
            name: voter.display_name,
            pin_color: voter.pin_color,
            avatar_url: voter.avatar_url,
          }}
          size={56}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-title text-ink">{voter.display_name}</p>
            {voter.isYou && <span className="text-meta text-ink-dim">You</span>}
          </div>
          {voter.role && <RoleBadge role={voter.role} size="sm" />}
        </div>
      </div>

      {voter.isSharing && !voter.isYou && onLocate && (
        <button
          type="button"
          className="btn-ghost mt-4 w-full"
          onClick={() => {
            onLocate(voter.voter_id);
            onClose();
          }}
        >
          <Icon name="person_pin" size={20} />
          Locate on map
        </button>
      )}

      {/* Trip status */}
      {(() => {
        const memberStatus: TripMemberStatus =
          members.find((m) => m.voter_id === voter.voter_id)?.trip_status ?? "on_trip";
        const cfg = TRIP_STATUS_CONFIG[memberStatus];
        const isYou = voter.voter_id === voterId;
        const showButtons = isYou || canManageTrip;

        return (
          <div className="mt-4 border-t border-border pt-4">
            <p className="label">Trip Status</p>
            <div className="mt-2 flex items-center gap-2" style={{ color: cfg.color }}>
              <span className="ms flex-none" style={{ fontSize: 18 }} aria-hidden="true">{cfg.icon}</span>
              <span className="text-base">
                {cfg.label}
              </span>
            </div>
            {showButtons && (
              <div className="mt-3">
                <TripStatusButtons
                  current={memberStatus}
                  onChange={(s) => void setMemberStatus(voter.voter_id, s)}
                />
              </div>
            )}
          </div>
        );
      })()}

      <div className="mt-4">
        <p className="label">About</p>
        {notesLoading ? (
          <div className="mt-2 flex flex-col gap-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-surface-raised" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-surface-raised" />
          </div>
        ) : notes.length > 0 ? (
          <div className="mt-2 flex flex-col gap-2">
            {notes.map((note) => (
              <div key={note.id} className="card text-base text-ink">
                {note.content}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-meta text-ink-dim">Nothing shared yet</p>
        )}
      </div>

      {viewerIsSuperAdmin && !voter.isYou && (
        <>
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <span className="text-base text-ink">Moderator access</span>
              <Switch
                checked={isMod}
                onToggle={handleToggleMod}
                ariaLabel="Moderator access"
              />
            </div>
          </div>
        </>
      )}
    </BottomSheet>
  );
}
