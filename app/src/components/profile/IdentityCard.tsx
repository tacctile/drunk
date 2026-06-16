"use client";

import { useEffect, useRef, useState } from "react";
import { compare as comparePin } from "bcryptjs";
import { buildDisplayName, isValidPin } from "@/lib/identity";
import { FieldError } from "@/components/FieldError";
import { Icon } from "@/components/Icon";

const SAVED_FLASH_MS = 1200;

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
      <h2 className="label">My identity</h2>
      <div className="card mt-2 flex flex-col gap-3">
        {!showEditFields ? (
          <>
            <p className="text-meta font-normal italic text-ink-dim">
              Enter your PIN to make changes.
            </p>
            <PinField
              placeholder="Current PIN"
              value={unlockPin}
              onChange={setUnlockPin}
              ariaLabel="Current PIN"
            />
            {pinError && <FieldError>{pinError}</FieldError>}
          </>
        ) : (
          <div className="anim-rise flex flex-col gap-3">
            <input
              className="input"
              placeholder="New first name"
              autoComplete="off"
              maxLength={15}
              value={newFirst}
              onChange={(e) => setNewFirst(e.target.value)}
              aria-label="New first name"
            />
            {firstFilled && !firstValid && (
              <FieldError>Letters only, 1–15 characters.</FieldError>
            )}

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

            <PinField
              placeholder="New PIN"
              value={newPin}
              onChange={setNewPin}
              ariaLabel="New PIN"
            />
            {pinFilled && !pinValid && (
              <FieldError>Exactly 2 digits (00–99).</FieldError>
            )}

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
