"use client";

// ADMIN — reachable ONLY by the 3-second long-press on the Locate nav icon.
// No link, no menu entry anywhere else. User management, trip resets, live
// location oversight, and data health counts.

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { hash as hashPin } from "bcryptjs";
import { BottomSheet } from "@/components/BottomSheet";
import { Dialog } from "@/components/Dialog";
import { Icon } from "@/components/Icon";
import { cityById } from "@/data/cities";
import { MAX_FIRST_NAME_LENGTH, buildDisplayName, isValidPin } from "@/lib/identity";
import { getSupabase, safeSelect, type LocationRow } from "@/lib/supabase";

interface AdminVoter {
  voter_id: string;
  name: string;
  display_name: string | null;
  /** Recovery copy of the 2-digit PIN — null until a profile/admin PIN change writes it. */
  pin_plain: string | null;
  created_at: string | null;
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

const LOCATION_COLUMNS =
  "voter_id,display_name,lat,lng,pin_color,sharing_since,expires_at,updated_at,muted_ids";

// PostgREST refuses an unfiltered DELETE — every row matches this instead.
const ALL_ROWS = "1970-01-01";

// The wipe-all deletes hit every real row by excluding the nil uuid.
const NIL_UUID = "00000000-0000-0000-0000-000000000000";
const WIPED_FLASH_MS = 4000; // "All users wiped." dwell in the users section

function voterLabel(v: AdminVoter): string {
  return v.display_name ?? v.name;
}

function hoursAgo(iso: string, nowMs: number): string {
  const hrs = Math.floor((nowMs - new Date(iso).getTime()) / 3_600_000);
  if (hrs < 1) return "less than an hour ago";
  return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
}

function hoursLeft(iso: string, nowMs: number): string {
  const hrs = Math.max(0, Math.ceil((new Date(iso).getTime() - nowMs) / 3_600_000));
  return `${hrs} hour${hrs === 1 ? "" : "s"}`;
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

/** 44px icon button used for the pencil / delete / refresh actions. */
function IconButton({
  name,
  label,
  onClick,
  className = "text-ink-dim hover:text-ink",
}: {
  name: string;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex h-11 w-11 flex-none items-center justify-center rounded-btn transition hover:bg-raised ${className}`}
    >
      <Icon name={name} size={22} />
    </button>
  );
}

function FieldError({ children }: { children: string }) {
  return (
    <p className="text-[12px] font-medium text-red" role="alert">
      {children}
    </p>
  );
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
          <input
            className="input"
            placeholder="First name"
            autoComplete="off"
            value={first}
            maxLength={MAX_FIRST_NAME_LENGTH}
            onChange={(e) => setFirst(e.target.value)}
            aria-label="First name"
          />
          {errors.first && <FieldError>{errors.first}</FieldError>}
        </div>
        <div className="flex flex-col gap-1">
          <input
            className="input"
            placeholder="Initial"
            autoComplete="off"
            autoCapitalize="characters"
            value={initial}
            maxLength={1}
            onChange={(e) =>
              setInitial(e.target.value.replace(/[^A-Za-z]/g, "").slice(0, 1).toUpperCase())
            }
            aria-label="Last initial"
          />
          {errors.initial && <FieldError>{errors.initial}</FieldError>}
        </div>
        <div className="flex flex-col gap-1">
          <input
            className="input"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="New PIN (blank keeps current)"
            value={newPin}
            maxLength={2}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 2))}
            aria-label="New 2-digit PIN"
          />
          {newPin && (
            <input
              className="input"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Confirm new PIN"
              value={confirmPin}
              maxLength={2}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 2))}
              aria-label="Confirm new 2-digit PIN"
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

interface ConfirmResetDialogProps {
  title: string;
  body: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmResetDialog({ title, body, onCancel, onConfirm }: ConfirmResetDialogProps) {
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

export default function AdminPage() {
  const router = useRouter();
  const [voters, setVoters] = useState<AdminVoter[]>([]);
  const [cityVotes, setCityVotes] = useState<CityVoteLite[]>([]);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [editing, setEditing] = useState<AdminVoter | null>(null);
  const [deleting, setDeleting] = useState<AdminVoter | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState<"votes" | "availability" | null>(null);
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

  const nowMs = Date.now();

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
    const [v, cv, loc] = await Promise.all([
      safeSelect<AdminVoter>("v2_voters", "voter_id,name,display_name,pin_plain,created_at"),
      safeSelect<CityVoteLite>("v2_city_votes", "voter_id,city_id"),
      safeSelect<LocationRow>("v2_locations", LOCATION_COLUMNS),
    ]);
    if (v) {
      setVoters(
        [...v].sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? "")),
      );
    }
    if (cv) setCityVotes(cv);
    if (loc) setLocations(loc);
    await refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const activeLocations = useMemo(
    () => locations.filter((l) => new Date(l.expires_at).getTime() > nowMs),
    [locations, nowMs],
  );

  const lastVoted = useCallback(
    (voterId: string): string | null => {
      const vote = cityVotes.find((r) => r.voter_id === voterId);
      if (!vote) return null;
      return cityById(vote.city_id)?.name ?? vote.city_id;
    },
    [cityVotes],
  );

  const resetVotes = async () => {
    setConfirmReset(null);
    const sb = getSupabase();
    if (!sb) return;
    try {
      await sb.from("v2_city_votes").delete().gte("updated_at", ALL_ROWS);
      await sb.from("v2_hotel_votes").delete().gte("updated_at", ALL_ROWS);
    } catch {
      // partial reset surfaces in the refreshed counts
    }
    void refreshAll();
  };

  const resetAvailability = async () => {
    setConfirmReset(null);
    const sb = getSupabase();
    if (!sb) return;
    try {
      await sb.from("v2_availability").delete().gte("updated_at", ALL_ROWS);
    } catch {
      // partial reset surfaces in the refreshed counts
    }
    void refreshAll();
  };

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
      // refetch below restores the truth either way
    }
    void refreshAll();
  };

  // Cascade delete, child tables first in FK-dependency order, each step
  // awaited before the next, v2_voters last — never a single cascade call.
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

  // The nuclear option — same table order as deleteUser, but every row goes.
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
      {/* Own sticky header — the global wordmark bar hides on /admin */}
      <header className="sticky top-0 z-30 border-b bg-bg">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-1 px-4">
          <button
            type="button"
            onClick={() => router.push("/locate")}
            aria-label="Back"
            className="-ml-2 flex h-11 w-11 flex-none items-center justify-center text-ink-muted transition hover:text-ink"
          >
            <Icon name="arrow_back" size={22} />
          </button>
          <h1 className="text-title font-bold text-ink">Admin</h1>
        </div>
      </header>

      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pb-32 pt-4">
        {/* Section 1 — Registered users. Name, PIN, and last vote are always
            plain visible text — no masking, no reveal toggle. */}
        <section className="flex flex-col gap-3">
          <h2 className="label">Registered users</h2>
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
              <div key={voter.voter_id} className="rounded-card border bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-title text-ink">{voterLabel(voter)}</p>
                    <p className="mt-1 text-meta font-normal text-ink-dim">
                      {voter.pin_plain ? `PIN: ${voter.pin_plain}` : "PIN not set"}
                    </p>
                    <p className="mt-1 text-meta font-normal text-ink-dim">
                      {city ? `Last voted: ${city}` : "No vote"}
                    </p>
                  </div>
                  <div className="flex flex-none">
                    <IconButton
                      name="edit"
                      label={`Edit ${voterLabel(voter)}`}
                      onClick={() => setEditing(voter)}
                    />
                    <IconButton
                      name="delete"
                      label={`Delete ${voterLabel(voter)}`}
                      className="text-red"
                      onClick={() => setDeleting(voter)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Section 2 — Trip management */}
        <section className="flex flex-col gap-3">
          <h2 className="label">Trip management</h2>
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

        {/* Section 3 — Location overview */}
        <section className="flex flex-col gap-3">
          <h2 className="label">Active locations</h2>
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

        {/* Section 4 — App health */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="label">Data health</h2>
            <IconButton name="refresh" label="Refresh counts" onClick={() => void refreshStats()} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {statCells.map((cell) => (
              <div key={cell.label} className="rounded-card border bg-surface p-4">
                <p className="text-display text-ink">{cell.value ?? "—"}</p>
                <p className="mt-1 text-meta font-normal text-ink-muted">{cell.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5 — Danger zone */}
        <section className="flex flex-col gap-3">
          <h2 className="label text-red">Danger zone</h2>
          <button
            type="button"
            onClick={() => setWipeOpen(true)}
            className="btn w-full border border-red bg-raised text-red"
          >
            <Icon name="warning" size={20} />
            Wipe All Users
          </button>
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
          <input
            className="input"
            placeholder="Type DELETE to confirm"
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            value={wipeText}
            onChange={(e) => setWipeText(e.target.value)}
            aria-label="Type DELETE to confirm"
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
