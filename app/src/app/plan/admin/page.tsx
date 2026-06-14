"use client";

// ADMIN — reachable ONLY by the 3-second long-press on the Locate nav icon.
// No link, no menu entry anywhere else. User management, trip resets, live
// location oversight, and data health counts.

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { hash as hashPin } from "bcryptjs";
import { Avatar } from "@/components/Avatar";
import { BottomSheet } from "@/components/BottomSheet";
import { Dialog } from "@/components/Dialog";
import { Icon } from "@/components/Icon";
import { RoleBadge } from "@/components/RoleBadge";
import { cities, cityById } from "@/data/cities";
import { useGroupData } from "@/hooks/useGroupData";
import { useTripData } from "@/hooks/useTripData";
import { MAX_FIRST_NAME_LENGTH, buildDisplayName, isValidPin } from "@/lib/identity";
import { getRoleForVoter } from "@/lib/roles";
import { getSupabase, safeSelect, type LocationRow, type TripMemberStatus } from "@/lib/supabase";

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

const LOCATION_COLUMNS =
  "voter_id,display_name,lat,lng,pin_color,sharing_since,expires_at,updated_at,muted_ids,session_id";

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

function TripSetupSection() {
  const { voters: groupVoters, voterId } = useGroupData();
  const {
    trip,
    hotels,
    effectiveStatus,
    cityName,
    setTripDates,
    setTripCity,
    clearTripDates,
    addHotel,
    removeHotel,
    assignVoterToHotel,
    unassignVoterFromHotel,
  } = useTripData();
  const [hotelInput, setHotelInput] = useState("");
  const [expandedHotelId, setExpandedHotelId] = useState<string | null>(null);
  const [dateError, setDateError] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const startVal = trip?.start_date ?? "";
  const endVal = trip?.end_date ?? "";

  const handleStartChange = (v: string) => {
    setDateError("");
    const end = endVal || v;
    if (v > end) {
      setDateError("End date must be after start date");
      return;
    }
    void setTripDates(v, end);
  };
  const handleEndChange = (v: string) => {
    setDateError("");
    const start = startVal || v;
    if (v < start) {
      setDateError("End date must be after start date");
      return;
    }
    void setTripDates(start, v);
  };

  const handleAddHotel = () => {
    const name = hotelInput.trim();
    if (!name) return;
    void addHotel(name);
    setHotelInput("");
  };

  const activeVoters = groupVoters.filter((v) => v.is_active);

  const statusDot =
    effectiveStatus === "active"
      ? "var(--green)"
      : effectiveStatus === "upcoming"
        ? "var(--accent)"
        : "var(--ink-dim)";

  return (
    <section className="flex flex-col gap-3">
      <h2 className="label">Trip setup</h2>

      <div className="rounded-card border bg-surface p-4">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: statusDot }}
          />
          <span className="text-base font-semibold text-ink">
            Status: {effectiveStatus === "active" ? "Active" : effectiveStatus === "upcoming" ? "Upcoming" : "Planning"}
          </span>
        </div>
        {(effectiveStatus === "upcoming" || effectiveStatus === "active") && (
          <div className="mt-2 flex flex-col gap-1 text-meta font-normal text-ink-muted">
            {cityName && <p>City: {cityName}</p>}
            {trip?.start_date && <p>Start: {trip.start_date}</p>}
            {trip?.end_date && <p>End: {trip.end_date}</p>}
          </div>
        )}
      </div>

      {(effectiveStatus === "planning" || effectiveStatus === "upcoming") && (
        <>
          <div className="flex flex-col gap-1">
            <p className="label">Destination City</p>
            <select
              className="input w-full"
              value={trip?.city_id ?? ""}
              onChange={(e) => {
                if (e.target.value) void setTripCity(e.target.value);
              }}
            >
              <option value="">Select a city</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}, {c.state}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <p className="label">Trip dates</p>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                className="input"
                min={today}
                value={startVal}
                onChange={(e) => handleStartChange(e.target.value)}
                aria-label="Start date"
              />
              <input
                type="date"
                className="input"
                min={today}
                value={endVal}
                onChange={(e) => handleEndChange(e.target.value)}
                aria-label="End date"
              />
            </div>
            {dateError && (
              <p className="text-meta text-red">{dateError}</p>
            )}
          </div>
        </>
      )}

      <div className="flex flex-col gap-2">
        <p className="label">Confirmed Hotels</p>
        {hotels.map((hotel) => (
          <div key={hotel.id} className="rounded-card border bg-surface">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() =>
                  setExpandedHotelId((prev) => (prev === hotel.id ? null : hotel.id))
                }
              >
                <span className="text-base text-ink">{hotel.hotel_name}</span>
                {hotel.assignedVoterIds.length > 0 && (
                  <div className="mt-1 flex items-center">
                    {hotel.assignedVoterIds.slice(0, 5).map((vid, i) => {
                      const v = groupVoters.find((gv) => gv.voter_id === vid);
                      if (!v) return null;
                      return (
                        <span key={vid} style={{ marginLeft: i > 0 ? -4 : 0 }}>
                          <Avatar
                            voter={{
                              display_name: v.display_name ?? v.name,
                              name: v.name,
                              pin_color: v.pin_color,
                              avatar_url: v.avatar_url,
                            }}
                            size={20}
                          />
                        </span>
                      );
                    })}
                  </div>
                )}
              </button>
              <button
                type="button"
                aria-label={`Remove ${hotel.hotel_name}`}
                onClick={() => void removeHotel(hotel.id)}
                className="flex h-11 w-11 flex-none items-center justify-center text-red"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            {expandedHotelId === hotel.id && (
              <div className="border-t px-4 py-3">
                {activeVoters.map((v) => {
                  const assigned = hotel.assignedVoterIds.includes(v.voter_id);
                  return (
                    <label
                      key={v.voter_id}
                      className="flex h-11 items-center gap-3"
                    >
                      <input
                        type="checkbox"
                        checked={assigned}
                        onChange={() => {
                          if (assigned) void unassignVoterFromHotel(v.voter_id, hotel.id);
                          else void assignVoterToHotel(v.voter_id, hotel.id);
                        }}
                        className="h-5 w-5 rounded accent-accent"
                      />
                      <span className="text-base text-ink">
                        {v.display_name ?? v.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        <div className="flex gap-2">
          <input
            className="input min-w-0 flex-1"
            placeholder="Hotel name"
            value={hotelInput}
            onChange={(e) => setHotelInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddHotel();
            }}
          />
          <button
            type="button"
            onClick={handleAddHotel}
            className="flex h-11 w-11 flex-none items-center justify-center text-accent"
            aria-label="Add hotel"
          >
            <Icon name="add" size={24} />
          </button>
        </div>
      </div>

      {(effectiveStatus === "upcoming" || effectiveStatus === "active" || startVal) && (
        <>
          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="btn w-full border border-red bg-raised text-red"
            >
              Clear Trip Dates
            </button>
          ) : (
            <div className="rounded-card border border-red bg-raised p-4">
              <p className="text-meta font-normal text-ink-muted">
                This will return the trip to planning mode. Votes will unlock.
              </p>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  className="btn-ghost flex-1"
                  onClick={() => setConfirmClear(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn flex-1 bg-red text-bg"
                  onClick={() => {
                    void clearTripDates();
                    setConfirmClear(false);
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {(effectiveStatus === "upcoming" || effectiveStatus === "active") && (
        <div className="rounded-card bg-raised p-3 text-meta font-normal text-ink-muted">
          Voting is locked — trip is confirmed.
        </div>
      )}
    </section>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { voterId: myVoterId, voters: groupVoters } = useGroupData();
  const myRow = groupVoters.find((v) => v.voter_id === myVoterId);
  const myRole = getRoleForVoter(myVoterId, myRow?.role ?? null);
  const canManageTrip = myRole === "super_admin" || myRole === "moderator";
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
      safeSelect<AdminVoter>(
        "v2_voters",
        "voter_id,name,display_name,pin_plain,created_at,is_active,role",
      ),
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

  // Soft disable/enable — reversible, no confirmation. Disabling also tears
  // down any live location row (their map pin must vanish immediately and the
  // sharing toggle is locked off for them); every other table is untouched,
  // so re-enabling restores all their contributions to group views instantly.
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
        setLocations((prev) => prev.filter((l) => l.voter_id !== voterId));
      }
    } catch {
      // a failed toggle surfaces on the next refresh
    }
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
            onClick={() => router.push("/social/locate")}
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
              <div
                key={voter.voter_id}
                className={`rounded-card border bg-surface p-4 ${
                  voter.is_active ? "" : "opacity-60"
                }`}
              >
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
                    {/* Disable/enable — reversible soft toggle, no confirm.
                        Disabled users keep using the app; their data just
                        stops counting in group views until re-enabled. */}
                    <button
                      type="button"
                      onClick={() => void toggleUserActive(voter.voter_id, !voter.is_active)}
                      className="mt-3 flex h-9 items-center gap-2 rounded-chip px-3 text-[12px] font-semibold"
                      style={{
                        background: voter.is_active ? "var(--green-dim)" : "var(--red-dim)",
                        color: voter.is_active ? "var(--green)" : "var(--red)",
                        border: `1px solid ${voter.is_active ? "var(--green)" : "var(--red)"}`,
                      }}
                    >
                      <Icon name={voter.is_active ? "check_circle" : "block"} size={14} />
                      {voter.is_active ? "Active" : "Disabled"}
                    </button>
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

        {/* Section 2 — Trip setup (Super Admin + Moderator) */}
        {canManageTrip && <TripSetupSection />}

        {/* Section 2b — Trip resets */}
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
