"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { hash as hashPin } from "bcryptjs";
import { ActiveLocationsPanel } from "@/components/ActiveLocationsPanel";
import { Avatar } from "@/components/Avatar";
import { FieldError } from "@/components/FieldError";
import { Icon } from "@/components/Icon";
import { RoleBadge } from "@/components/RoleBadge";
import { TripResetsPanel } from "@/components/TripResetsPanel";
import { TripSetupPanel } from "@/components/TripSetupPanel";
import { TopAppBar, Card, SectionLabel, ActionButton, TextField } from "@hoppz-ui";
import { useGroupData } from "@/hooks/useGroupData";
import { useLocations } from "@/hooks/useLocations";
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
    <Card className="mb-3">
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
        <ActionButton
          variant="ghost"
          label="Edit Name"
          icon="edit"
          onClick={() => { setEditNameOpen(!editNameOpen); setResetPinOpen(false); }}
        />
        <ActionButton
          variant="ghost"
          label="Reset PIN"
          icon="lock_reset"
          onClick={() => { setResetPinOpen(!resetPinOpen); setEditNameOpen(false); }}
        />
      </div>

      <div className="mt-3">
        <TripStatusButtons current={tripStatus} onChange={onTripStatusChange} />
      </div>

      {editNameOpen && (
        <div className="mt-3 border-t pt-3">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <TextField
                label="First name"
                value={first}
                onChange={setFirst}
                maxLength={MAX_FIRST_NAME_LENGTH}
                placeholder="First name"
              />
              {nameErrors.first && <FieldError>{nameErrors.first}</FieldError>}
            </div>
            <div className="flex flex-col gap-1">
              <TextField
                label="Last initial"
                value={initial}
                onChange={(v) => setInitial(v.replace(/[^A-Za-z]/g, "").slice(0, 1).toUpperCase())}
                maxLength={1}
                placeholder="Initial"
              />
              {nameErrors.initial && <FieldError>{nameErrors.initial}</FieldError>}
            </div>
            {nameErrors.save && <FieldError>{nameErrors.save}</FieldError>}
            <div className="flex gap-2">
              <ActionButton variant="ghost" label="Cancel" onClick={() => setEditNameOpen(false)} />
              <ActionButton variant="filled" label="Save" onClick={() => void saveName()} />
            </div>
          </div>
        </div>
      )}

      {resetPinOpen && (
        <div className="mt-3 border-t pt-3">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <TextField
                label="New PIN"
                value={newPin}
                onChange={(v) => setNewPin(v.replace(/\D/g, "").slice(0, 2))}
                maxLength={2}
                placeholder="New PIN (2 digits)"
              />
              {newPin && (
                <TextField
                  label="Confirm PIN"
                  value={confirmPin}
                  onChange={(v) => setConfirmPin(v.replace(/\D/g, "").slice(0, 2))}
                  maxLength={2}
                  placeholder="Confirm new PIN"
                />
              )}
              {pinErrors.pin && <FieldError>{pinErrors.pin}</FieldError>}
            </div>
            {pinErrors.save && <FieldError>{pinErrors.save}</FieldError>}
            <div className="flex gap-2">
              <ActionButton
                variant="ghost"
                label="Cancel"
                onClick={() => {
                  setResetPinOpen(false);
                  setNewPin("");
                  setConfirmPin("");
                  setPinErrors({});
                }}
              />
              <ActionButton variant="filled" label="Save" onClick={() => void savePin()} />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function ModeratorPage() {
  const router = useRouter();
  const { voterId, voters } = useGroupData();
  const { activeLocations } = useLocations();
  const { members, setMemberStatus } = useTripData();
  const myRow = voters.find((v) => v.voter_id === voterId);
  const myRole = getRoleForVoter(voterId, myRow?.role ?? null);
  const [, forceUpdate] = useState(0);

  const activeVoters = voters
    .filter((v) => v.is_active)
    .sort((a, b) =>
      (a.display_name ?? a.name).localeCompare(b.display_name ?? b.name),
    );

  const getMemberStatus = (vid: string): TripMemberStatus =>
    members.find((m) => m.voter_id === vid)?.trip_status ?? "on_trip";

  return (
    <>
      <TopAppBar
        title="Crew Management"
        leadingIcon="arrow_back"
        onLeadingAction={() => router.push("/plan")}
        position="sticky"
      />

      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pb-32 pt-4">
        {/* Section 1 — Your Role */}
        <Card className="mb-6">
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
        </Card>

        {/* Section 2 — Trip Setup */}
        <TripSetupPanel canClear={false} />

        {/* Section 3 — Crew Members */}
        <section className="flex flex-col gap-3">
          <SectionLabel>Crew members</SectionLabel>
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
        <ActiveLocationsPanel locations={activeLocations} />

        {/* Section 5 — Trip Resets */}
        <TripResetsPanel />
      </div>
    </>
  );
}
