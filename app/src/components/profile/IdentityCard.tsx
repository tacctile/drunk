"use client";

import { useEffect, useRef, useState } from "react";
import { compare as comparePin } from "bcryptjs";
import { buildDisplayName, isValidPin } from "@/lib/identity";
import { FieldError } from "@/components/FieldError";
import { Icon } from "@/components/Icon";

const SAVED_FLASH_MS = 1200;

function norm(s: string): string {
  return s.trim().toLowerCase();
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

export interface IdentityCardProps {
  storedFirst: string;
  storedInitial: string;
  pinHash: string | null | undefined;
  onSave: (changes: { displayName?: string; pin?: string }) => Promise<void>;
}

export function IdentityCard({ storedFirst, storedInitial, pinHash, onSave }: IdentityCardProps) {
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
