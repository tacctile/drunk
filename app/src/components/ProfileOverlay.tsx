"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { compare as comparePin } from "bcryptjs";
import { cities } from "@/data/cities";
import { useAvailability } from "@/hooks/useAvailability";
import { useGroupData } from "@/hooks/useGroupData";
import { useLocations, type LocationsValue } from "@/hooks/useLocations";
import { useTripData } from "@/hooks/useTripData";
import { useVotes } from "@/hooks/useVotes";
import { contrastColor, getInitials, PIN_COLORS } from "@/lib/colors";
import {
  buildDisplayName,
  getStoredPinColor,
  isValidPin,
  storeAvatarUrl,
} from "@/lib/identity";
import { formatMonthTitle, plural } from "@/lib/format";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scrollLock";
import { getSupabase, type VoterNoteRow, type TripMemberStatus } from "@/lib/supabase";
import { uploadAvatar } from "@/lib/storage";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  getRoleForVoter,
  ROLE_LABELS,
  ROLE_BADGE_ICONS,
  MODERATOR_PERMISSIONS,
  MODERATOR_RESTRICTIONS,
  type UserRole,
} from "@/lib/roles";
import { Avatar } from "./Avatar";
import { AvatarCropper } from "./AvatarCropper";
import { BottomSheet } from "./BottomSheet";
import { Icon } from "./Icon";
import { NamePrompt } from "./NamePrompt";
import { RoleBadge } from "./RoleBadge";

const SWIPE_CLOSE_PX = 70;
const SAVED_FLASH_MS = 1200;

type ProfileTab = "me" | "trip" | "about";

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function FieldError({ children }: { children: string }) {
  return (
    <p className="text-[12px] font-medium text-red" role="alert">
      {children}
    </p>
  );
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

function PinField({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  ariaLabel: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        className="input pr-12"
        type={show ? "text" : "password"}
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        maxLength={2}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 2))}
        aria-label={ariaLabel}
      />
      <button
        type="button"
        aria-label={show ? "Hide PIN" : "Reveal PIN"}
        onClick={() => setShow((s) => !s)}
        className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-ink-muted"
      >
        <Icon name={show ? "visibility_off" : "visibility"} size={20} />
      </button>
    </div>
  );
}

