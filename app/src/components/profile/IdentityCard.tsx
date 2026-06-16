"use client";

import { useEffect, useRef, useState } from "react";
import { compare as comparePin } from "bcryptjs";
import { buildDisplayName, isValidPin } from "@/lib/identity";
import { FieldError } from "@/components/FieldError";
import { Icon } from "@/components/Icon";
import { SectionLabel, Card, PinInput, TextField, ActionButton } from "@hoppz-ui";

const SAVED_FLASH_MS = 1200;

export interface IdentityCardProps {
  storedFirst: string;
  storedInitial: string;
  pinHash: string | null | undefined;
  onSave: (changes: { displayName?: string; pin?: string }) => Promise<void>;
}

export function IdentityCard({ storedFirst, storedInitial, pinHash, onSave }: IdentityCardProps) {
  const [unlockPin, setUnlockPin] = useState("");
  const [pinOk, setPinOk] = useState(false);
  const [pinError, setPinError] = useState("");
  const [newFirst, setNewFirst] = useState("");
  const [newInitial, setNewInitial] = useState("");
  const [newPin, setNewPin] = useState("");
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
    if (!isValidPin(unlockPin) || pinHash === undefined) {
      setPinOk(false);
      setPinError("");
      return;
    }
    if (pinHash === null) {
      setPinOk(true);
      setPinError("");
      return;
    }
    let cancelled = false;
    void comparePin(unlockPin, pinHash).then((ok) => {
      if (cancelled) return;
      setPinOk(ok);
      setPinError(ok ? "" : "Incorrect PIN");
    });
    return () => {
      cancelled = true;
    };
  }, [unlockPin, pinHash]);

  const firstFilled = newFirst.trim() !== "";
  const initialFilled = newInitial.trim() !== "";
  const pinFilled = newPin !== "";
  const firstValid = !firstFilled || /^[A-Za-z]{1,15}$/.test(newFirst.trim());
  const initialValid = !initialFilled || /^[A-Za-z]$/.test(newInitial.trim());
  const pinValid = !pinFilled || isValidPin(newPin);
  const anyFilled = firstFilled || initialFilled || pinFilled;
  const nameTouched = firstFilled || initialFilled;

  const nextDisplayName = buildDisplayName(
    firstFilled ? newFirst.trim() : storedFirst,
    initialFilled ? newInitial.trim() : storedInitial,
  );

  const canSave =
    pinOk &&
    anyFilled &&
    firstValid &&
    initialValid &&
    pinValid &&
    (!nameTouched || nextDisplayName !== null) &&
    !saving &&
    !saved;

  const resetForm = () => {
    setUnlockPin("");
    setPinOk(false);
    setPinError("");
    setNewFirst("");
    setNewInitial("");
    setNewPin("");
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

  const showEditFields = pinOk || saved;

  return (
    <section>
      <SectionLabel>My identity</SectionLabel>
      <Card className="mt-2 flex flex-col gap-3">
        {!showEditFields ? (
          <>
            <p className="text-meta font-normal italic text-ink-dim">
              Enter your PIN to make changes.
            </p>
            <PinInput value={unlockPin} onChange={(v) => setUnlockPin(v)} maxLength={2} placeholder="Current PIN" />
            {pinError && <FieldError>{pinError}</FieldError>}
          </>
        ) : (
          <div className="anim-rise flex flex-col gap-3">
            <TextField label="First name" value={newFirst} onChange={(v) => setNewFirst(v)} maxLength={15} placeholder="New first name" />
            {firstFilled && !firstValid && (
              <FieldError>Letters only, 1–15 characters.</FieldError>
            )}

            <TextField label="Last initial" value={newInitial} onChange={(v) => setNewInitial(v.replace(/[^A-Za-z]/g, "").slice(0, 1).toUpperCase())} maxLength={1} placeholder="New last initial" />

            <PinInput value={newPin} onChange={(v) => setNewPin(v)} maxLength={2} placeholder="New PIN" />
            {pinFilled && !pinValid && (
              <FieldError>Exactly 2 digits (00–99).</FieldError>
            )}

            {saved ? (
              <button type="button" disabled className="btn w-full bg-green text-bg disabled:opacity-100">
                <Icon name="check" size={22} className="anim-rise" />
              </button>
            ) : (
              <ActionButton label="Save changes" variant="filled" fullWidth onClick={() => void submit()} />
            )}
          </div>
        )}
      </Card>
    </section>
  );
}
