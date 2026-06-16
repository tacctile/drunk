"use client";

// ADMIN — reachable ONLY by the 3-second long-press on the Locate nav icon.
// No link, no menu entry anywhere else. User management, trip resets, live
// location oversight, and data health counts.

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { hash as hashPin } from "bcryptjs";
import { ActiveLocationsPanel } from "@/components/ActiveLocationsPanel";
import { BottomSheet } from "@/components/BottomSheet";
import { Dialog } from "@/components/Dialog";
import { FieldError } from "@/components/FieldError";
import { Icon } from "@/components/Icon";
import { RoleBadge } from "@/components/RoleBadge";
import { TripResetsPanel } from "@/components/TripResetsPanel";
import { TripSetupPanel } from "@/components/TripSetupPanel";
import {
  TopAppBar,
  SectionLabel,
  Card,
  GlassIconButton,
  SettingsToggleRow,
  TextField,
  PinInput,
  StatTile,
  ActionButton,
} from "@hoppz-ui";
import { cityById } from "@/data/cities";
import { useGroupData } from "@/hooks/useGroupData";
import { useLocations } from "@/hooks/useLocations";
import { MAX_FIRST_NAME_LENGTH, buildDisplayName, isValidPin } from "@/lib/identity";
import { getRoleForVoter } from "@/lib/roles";
import { getSupabase, safeSelect } from "@/lib/supabase";

interface AdminVoter {
  voter_id: string;
  name: string;
  display_name: string | null;
  pin_plain: string | null;
  created_at: string | null;
  is_active: boolean;
  role: string | null;
}

interface CityVoteLite {
  voter_id: string;
  city_id: string;
}

interface Stats {
  voters: number | null;
  cityVotes: number | null;
  availability: number | null;
  activeLocations: number | null;
  hotels: number | null;
  bars: number | null;
  food: number | null;
}

const EMPTY_STATS: Stats = {
  voters: null,
  cityVotes: null,
  availability: null,
  activeLocations: null,
  hotels: null,
  bars: null,
  food: null,
};

// The wipe-all deletes hit every real row by excluding the nil uuid.
const NIL_UUID = "00000000-0000-0000-0000-000000000000";
const WIPED_FLASH_MS = 4000; // "All users wiped." dwell in the users section

function voterLabel(v: AdminVoter): string {
  return v.display_name ?? v.name;
}

async function countRows(table: string, onlyActive = false): Promise<number | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    let query = sb.from(table).select("*", { count: "exact", head: true });
    if (onlyActive) query = query.gt("expires_at", new Date().toISOString());
    const { count, error } = await query;
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}


interface EditUserDialogProps {
  voter: AdminVoter;
  onClose: () => void;
  /** Saved — the page refetches. */
  onChanged: () => void;
}