function TabBar({
  active,
  onChange,
}: {
  active: ProfileTab;
  onChange: (tab: ProfileTab) => void;
}) {
  const tabs: { key: ProfileTab; label: string }[] = [
    { key: "me", label: "Me" },
    { key: "trip", label: "Trip" },
    { key: "about", label: "About" },
  ];
  return (
    <div className="flex w-full border-b border-border bg-bg">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={`flex h-11 flex-1 items-center justify-center text-label font-semibold transition ${
            active === t.key
              ? "border-b-2 border-accent text-accent"
              : "text-ink-muted"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Tab 2: Trip ───

function TripStatusCard() {
  const { voterId } = useGroupData();
  const { members, setMemberStatus, effectiveStatus } = useTripData();
  const myStatus = members.find((m) => m.voter_id === voterId)?.trip_status ?? "on_trip";

  return (
    <section>
      <h2 className="label">Trip Status</h2>
      <div className="card mt-2">
        <p className="text-meta font-normal text-ink-muted mb-3">
          {effectiveStatus === "active"
            ? "The trip is happening now."
            : effectiveStatus === "upcoming"
              ? "The trip is coming up."
              : "No trip scheduled yet."}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(["on_trip", "remote", "out"] as TripMemberStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void setMemberStatus(voterId, s)}
              className={`btn text-[13px] px-2 ${
                myStatus === s
                  ? s === "on_trip"
                    ? "bg-green-dim border-green text-green"
                    : s === "remote"
                      ? "bg-accent-dim border-accent text-accent"
                      : "bg-raised border-border text-ink-dim"
                  : "btn-ghost"
              }`}
            >
              {s === "on_trip" ? "On Trip" : s === "remote" ? "Remote" : "Out"}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function VoteCard({ onGoVote }: { onGoVote: () => void }) {
  const { voterId, hotelVotes } = useGroupData();
  const { myCityId, hasVoted } = useVotes();
  const cityName = myCityId ? cities.find((c) => c.id === myCityId)?.name ?? myCityId : null;
  const hotelName = myCityId
    ? hotelVotes.find((r) => r.voter_id === voterId && r.city_id === myCityId)?.hotel_name ?? null
    : null;

  return (
    <section>
      <h2 className="label">My vote</h2>
      <div className="card mt-2">
        {hasVoted ? (
          <>
            <p className="text-title text-ink">{cityName}</p>
            <p className="mt-0.5 text-meta font-normal text-ink-dim">You voted for this city</p>
            {hotelName && (
              <p className="mt-1 text-meta font-normal text-ink-muted">Preferred hotel: {hotelName}</p>
            )}
          </>
        ) : (
          <>
            <p className="text-base text-ink-dim">No vote cast yet</p>
            <button
              type="button"
              onClick={onGoVote}
              className="flex h-11 items-center text-base font-semibold text-accent"
            >
              Go vote
            </button>
          </>
        )}
      </div>
    </section>
  );
}

function AvailabilityCard({ onMarkDates }: { onMarkDates: () => void }) {
  const { mine } = useAvailability();
  const dates = Object.keys(mine);
  const availCount = dates.filter((d) => mine[d] === "available").length;
  const unavailCount = dates.length - availCount;

  let lastUpdated: string | null = null;
  if (dates.length > 0) {
    const latest = [...dates].sort()[dates.length - 1];
    const [y, m] = latest.split("-").map(Number);
    lastUpdated = formatMonthTitle(y, m - 1);
  }

  return (
    <section>
      <h2 className="label">My availability</h2>
      <div className="card mt-2">
        {dates.length > 0 ? (
          <>
            <p className="text-title text-green">{plural(availCount, "day")} available</p>
            <p className="mt-1 text-title text-red">{plural(unavailCount, "day")} unavailable</p>
            {lastUpdated && (
              <p className="mt-2 text-meta font-normal text-ink-dim">Last updated {lastUpdated}</p>
            )}
          </>
        ) : (
          <>
            <p className="text-base text-ink-dim">No dates marked yet</p>
            <button
              type="button"
              onClick={onMarkDates}
              className="flex h-11 items-center text-base font-semibold text-accent"
            >
              Mark dates
            </button>
          </>
        )}
      </div>
    </section>
  );
}

function LocationCard({ locations }: { locations: LocationsValue }) {
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

function NotificationsCard() {
  const { supported, permission, subscribed, requesting, requestPermission, unsubscribe } =
    usePushNotifications();

  if (!supported) return null;

  return (
    <section>
      <h2 className="label">Notifications</h2>
      <div className="card mt-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-base text-ink">Push notifications</p>
          <Switch
            checked={subscribed}
            disabled={requesting || permission === "denied"}
            onToggle={() => (subscribed ? void unsubscribe() : void requestPermission())}
            ariaLabel="Enable push notifications"
          />
        </div>
        {permission === "denied" && (
          <p className="text-meta font-normal text-ink-dim">
            Notifications blocked. Enable them in your browser settings.
          </p>
        )}
        {permission === "default" && !subscribed && (
          <p className="text-meta font-normal text-ink-dim">
            Get notified when your crew sends messages.
          </p>
        )}
        {subscribed && (
          <p className="text-meta font-normal text-green">Notifications enabled</p>
        )}
        <p className="mt-1 text-meta font-normal text-ink-dim">
          This only affects Hoppz notifications.
        </p>
      </div>
    </section>
  );
}

// ─── Tab 1: Me — Identity ───

interface IdentityCardProps {
  storedFirst: string;
  storedInitial: string;
  pinHash: string | null | undefined;
  onSave: (changes: { displayName?: string; pin?: string }) => Promise<void>;
}

function IdentityCard({ storedFirst, storedInitial, pinHash, onSave }: IdentityCardProps) {
  const [confirmFirst, setConfirmFirst] = useState("");
  const [confirmInitial, setConfirmInitial] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinOk, setPinOk] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [newFirst, setNewFirst] = useState("");
  const [newFirstConfirm, setNewFirstConfirm] = useState("");
  const [newInitial, setNewInitial] = useState("");
  const [newInitialConfirm, setNewInitialConfirm] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newPinConfirm, setNewPinConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!isValidPin(confirmPin) || pinHash === undefined) {
      setPinOk(false);
      return;
    }
    if (pinHash === null) {
      setPinOk(true);
      return;
    }
    let cancelled = false;
    void comparePin(confirmPin, pinHash).then((ok) => {
      if (!cancelled) setPinOk(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [confirmPin, pinHash]);

  const firstOk = norm(confirmFirst) !== "" && norm(confirmFirst) === norm(storedFirst);
  const initialOk = norm(confirmInitial) === norm(storedInitial);
  const unlocked = firstOk && initialOk && pinOk;

  const firstFilled = newFirst.trim() !== "";
  const initialFilled = newInitial.trim() !== "";
  const pinFilled = newPin !== "";
  const firstValid = /^[A-Za-z]{1,15}$/.test(newFirst.trim());
  const initialValid = /^[A-Za-z]$/.test(newInitial.trim());
  const pinValid = isValidPin(newPin);
  const firstPairOk = !firstFilled || (firstValid && norm(newFirstConfirm) === norm(newFirst));
  const initialPairOk =
    !initialFilled || (initialValid && norm(newInitialConfirm) === norm(newInitial));
  const pinPairOk = !pinFilled || (pinValid && newPinConfirm === newPin);
  const anyFilled = firstFilled || initialFilled || pinFilled;
  const nameTouched = firstFilled || initialFilled;

  const nextDisplayName = buildDisplayName(
    firstFilled ? newFirst.trim() : storedFirst,
    initialFilled ? newInitial.trim() : storedInitial,
  );

  const canSave =
    unlocked &&
    anyFilled &&
    firstPairOk &&
    initialPairOk &&
    pinPairOk &&
    (!nameTouched || nextDisplayName !== null) &&
    !saving &&
    !saved;

  const showChanges = (unlocked && editOpen) || saved;

  const resetForm = () => {
    setConfirmFirst("");
    setConfirmInitial("");
    setConfirmPin("");
    setEditOpen(false);
    setNewFirst("");
    setNewFirstConfirm("");
    setNewInitial("");
    setNewInitialConfirm("");
    setNewPin("");
    setNewPinConfirm("");
  };

  const submit = async () => {
    if (!canSave) return;
    setSaving(true);
    const changes: { displayName?: string; pin?: string } = {};
    if (nameTouched && nextDisplayName) changes.displayName = nextDisplayName;
    if (pinFilled) changes.pin = newPin;
    await onSave(changes);
    setSaving(false);
    setSaved(true);
    savedTimer.current = setTimeout(() => {
      setSaved(false);
      resetForm();
    }, SAVED_FLASH_MS);
  };

  return (
    <section>
      <h2 className="label">My identity</h2>
      <div className="card mt-2 flex flex-col gap-3">
        <p className="text-meta font-normal italic text-ink-dim">
          To make changes, confirm your current info first. Changed fields must be entered twice.
        </p>
        <input
          className="input"
          placeholder="Confirm first name"
          autoComplete="off"
          value={confirmFirst}
          onChange={(e) => setConfirmFirst(e.target.value)}
          aria-label="Confirm first name"
        />
        <input
          className="input"
          placeholder="Confirm initial"
          autoComplete="off"
          autoCapitalize="characters"
          maxLength={1}
          value={confirmInitial}
          onChange={(e) =>
            setConfirmInitial(e.target.value.replace(/[^A-Za-z]/g, "").slice(0, 1).toUpperCase())
          }
          aria-label="Confirm last initial"
        />
        <PinField
          placeholder="Confirm PIN"
          value={confirmPin}
          onChange={setConfirmPin}
          ariaLabel="Confirm PIN"
        />
        <button
          type="button"
          disabled={!unlocked}
          onClick={() => setEditOpen(true)}
          className={`btn w-full ${
            unlocked
              ? "bg-accent text-bg hover:brightness-110 active:brightness-95"
              : "border bg-raised text-ink-dim disabled:opacity-100"
          }`}
        >
          Update my profile
        </button>

        {showChanges && (
          <div className="anim-rise flex flex-col gap-3 border-t pt-3">
            <div className="flex flex-col gap-2">
              <input
                className="input"
                placeholder="New first name"
                autoComplete="off"
                maxLength={15}
                value={newFirst}
                onChange={(e) => setNewFirst(e.target.value)}
                aria-label="New first name"
              />
              {firstFilled && (
                <>
                  <input
                    className="input"
                    placeholder="Confirm new first name"
                    autoComplete="off"
                    maxLength={15}
                    value={newFirstConfirm}
                    onChange={(e) => setNewFirstConfirm(e.target.value)}
                    aria-label="Confirm new first name"
                  />
                  {!firstValid ? (
                    <FieldError>Letters only, 1–15 characters.</FieldError>
                  ) : newFirstConfirm !== "" && !firstPairOk ? (
                    <FieldError>Entries don&apos;t match.</FieldError>
                  ) : null}
                </>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <input
                className="input"
                placeholder="New last initial"
                autoComplete="off"
                autoCapitalize="characters"
                maxLength={1}
                value={newInitial}
                onChange={(e) =>
                  setNewInitial(e.target.value.replace(/[^A-Za-z]/g, "").slice(0, 1).toUpperCase())
                }
                aria-label="New last initial"
              />
              {initialFilled && (
                <>
                  <input
                    className="input"
                    placeholder="Confirm new last initial"
                    autoComplete="off"
                    autoCapitalize="characters"
                    maxLength={1}
                    value={newInitialConfirm}
                    onChange={(e) =>
                      setNewInitialConfirm(
                        e.target.value.replace(/[^A-Za-z]/g, "").slice(0, 1).toUpperCase(),
                      )
                    }
                    aria-label="Confirm new last initial"
                  />
                  {newInitialConfirm !== "" && !initialPairOk && (
                    <FieldError>Entries don&apos;t match.</FieldError>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <PinField
                placeholder="New PIN"
                value={newPin}
                onChange={setNewPin}
                ariaLabel="New PIN"
              />
              {pinFilled && (
                <>
                  <PinField
                    placeholder="Confirm new PIN"
                    value={newPinConfirm}
                    onChange={setNewPinConfirm}
                    ariaLabel="Confirm new PIN"
                  />
                  {!pinValid ? (
                    <FieldError>Exactly 2 digits (00–99).</FieldError>
                  ) : newPinConfirm !== "" && !pinPairOk ? (
                    <FieldError>Entries don&apos;t match.</FieldError>
                  ) : null}
                </>
              )}
            </div>

            <button
              type="button"
              disabled={!canSave && !saved}
              onClick={() => void submit()}
              className={`btn w-full ${
                saved
                  ? "bg-green text-bg disabled:opacity-100"
                  : "bg-accent text-bg hover:brightness-110 active:brightness-95"
              }`}
            >
              {saved ? <Icon name="check" size={22} className="anim-rise" /> : "Save changes"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function SwitchIdentityRow({
  displayName,
  onConfirm,
}: {
  displayName: string;
  onConfirm: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="flex h-11 w-full items-center justify-center text-base font-semibold text-ink-dim"
      >
        Not {displayName}? Switch identity
      </button>
      <BottomSheet open={confirmOpen} onClose={() => setConfirmOpen(false)} label="Switch identity">
        <p className="px-1 pb-3 pt-1 text-base text-ink">
          Sign out as {displayName}? You&apos;ll need your PIN to sign back in.
        </p>
        <button
          type="button"
          onClick={() => setConfirmOpen(false)}
          className="flex h-11 w-full items-center justify-center text-base font-medium text-ink-muted"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex h-11 w-full items-center justify-center text-base font-semibold text-red"
        >
          Sign out
        </button>
      </BottomSheet>
    </div>
  );
}

// ─── Tab 1: Me — Role Card ───

function RoleCard({ role }: { role: NonNullable<UserRole> }) {
  const isSA = role === "super_admin";
  const colorClass = isSA ? "text-accent" : "text-green";

  return (
    <section className="mt-4">
      <div className="card">
        <div className="flex items-center gap-2">
          <Icon name={ROLE_BADGE_ICONS[role]} size={20} className={colorClass} />
          <span className={`text-title ${colorClass}`}>{ROLE_LABELS[role]}</span>
        </div>
        {isSA ? (
          <p className="mt-2 text-meta font-normal text-ink-muted">Full access</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
            <div>
              <p className="text-meta font-semibold text-green">Can do</p>
              {MODERATOR_PERMISSIONS.map((p) => (
                <div key={p} className="mt-1 flex items-start gap-1.5">
                  <Icon name="check" size={14} className="mt-0.5 flex-none text-green" />
                  <span className="text-meta font-normal text-ink-muted">{p}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-meta font-semibold text-red">Cannot do</p>
              {MODERATOR_RESTRICTIONS.map((r) => (
                <div key={r} className="mt-1 flex items-start gap-1.5">
                  <Icon name="close" size={14} className="mt-0.5 flex-none text-red" />
                  <span className="text-meta font-normal text-ink-muted">{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Tab 3: About — Notes ───

function NotesSection({ voterId }: { voterId: string }) {
  const [notes, setNotes] = useState<VoterNoteRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (deleteTimer.current) clearTimeout(deleteTimer.current);
    };
  }, []);

  const fetchNotes = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    try {
      const { data, error } = await sb
        .from("v2_voter_notes")
        .select("id,voter_id,content,sort_order,created_at")
        .eq("voter_id", voterId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (!error && data) setNotes(data as VoterNoteRow[]);
    } catch {
      // silent
    }
    setLoaded(true);
  }, [voterId]);

  useEffect(() => {
    void fetchNotes();
  }, [fetchNotes]);

  const addNote = async (content: string) => {
    const sb = getSupabase();
    if (!sb) return;
    const id = crypto.randomUUID();
    const row: VoterNoteRow = {
      id,
      voter_id: voterId,
      content,
      sort_order: notes.length,
      created_at: new Date().toISOString(),
    };
    setNotes((prev) => [...prev, row]);
    setDraft("");
    setAdding(false);
    try {
      await sb.from("v2_voter_notes").insert(row);
    } catch {
      // silent
    }
  };

  const deleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setDeletingId(null);
    const sb = getSupabase();
    if (!sb) return;
    try {
      await sb.from("v2_voter_notes").delete().eq("id", id);
    } catch {
      // silent
    }
  };

  const startDelete = (id: string) => {
    setDeletingId(id);
    if (deleteTimer.current) clearTimeout(deleteTimer.current);
    deleteTimer.current = setTimeout(() => setDeletingId(null), 2000);
  };

  const charCount = draft.length;
  const canSave = charCount > 0 && charCount <= 280;

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-title text-ink">About me</h2>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex h-11 w-11 items-center justify-center text-accent"
          aria-label="Add note"
        >
          <Icon name="add_circle" size={24} />
        </button>
      </div>

      {adding && (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            className="input min-h-[80px] resize-none"
            placeholder="Write something about yourself..."
            maxLength={280}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
          <p className="text-right text-meta text-ink-dim">{charCount} / 280</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setDraft("");
                setAdding(false);
              }}
              className="flex h-11 items-center text-base text-ink-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSave}
              onClick={() => void addNote(draft)}
              className="btn-accent flex-1"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {loaded && notes.length === 0 && !adding && (
        <p className="mt-2 text-base text-ink-dim">No notes yet</p>
      )}

      <div className="mt-3 flex flex-col gap-3">
        {notes.map((note) => (
          <div key={note.id} className="card relative">
            <p className="text-base text-ink" style={{ wordBreak: "break-word" }}>
              {note.content}
            </p>
            <p className="mt-1 text-meta text-ink-dim">
              {new Date(note.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <div className="absolute right-2 top-2">
              {deletingId === note.id ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void deleteNote(note.id)}
                    className="text-meta font-semibold text-red"
                  >
                    Delete?
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(null)}
                    className="flex h-11 w-11 items-center justify-center text-ink-dim"
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startDelete(note.id)}
                  className="flex h-11 w-11 items-center justify-center text-ink-dim"
                  aria-label="Delete note"
                >
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Identity gate ───

function IdentityGate() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-center gap-3 pt-10 text-center">
      <Icon name="person" size={40} className="text-ink-dim" />
      <h2 className="text-title text-ink">No identity yet</h2>
      <p className="text-meta font-normal text-ink-muted">
        Create your identity to vote, mark dates, and share your location.
      </p>
      <button type="button" className="btn-accent w-full max-w-sm" onClick={() => setOpen(true)}>
        Create identity
      </button>
      <NamePrompt open={open} flow="new" onCancel={() => setOpen(false)} onDone={() => setOpen(false)} />
    </div>
  );
}

// ─── Profile body (tabbed) ───

function ProfileBody({
  onClose,
  onNavigate,
}: {
  onClose: () => void;
  onNavigate: (path: string) => void;
}) {
  const { voterId, name, voters, updateProfile, signOut } = useGroupData();
  const locations = useLocations();
  const [activeTab, setActiveTab] = useState<ProfileTab>("me");
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [secure, setSecure] = useState<{ pinHash: string | null; createdAt: string | null } | null>(
    null,
  );
  const loadSecure = useCallback(async () => {
    const sb = getSupabase();
    if (!sb || !voterId) {
      setSecure({ pinHash: null, createdAt: null });
      return;
    }
    try {
      const { data, error } = await sb
        .from("v2_voters")
        .select("pin_hash,created_at")
        .eq("voter_id", voterId)
        .maybeSingle();
      if (error) throw error;
      setSecure({
        pinHash: (data?.pin_hash as string | null) ?? null,
        createdAt: (data?.created_at as string | null) ?? null,
      });
    } catch {
      setSecure({ pinHash: null, createdAt: null });
    }
  }, [voterId]);

  useEffect(() => {
    void loadSecure();
  }, [loadSecure]);

  const handleSave = useCallback(
    async (changes: { displayName?: string; pin?: string }) => {
      await updateProfile(changes);
      if (changes.pin) await loadSecure();
    },
    [updateProfile, loadSecure],
  );

  if (!name) return <IdentityGate />;

  const myRow = voters.find((v) => v.voter_id === voterId);
  const displayName = (myRow?.display_name ?? myRow?.name ?? name).trim();
  const pinColor = myRow?.pin_color ?? getStoredPinColor() ?? PIN_COLORS[0];
  const spaceIdx = displayName.lastIndexOf(" ");
  const storedFirst = spaceIdx > 0 ? displayName.slice(0, spaceIdx) : displayName;
  const storedInitial = spaceIdx > 0 ? displayName.slice(spaceIdx + 1) : "";
  const memberSince = secure?.createdAt
    ? new Date(secure.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const role = getRoleForVoter(voterId, myRow?.role ?? null);

  const handleAvatarTap = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCropFile(file);
    if (e.target) e.target.value = "";
  };

  const handleCropConfirm = async (blob: Blob) => {
    setCropFile(null);
    setUploading(true);
    const result = await uploadAvatar(blob, voterId);
    if (result.ok) {
      storeAvatarUrl(result.url);
      await updateProfile({ avatar_url: result.url });
    }
    setUploading(false);
  };

  return (
    <>
      <TabBar active={activeTab} onChange={setActiveTab} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-6">
          {activeTab === "me" && (
            <>
              {/* Avatar section */}
              <div className="flex flex-col items-center text-center">
                <button
                  type="button"
                  onClick={handleAvatarTap}
                  className="relative"
                  aria-label="Change profile photo"
                  disabled={uploading}
                >
                  <Avatar
                    voter={{
                      display_name: displayName,
                      name: displayName,
                      pin_color: pinColor,
                      avatar_url: myRow?.avatar_url,
                    }}
                    size={80}
                  />
                  {uploading && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                      <Icon name="hourglass_empty" size={24} className="animate-pulse text-white" />
                    </span>
                  )}
                </button>
                <p className="mt-1 text-meta text-ink-muted">Edit photo</p>
                <p className="mt-2 text-display text-ink">{displayName}</p>
                {role && (
                  <div className="mt-1">
                    <RoleBadge role={role} size="md" />
                  </div>
                )}
                {memberSince && (
                  <p className="mt-1 text-meta font-normal text-ink-dim">
                    Member since {memberSince}
                  </p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelected}
                />
              </div>

              {role && <RoleCard role={role} />}

              <IdentityCard
                storedFirst={storedFirst}
                storedInitial={storedInitial}
                pinHash={secure === null ? undefined : secure.pinHash}
                onSave={handleSave}
              />

              <SwitchIdentityRow
                displayName={displayName}
                onConfirm={() => {
                  signOut();
                  onClose();
                }}
              />
            </>
          )}

          {activeTab === "trip" && (
            <>
              <TripStatusCard />
              <VoteCard onGoVote={() => onNavigate("/plan/cities")} />
              <AvailabilityCard onMarkDates={() => onNavigate("/plan/calendar")} />
              <LocationCard locations={locations} />
              <NotificationsCard />
            </>
          )}

          {activeTab === "about" && <NotesSection voterId={voterId} />}
        </div>
      </div>

      {cropFile && (
        <AvatarCropper
          imageFile={cropFile}
          onConfirm={(blob) => void handleCropConfirm(blob)}
          onCancel={() => setCropFile(null)}
        />
      )}
    </>
  );
}

// ─── Overlay shell ───

interface ProfileOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileOverlay({ open, onClose }: ProfileOverlayProps) {
  const router = useRouter();
  const dragY = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    window.history.pushState({ profile: true }, "");
    const handlePop = () => onCloseRef.current();
    window.addEventListener("popstate", handlePop);
    return () => {
      window.removeEventListener("popstate", handlePop);
    };
  }, [open]);

  const requestClose = useCallback(() => {
    if (window.history.state?.profile) {
      window.history.back();
    } else {
      onCloseRef.current();
    }
  }, []);

  const navTo = useCallback(
    (path: string) => {
      onCloseRef.current();
      if (window.history.state?.profile) router.replace(path);
      else router.push(path);
    },
    [router],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKey);
    lockBodyScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      unlockBodyScroll();
    };
  }, [open, requestClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Profile"
      className="anim-sheet fixed inset-0 z-50 flex flex-col bg-bg"
    >
      <header
        className="flex h-14 flex-none items-center justify-between border-b bg-bg px-2"
        style={{ touchAction: "none" }}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          dragY.current = e.clientY;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (dragY.current !== null && e.clientY - dragY.current > SWIPE_CLOSE_PX) {
            dragY.current = null;
            requestClose();
          }
        }}
        onPointerUp={() => {
          dragY.current = null;
        }}
        onPointerCancel={() => {
          dragY.current = null;
        }}
      >
        <button
          type="button"
          aria-label="Close profile"
          onClick={requestClose}
          className="flex h-11 w-11 items-center justify-center text-ink"
        >
          <Icon name="arrow_back" size={24} />
        </button>
        <h1 className="text-title text-ink">Profile</h1>
        <span className="h-11 w-11" aria-hidden="true" />
      </header>

      <ProfileBody onClose={requestClose} onNavigate={navTo} />
    </div>
  );
}
