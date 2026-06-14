"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { hash as hashPin } from "bcryptjs";
import { ActiveLocationsPanel } from "@/components/ActiveLocationsPanel";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { RoleBadge } from "@/components/RoleBadge";
import { TripResetsPanel } from "@/components/TripResetsPanel";
import { TripSetupPanel } from "@/components/TripSetupPanel";
import { useGroupData } from "@/hooks/useGroupData";
import { useTripData } from "@/hooks/useTripData";
import { MAX_FIRST_NAME_LENGTH, buildDisplayName, isValidPin } from "@/lib/identity";
import {
  getRoleForVoter,
  MODERATOR_PERMISSIONS,
  MODERATOR_RESTRICTIONS,
} from "@/lib/roles";
import { getSupabase, type TripMemberStatus } from "@/lib/supabase";

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
    <div className="flex gap-2">
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
            className={`btn h-9 text-[12px] px-3 ${cls}`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

function FieldError({ children }: { children: string }) {
  return (
    <p className="text-[12px] font-medium text-red" role="alert">
      {children}
    </p>
  );
}

interface CrewCardProps {
  voter: {
    voter_id: string;
    name: string;
    display_name: string | null;
    pin_color: string;
    avatar_url: string | null;
    role: string | null;
  };
  tripStatus: TripMemberStatus;
  onTripStatusChange: (s: TripMemberStatus) => void;
  onNameSaved: () => void;
}

function CrewCard({ voter, tripStatus, onTripStatusChange, onNameSaved }: CrewCardProps) {
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [resetPinOpen, setResetPinOpen] = useState(false);

  const displayName = voter.display_name ?? voter.name;
  const lastSpace = displayName.lastIndexOf(" ");
  const [first, setFirst] = useState(lastSpace > 0 ? displayName.slice(0, lastSpace) : displayName);
  const [initial, setInitial] = useState(
    lastSpace > 0 ? displayName.slice(lastSpace + 1, lastSpace + 2).toUpperCase() : "",
  );
  const [nameErrors, setNameErrors] = useState<{ first?: string; initial?: string; save?: string }>({});
  const [nameBusy, setNameBusy] = useState(false);

  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinErrors, setPinErrors] = useState<{ pin?: string; save?: string }>({});
  const [pinBusy, setPinBusy] = useState(false);

  const role = getRoleForVoter(voter.voter_id, voter.role);

  const statusConfig: Record<TripMemberStatus, { icon: string; color: string; label: string }> = {
    on_trip: { icon: "check_circle", color: "var(--green)", label: "On Trip" },
    remote: { icon: "wifi", color: "var(--accent)", label: "Remote" },
    out: { icon: "cancel", color: "var(--ink-dim)", label: "Out" },
  };
  const cfg = statusConfig[tripStatus];

  const saveName = async () => {
    if (nameBusy) return;
    const next: typeof nameErrors = {};
    if (!/^[A-Za-z]{1,15}$/.test(first.trim())) next.first = "Letters only, 1–15 characters.";
    if (!/^[A-Za-z]$/.test(initial)) next.initial = "Exactly one letter.";
    setNameErrors(next);
    if (next.first || next.initial) return;
    const newDisplayName = buildDisplayName(first.trim(), initial);
    if (!newDisplayName) return;
    const sb = getSupabase();
    if (!sb) {
      setNameErrors({ save: "Couldn't save. Try again." });
      return;
    }
    setNameBusy(true);
    try {
      const { error } = await sb
        .from("v2_voters")
        .update({
          name: newDisplayName,
          display_name: newDisplayName,
          updated_at: new Date().toISOString(),
        })
        .eq("voter_id", voter.voter_id);
      if (error) throw error;
      await sb
        .from("v2_locations")
        .update({ display_name: newDisplayName })
        .eq("voter_id", voter.voter_id);
      setEditNameOpen(false);
      onNameSaved();
    } catch {
      setNameErrors({ save: "Couldn't save. Try again." });
    }
    setNameBusy(false);
  };

  const savePin = async () => {
    if (pinBusy) return;
    const next: typeof pinErrors = {};
    if (!isValidPin(newPin)) next.pin = "Exactly 2 digits (00–99).";
    else if (newPin !== confirmPin) next.pin = "PINs don't match.";
    setPinErrors(next);
    if (next.pin) return;
    const sb = getSupabase();
    if (!sb) {
      setPinErrors({ save: "Couldn't save. Try again." });
      return;
    }
    setPinBusy(true);
    try {
      const pinHash = await hashPin(newPin, 10);
      const { error } = await sb
        .from("v2_voters")
        .update({
          pin_hash: pinHash,
          pin_plain: newPin,
          updated_at: new Date().toISOString(),
        })
        .eq("voter_id", voter.voter_id);
      if (error) throw error;
      setResetPinOpen(false);
      setNewPin("");
      setConfirmPin("");
      setPinErrors({});
    } catch {
      setPinErrors({ save: "Couldn't save. Try again." });
    }
    setPinBusy(false);
  };

  return (
    <div className="card mb-3">
      <div className="flex items-center gap-3">
        <Avatar
          voter={{
            display_name: displayName,
            name: voter.name,
            pin_color: voter.pin_color,
            avatar_url: voter.avatar_url,
          }}
          size={40}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-title text-ink">{displayName}</p>
            {role && <RoleBadge role={role} size="sm" />}
          </div>
        </div>
        <span
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{ background: `color-mix(in srgb, ${cfg.color} 15%, transparent)`, color: cfg.color }}
        >
          <Icon name={cfg.icon} size={14} />
          {cfg.label}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setEditNameOpen(!editNameOpen); setResetPinOpen(false); }}
          className="btn-ghost h-9 text-meta"
        >
          <Icon name="edit" size={16} />
          Edit Name
        </button>
        <button
          type="button"
          onClick={() => { setResetPinOpen(!resetPinOpen); setEditNameOpen(false); }}
          className="btn-ghost h-9 text-meta"
        >
          <Icon name="lock_reset" size={16} />
          Reset PIN
        </button>
      </div>

      <div className="mt-3">
        <TripStatusButtons current={tripStatus} onChange={onTripStatusChange} />
      </div>

      {editNameOpen && (
        <div className="mt-3 border-t pt-3">
          <div className="flex flex-col gap-2">
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
              {nameErrors.first && <FieldError>{nameErrors.first}</FieldError>}
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
              {nameErrors.initial && <FieldError>{nameErrors.initial}</FieldError>}
            </div>
            {nameErrors.save && <FieldError>{nameErrors.save}</FieldError>}
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-ghost flex-1"
                onClick={() => setEditNameOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-accent flex-1"
                disabled={nameBusy}
                onClick={() => void saveName()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {resetPinOpen && (
        <div className="mt-3 border-t pt-3">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <input
                className="input"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="New PIN (2 digits)"
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
              {pinErrors.pin && <FieldError>{pinErrors.pin}</FieldError>}
            </div>
            {pinErrors.save && <FieldError>{pinErrors.save}</FieldError>}
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-ghost flex-1"
                onClick={() => {
                  setResetPinOpen(false);
                  setNewPin("");
                  setConfirmPin("");
                  setPinErrors({});
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-accent flex-1"
                disabled={pinBusy}
                onClick={() => void savePin()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ModeratorPage() {
  const router = useRouter();
  const { voterId, voters } = useGroupData();
  const { members, setMemberStatus } = useTripData();
  const myRow = voters.find((v) => v.voter_id === voterId);
  const myRole = getRoleForVoter(voterId, myRow?.role ?? null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (myRole !== "moderator") router.replace("/plan");
  }, [myRole, router]);

  if (myRole !== "moderator") return null;

  const activeVoters = voters
    .filter((v) => v.is_active)
    .sort((a, b) =>
      (a.display_name ?? a.name).localeCompare(b.display_name ?? b.name),
    );

  const getMemberStatus = (vid: string): TripMemberStatus =>
    members.find((m) => m.voter_id === vid)?.trip_status ?? "on_trip";

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-bg">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-1 px-4">
          <button
            type="button"
            onClick={() => router.push("/plan")}
            aria-label="Back"
            className="-ml-2 flex h-11 w-11 flex-none items-center justify-center text-ink-muted transition hover:text-ink"
          >
            <Icon name="arrow_back" size={22} />
          </button>
          <h1 className="text-title font-bold text-ink">Crew Management</h1>
        </div>
      </header>

      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pb-32 pt-4">
        {/* Section 1 — Your Role */}
        <div className="card mb-6">
          <RoleBadge role="moderator" size="md" />
          <p className="mt-2 text-base text-ink-muted">
            You have moderator access. You can help manage the crew and trip details.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <p className="text-meta font-semibold text-ink">You can:</p>
              <ul className="mt-1 flex flex-col gap-1">
                {MODERATOR_PERMISSIONS.map((perm) => (
                  <li key={perm} className="flex items-start gap-1.5 text-meta text-ink-muted">
                    <Icon name="check_circle" size={14} className="mt-0.5 flex-none text-green" />
                    <span>{perm}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-meta font-semibold text-ink">You cannot:</p>
              <ul className="mt-1 flex flex-col gap-1">
                {MODERATOR_RESTRICTIONS.map((restriction) => (
                  <li key={restriction} className="flex items-start gap-1.5 text-meta text-ink-muted">
                    <Icon name="cancel" size={14} className="mt-0.5 flex-none text-red" />
                    <span>{restriction}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Section 2 — Trip Setup */}
        <TripSetupPanel canClear={false} />

        {/* Section 3 — Crew Members */}
        <section className="flex flex-col gap-3">
          <h2 className="label">Crew members</h2>
          {activeVoters.length === 0 && (
            <p className="text-meta font-normal text-ink-dim">No crew members.</p>
          )}
          {activeVoters.map((voter) => (
            <CrewCard
              key={voter.voter_id}
              voter={voter}
              tripStatus={getMemberStatus(voter.voter_id)}
              onTripStatusChange={(s) => void setMemberStatus(voter.voter_id, s)}
              onNameSaved={() => forceUpdate((n) => n + 1)}
            />
          ))}
        </section>

        {/* Section 4 — Active Locations */}
        <ActiveLocationsPanel />

        {/* Section 5 — Trip Resets */}
        <TripResetsPanel />
      </div>
    </>
  );
}