function EditUserDialog({ voter, onClose, onChanged }: EditUserDialogProps) {
  const label = voterLabel(voter);
  const lastSpace = label.lastIndexOf(" ");
  const [first, setFirst] = useState(lastSpace > 0 ? label.slice(0, lastSpace) : label);
  const [initial, setInitial] = useState(
    lastSpace > 0 ? label.slice(lastSpace + 1, lastSpace + 2).toUpperCase() : "",
  );
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [errors, setErrors] = useState<{
    first?: string;
    initial?: string;
    pin?: string;
    save?: string;
  }>({});
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (busy) return;
    const next: typeof errors = {};
    if (!/^[A-Za-z]{1,15}$/.test(first.trim())) next.first = "Letters only, 1–15 characters.";
    if (!/^[A-Za-z]$/.test(initial)) next.initial = "Exactly one letter.";
    if (newPin && !isValidPin(newPin)) next.pin = "Exactly 2 digits (00–99).";
    else if (newPin && newPin !== confirmPin) next.pin = "PINs don't match.";
    setErrors(next);
    if (next.first || next.initial || next.pin) return;
    const displayName = buildDisplayName(first.trim(), initial);
    if (!displayName) return;
    const sb = getSupabase();
    if (!sb) {
      setErrors({ save: "Couldn't save. Try again." });
      return;
    }
    setBusy(true);
    try {
      const nowIso = new Date().toISOString();
      const patch: Record<string, unknown> = {
        name: displayName,
        display_name: displayName,
        updated_at: nowIso,
      };
      // Blank PIN keeps the existing PIN; a new one resets the hash and the
      // recovery copy the user list displays.
      if (newPin) {
        patch.pin_hash = await hashPin(newPin, 10);
        patch.pin_plain = newPin;
      }
      const { error } = await sb.from("v2_voters").update(patch).eq("voter_id", voter.voter_id);
      if (error) throw error;
      // Keep the denormalized name on any live location row in sync.
      await sb
        .from("v2_locations")
        .update({ display_name: displayName })
        .eq("voter_id", voter.voter_id);
      onChanged();
      onClose();
      return;
    } catch {
      setErrors({ save: "Couldn't save. Try again." });
    }
    setBusy(false);
  };

  return (
    <Dialog open onClose={onClose} title={`Edit ${label}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col gap-1">
          <TextField
            label="First name"
            value={first}
            onChange={setFirst}
            maxLength={MAX_FIRST_NAME_LENGTH}
            placeholder="First name"
          />
          {errors.first && <FieldError>{errors.first}</FieldError>}
        </div>
        <div className="flex flex-col gap-1">
          <TextField
            label="Last initial"
            value={initial}
            onChange={(v) => setInitial(v.replace(/[^A-Za-z]/g, "").slice(0, 1).toUpperCase())}
            maxLength={1}
            placeholder="Initial"
          />
          {errors.initial && <FieldError>{errors.initial}</FieldError>}
        </div>
        <div className="flex flex-col gap-1">
          <PinInput
            value={newPin}
            onChange={(v) => setNewPin(v.replace(/\D/g, "").slice(0, 2))}
            maxLength={2}
            placeholder="••"
            hint="New PIN (blank keeps current)"
          />
          {newPin && (
            <PinInput
              value={confirmPin}
              onChange={(v) => setConfirmPin(v.replace(/\D/g, "").slice(0, 2))}
              maxLength={2}
              placeholder="••"
              hint="Confirm new PIN"
            />
          )}
          {errors.pin && <FieldError>{errors.pin}</FieldError>}
        </div>
        {errors.save && <FieldError>{errors.save}</FieldError>}
        <button type="submit" className="btn-accent w-full" disabled={busy}>
          Save changes
        </button>
      </form>
    </Dialog>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { voterId: myVoterId, voters: groupVoters } = useGroupData();
  const { activeLocations } = useLocations();
  const myRow = groupVoters.find((v) => v.voter_id === myVoterId);
  const myRole = getRoleForVoter(myVoterId, myRow?.role ?? null);
  const canManageTrip = myRole === "super_admin" || myRole === "moderator";
  const [voters, setVoters] = useState<AdminVoter[]>([]);
  const [cityVotes, setCityVotes] = useState<CityVoteLite[]>([]);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [editing, setEditing] = useState<AdminVoter | null>(null);
  const [deleting, setDeleting] = useState<AdminVoter | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wipeText, setWipeText] = useState("");
  const [wipeBusy, setWipeBusy] = useState(false);
  const [wiped, setWiped] = useState(false);
  const wipedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (wipedTimer.current) clearTimeout(wipedTimer.current);
    },
    [],
  );

  const refreshStats = useCallback(async () => {
    const [v, cv, av, al, h, b, f] = await Promise.all([
      countRows("v2_voters"),
      countRows("v2_city_votes"),
      countRows("v2_availability"),
      countRows("v2_locations", true),
      countRows("v2_hotels"),
      countRows("v2_bars"),
      countRows("v2_food"),
    ]);
    setStats({
      voters: v,
      cityVotes: cv,
      availability: av,
      activeLocations: al,
      hotels: h,
      bars: b,
      food: f,
    });
  }, []);

  const refreshAll = useCallback(async () => {
    const [v, cv] = await Promise.all([
      safeSelect<AdminVoter>(
        "v2_voters",
        "voter_id,name,display_name,pin_plain,created_at,is_active,role",
      ),
      safeSelect<CityVoteLite>("v2_city_votes", "voter_id,city_id"),
    ]);
    if (v) {
      setVoters(
        [...v].sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? "")),
      );
    }
    if (cv) setCityVotes(cv);
    await refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const lastVoted = useCallback(
    (voterId: string): string | null => {
      const vote = cityVotes.find((r) => r.voter_id === voterId);
      if (!vote) return null;
      return cityById(vote.city_id)?.name ?? vote.city_id;
    },
    [cityVotes],
  );

  const toggleUserActive = async (voterId: string, newState: boolean) => {
    setVoters((prev) =>
      prev.map((u) => (u.voter_id === voterId ? { ...u, is_active: newState } : u)),
    );
    const sb = getSupabase();
    if (!sb) return;
    try {
      await sb.from("v2_voters").update({ is_active: newState }).eq("voter_id", voterId);
      if (!newState) {
        await sb.from("v2_locations").delete().eq("voter_id", voterId);
      }
    } catch {
      // a failed toggle surfaces on the next refresh
    }
  };

  const deleteUser = useCallback(
    async (voterId: string) => {
      const sb = getSupabase();
      if (sb) {
        try {
          await sb.from("v2_locations").delete().eq("voter_id", voterId);
          await sb.from("v2_availability").delete().eq("voter_id", voterId);
          await sb.from("v2_hotel_votes").delete().eq("voter_id", voterId);
          await sb.from("v2_city_votes").delete().eq("voter_id", voterId);
          await sb.from("v2_voters").delete().eq("voter_id", voterId);
        } catch {
          // a partial delete surfaces in the refreshed list
        }
      }
      await refreshAll();
    },
    [refreshAll],
  );

  const confirmDeleteUser = async () => {
    if (!deleting || deleteBusy) return;
    setDeleteBusy(true);
    await deleteUser(deleting.voter_id);
    setDeleteBusy(false);
    setDeleting(null);
  };

  const closeWipeSheet = () => {
    if (wipeBusy) return;
    setWipeOpen(false);
    setWipeText("");
  };

  const wipeAllUsers = async () => {
    if (wipeBusy || wipeText !== "DELETE") return;
    setWipeBusy(true);
    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from("v2_locations").delete().neq("voter_id", NIL_UUID);
        await sb.from("v2_availability").delete().neq("voter_id", NIL_UUID);
        await sb.from("v2_hotel_votes").delete().neq("voter_id", NIL_UUID);
        await sb.from("v2_city_votes").delete().neq("voter_id", NIL_UUID);
        await sb.from("v2_voters").delete().neq("voter_id", NIL_UUID);
      } catch {
        // a partial wipe surfaces in the refreshed list
      }
    }
    await refreshAll();
    setWipeBusy(false);
    setWipeOpen(false);
    setWipeText("");
    setWiped(true);
    if (wipedTimer.current) clearTimeout(wipedTimer.current);
    wipedTimer.current = setTimeout(() => setWiped(false), WIPED_FLASH_MS);
  };

  const statCells: { label: string; value: number | null }[] = [
    { label: "Registered users", value: stats.voters },
    { label: "Total votes cast", value: stats.cityVotes },
    { label: "Availability entries", value: stats.availability },
    { label: "Active locations", value: stats.activeLocations },
    { label: "Hotels in DB", value: stats.hotels },
    { label: "Bars in DB", value: stats.bars },
    { label: "Food in DB", value: stats.food },
  ];

  return (
    <>
      <TopAppBar
        title="Admin"
        leadingIcon="arrow_back"
        onLeadingAction={() => router.push("/plan")}
        position="sticky"
      />

      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pb-32 pt-4">
        <section className="flex flex-col gap-3">
          <SectionLabel>Registered users</SectionLabel>
          {voters.length === 0 &&
            (wiped ? (
              <p className="py-4 text-center text-base text-ink-muted" role="status">
                All users wiped.
              </p>
            ) : (
              <p className="text-meta font-normal text-ink-dim">No registered users.</p>
            ))}
          {voters.map((voter) => {
            const city = lastVoted(voter.voter_id);
            return (
              <Card key={voter.voter_id} className={voter.is_active ? "" : "opacity-60"}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-title text-ink">{voterLabel(voter)}</p>
                      {getRoleForVoter(voter.voter_id, voter.role) && (
                        <RoleBadge role={getRoleForVoter(voter.voter_id, voter.role)} size="sm" />
                      )}
                    </div>
                    <p className="mt-1 text-meta font-normal text-ink-dim">
                      {voter.pin_plain ? `PIN: ${voter.pin_plain}` : "PIN not set"}
                    </p>
                    <p className="mt-1 text-meta font-normal text-ink-dim">
                      {city ? `Last voted: ${city}` : "No vote"}
                    </p>
                    <div className="mt-3">
                      <SettingsToggleRow
                        icon={voter.is_active ? "check_circle" : "cancel"}
                        title={voter.is_active ? "Active" : "Disabled"}
                        iconBgClassName={voter.is_active ? "bg-green/10" : "bg-error/10"}
                        iconClassName={voter.is_active ? "text-green" : "text-red"}
                        checked={voter.is_active}
                        onChange={() => void toggleUserActive(voter.voter_id, !voter.is_active)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-none gap-1">
                    <GlassIconButton
                      icon="edit"
                      ariaLabel={`Edit ${voterLabel(voter)}`}
                      onClick={() => setEditing(voter)}
                    />
                    <GlassIconButton
                      icon="delete"
                      ariaLabel={`Delete ${voterLabel(voter)}`}
                      onClick={() => setDeleting(voter)}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </section>

        {canManageTrip && <TripSetupPanel canClear={true} />}

        <TripResetsPanel />

        <ActiveLocationsPanel locations={activeLocations} />

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <SectionLabel>Data health</SectionLabel>
            <GlassIconButton icon="refresh" ariaLabel="Refresh counts" onClick={() => void refreshStats()} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {statCells.map((cell) => (
              <StatTile
                key={cell.label}
                icon="database"
                value={String(cell.value ?? "—")}
                label={cell.label}
                className="w-full"
              />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <SectionLabel>Danger zone</SectionLabel>
          <ActionButton
            variant="filled"
            label="Wipe All Users"
            icon="warning"
            onClick={() => setWipeOpen(true)}
            fullWidth
          />
        </section>
      </div>

      {editing && (
        <EditUserDialog
          voter={editing}
          onClose={() => setEditing(null)}
          onChanged={() => void refreshAll()}
        />
      )}

      {deleting && (
        <Dialog
          open
          onClose={() => {
            if (!deleteBusy) setDeleting(null);
          }}
          title={`Delete ${voterLabel(deleting)}?`}
        >
          <p className="text-base font-normal text-ink-muted">
            This removes all their votes, availability, and location data. Cannot be undone.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              className="btn-ghost flex-1"
              onClick={() => setDeleting(null)}
              disabled={deleteBusy}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn flex-1 bg-red text-bg hover:brightness-110"
              onClick={() => void confirmDeleteUser()}
              disabled={deleteBusy}
            >
              Delete
            </button>
          </div>
        </Dialog>
      )}

      <BottomSheet open={wipeOpen} onClose={closeWipeSheet} label="Wipe all users">
        <div className="flex flex-col gap-3 px-1 pb-1">
          <h2 className="text-title text-red">Wipe All Users</h2>
          <p className="text-base font-normal text-ink-muted">
            This permanently deletes every registered user and all their votes, availability,
            hotel preferences, and location data. This cannot be undone.
          </p>
          <p className="text-base font-normal text-ink-muted">
            Type DELETE in the field below to confirm.
          </p>
          <TextField
            label="Confirmation"
            value={wipeText}
            onChange={setWipeText}
            placeholder="Type DELETE to confirm"
          />
          <button
            type="button"
            onClick={closeWipeSheet}
            disabled={wipeBusy}
            className="flex h-11 w-full items-center justify-center text-base font-medium text-ink-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void wipeAllUsers()}
            disabled={wipeText !== "DELETE" || wipeBusy}
            className="btn w-full bg-red text-bg hover:brightness-110"
          >
            Wipe Everything
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
