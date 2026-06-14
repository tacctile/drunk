"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { RoleBadge } from "@/components/RoleBadge";
import { useGroupData } from "@/hooks/useGroupData";
import { isSuperAdmin } from "@/lib/roles";
import { getSupabase, type VoterNoteRow } from "@/lib/supabase";
import type { HopperzVoter } from "@/hooks/useHopperz";

interface VoterProfileSheetProps {
  voter: HopperzVoter | null;
  onClose: () => void;
  onLocate?: (voterId: string) => void;
}

function Switch({
  checked,
  onToggle,
  ariaLabel,
  disabled = false,
}: {
  checked: boolean;
  onToggle: () => void;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onToggle}
      className="flex h-11 w-11 flex-none items-center justify-center disabled:opacity-50"
    >
      <span
        className={`relative h-6 w-10 rounded-full border transition ${
          checked ? "border-accent bg-accent" : "border-border-strong bg-raised"
        }`}
      >
        <span
          className={`absolute left-[2px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full transition ${
            checked ? "translate-x-4 bg-bg" : "bg-ink-muted"
          }`}
        />
      </span>
    </button>
  );
}

export function VoterProfileSheet({ voter, onClose, onLocate }: VoterProfileSheetProps) {
  const { voterId, setModeratorRole } = useGroupData();
  const [notes, setNotes] = useState<VoterNoteRow[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const viewerIsSuperAdmin = isSuperAdmin(voterId);

  useEffect(() => {
    if (!voter) {
      setNotes([]);
      return;
    }
    let cancelled = false;
    setNotesLoading(true);
    (async () => {
      const sb = getSupabase();
      if (!sb) {
        if (!cancelled) setNotesLoading(false);
        return;
      }
      try {
        const { data } = await sb
          .from("v2_voter_notes")
          .select("*")
          .eq("voter_id", voter.voter_id)
          .order("sort_order", { ascending: true });
        if (!cancelled) setNotes(data ?? []);
      } catch {
        // silent
      }
      if (!cancelled) setNotesLoading(false);
    })();
    return () => { cancelled = true; };
  }, [voter]);

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
